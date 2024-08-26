import { v4 as uuid } from 'uuid'
import bugsnag from '../../bugsnag'
import { VError } from 'verror'
import { log } from '../../helpers/LogHelper'

export interface OTRange {
    index: number
    length: number
}

export interface OTOperation {
    ops?: any
    compose(other: OTOperation): OTOperation
    transform(other: OTOperation, priority?: boolean): OTOperation
    transformPosition(index: number, priority?: boolean): number
}

export interface OTOperationGeneric<T extends OTOperation> {
    compose(other: T): T
    transform(other: T, priority?: boolean): T
    transformPosition(index: number, priority?: boolean): number
}

export interface OTState {
    applyClient(
        client: OTEditorClient,
        operation: OTOperation,
        inverseOperation: OTOperation
    ): OTState
    applyServer(client: OTEditorClient, operation: OTOperation): OTState
    serverAck(client: OTEditorClient): OTState
    resend?(client: OTEditorClient): void
    serverRollback(client: OTEditorClient): OTState
    transformCursor(cursor: OTRange): OTRange
}

export class Synchronized implements OTState {
    public static instance: Synchronized

    public static getInstance() {
        if (this.instance === null || this.instance === undefined) {
            this.instance = new Synchronized()
        }
        return this.instance
    }

    applyClient(
        client: OTEditorClient,
        operation: OTOperation,
        inverseOperation: OTOperation
    ): OTState {
        log('synchronized!')
        const submissionId = uuid()
        client.sendOperation(client.revision, operation, submissionId)
        // tslint:disable-next-line:no-use-before-declare
        return new AwaitingConfirm(operation, submissionId, inverseOperation)
    }

    applyServer(client: OTEditorClient, operation: OTOperation): OTState {
        // When we receive a new operation from the server, the operation can be
        // simply applied to the current document
        client.applyOperation(operation)
        return this
    }

    serverAck(client: OTEditorClient): OTState {
        throw new Error('There is no pending operation.')
    }

    serverRollback(client: OTEditorClient): OTState {
        throw new Error('There is no pending operation.')
    }

    // Nothing to do because the latest server state and client state are the same.
    transformCursor(cursor: OTRange) {
        return cursor
    }
}

export class AwaitingConfirm implements OTState {
    outstanding: OTOperation
    submissionId: string
    inverseOutstanding: OTOperation

    constructor(
        outstanding: OTOperation,
        submissionId: string,
        inverseOutstanding: OTOperation
    ) {
        // Save the pending operation
        this.outstanding = outstanding
        this.submissionId = submissionId
        this.inverseOutstanding = inverseOutstanding
        log('AwaitingConfirm created')
    }

    applyClient(
        client: OTEditorClient,
        operation: OTOperation,
        inverseOperation: OTOperation
    ): OTState {
        log('OTCLIENT - send op', operation)
        // When the user makes an edit, don't send the operation immediately,
        // instead switch to 'AwaitingWithBuffer' state
        // tslint:disable-next-line:no-use-before-declare
        return new AwaitingWithBuffer(
            this.outstanding,
            operation,
            this.submissionId,
            this.inverseOutstanding,
            inverseOperation
        )
    }

    applyServer(client: OTEditorClient, operation: OTOperation): OTState {
        // This is another client's operation. Visualization:
        //
        //                   /\
        // this.outstanding /  \ operation
        //                 /    \
        //                 \    /
        //  pair[1]         \  / pair[0] (new outstanding)
        //  (can be applied  \/
        //  to the client's
        //  current document)
        const pair = transformX(this.outstanding, operation)
        const inverseOutstandingPair = transformX(
            this.inverseOutstanding,
            operation
        )
        client.applyOperation(pair[1])
        return new AwaitingConfirm(
            pair[0],
            this.submissionId,
            inverseOutstandingPair[0]
        )
    }

    serverAck(client: OTEditorClient): OTState {
        // The client's operation has been acknowledged
        // => switch to synchronized state
        return Synchronized.getInstance()
    }

    transformCursor(cursor: OTRange) {
        return {
            index: this.outstanding.transformPosition(cursor.index),
            length: cursor.length
        }
    }

    resend(client: OTEditorClient) {
        // The confirm didn't come because the client was disconnected.
        // Now that it has reconnected, we resend the outstanding operation.
        client.sendOperation(
            client.revision,
            this.outstanding,
            this.submissionId
        )
    }

    serverRollback(client: OTEditorClient): OTState {
        try {
            client.applyOperation(this.inverseOutstanding)
        } catch (e) {
            bugsnag.notify(new VError(e, 'RollbackFailed'), {
                metadata: {
                    rollbackFailed: true
                }
            })
            client.trigger('rollback-failed')
        }

        return Synchronized.getInstance()
    }
}

export class AwaitingWithBuffer implements OTState {
    outstanding: OTOperation
    buffer: OTOperation
    submissionId: string
    inverseOutstanding: OTOperation
    inverseBuffer: OTOperation

    // tslint:disable-next-line:max-line-length
    constructor(
        outstanding: OTOperation,
        buffer: OTOperation,
        submissionId: string,
        inverseOutstanding: OTOperation,
        inverseBuffer: OTOperation
    ) {
        // Save the pending operation and the user's edits since then
        this.outstanding = outstanding
        this.buffer = buffer
        this.submissionId = submissionId
        this.inverseOutstanding = inverseOutstanding
        this.inverseBuffer = inverseBuffer
    }

    applyClient(
        client: OTEditorClient,
        operation: OTOperation,
        inverseOperation: OTOperation
    ): OTState {
        log('OTCLIENT - await with buffer', operation)
        // Compose the user's changes onto the buffer
        const newBuffer = this.buffer.compose(operation)
        const newInverseBuffer = inverseOperation.compose(this.inverseBuffer) // Not totally positive why this has to be reversed.
        // It *should* be this.inverseBuffer.compose(inverseOperation)

        return new AwaitingWithBuffer(
            this.outstanding,
            newBuffer,
            this.submissionId,
            this.inverseOutstanding,
            newInverseBuffer
        )
    }

    applyServer(client: OTEditorClient, operation: OTOperation) {
        // Operation comes from another client
        //
        //                       /\
        //     this.outstanding /  \ operation
        //                     /    \
        //                    /\    /
        //       this.buffer /  \* / pair1[0] (new outstanding)
        //                  /    \/
        //                  \    /
        //          pair2[1] \  / pair2[0] (new buffer)
        // the transformed    \/
        // operation -- can
        // be applied to the
        // client's current
        // document
        //
        // * pair1[1]
        // inverseOutstandingPair = transformX(this.inverseOutstanding, operation)
        const pair1 = transformX(this.outstanding, operation)
        const inverseOutstandingPair = transformX(
            this.inverseOutstanding,
            operation
        )
        const pair2 = transformX(this.buffer, pair1[1])
        const inverseBufferPair = transformX(this.inverseBuffer, pair1[1])
        client.applyOperation(pair2[1])
        return new AwaitingWithBuffer(
            pair1[0],
            pair2[0],
            this.submissionId,
            inverseOutstandingPair[0],
            inverseBufferPair[0]
        )
    }

    serverAck(client: OTEditorClient): OTState {
        if (this.buffer.ops != null && this.buffer.ops.length > 0) {
            // The pending operation has been acknowledged and buffer isn't empty
            // => send buffer
            const submissionId = uuid()
            client.sendOperation(client.revision, this.buffer, submissionId)
            return new AwaitingConfirm(
                this.buffer,
                submissionId,
                this.inverseBuffer
            )
        } else {
            // The pending operation has been acknowledged and buffer is empty
            // => switch to synchronized state
            return Synchronized.getInstance()
        }
    }

    transformCursor(cursor: OTRange) {
        return {
            index: this.buffer.transformPosition(
                this.outstanding.transformPosition(cursor.index)
            ),
            length: cursor.length
        }
    }

    resend(client: OTEditorClient) {
        // The confirm didn't come because the client was disconnected.
        // Now that it has reconnected, we resend the outstanding operation.
        client.sendOperation(
            client.revision,
            this.outstanding,
            this.submissionId
        )
    }

    serverRollback(client: OTEditorClient): OTState {
        // when operation was rolled back we could have broken also operations in buffer
        // so its better to rollback whole state

        try {
            client.applyOperation(this.inverseBuffer)
            client.applyOperation(this.inverseOutstanding)
        } catch (e) {
            bugsnag.notify(new VError(e, 'RollbackFailed'), {
                metadata: {
                    rollbackFailed: true
                }
            })
            client.trigger('rollback-failed')
        }

        return Synchronized.getInstance()
    }
}

function transformX(clientOp: OTOperation, serverOp: OTOperation) {
    const pair = []
    // pairs[0] = client.type.transform(client.op, server.op, 'left')
    pair[0] = serverOp.transform(clientOp, true /* side == left / priority */)
    // pairs[1] = client.type.transform(server.op, client.op, 'right')
    pair[1] = clientOp.transform(serverOp, false /* side == right/ priority */)

    return pair
}

export interface OTEditorAdapterCallbacks {
    operation: (operation: OTOperation, inverseOperation: OTOperation) => void
    cursor: (cursor: OTRange) => void
}

export interface OTEditorAdapter {
    applyOperation(operation: OTOperation): void
    registerCallbacks(callbacks: OTEditorAdapterCallbacks): void
    setCursor?(
        clientId: number,
        cursor: OTRange,
        clientName: string,
        clientColor: string
    ): void
    removeCursor?(clientId: number): void
    disconnect(): void
}

export interface OTServerAdapterCallbacks {
    ack: () => void
    operation: (operation: OTOperation) => void
    rollback: () => void
    cursor: (
        clientId: number,
        cursor: OTRange,
        clientName: string,
        clientColor: string
    ) => void
    reconnect: (didAck: boolean) => void
}

export interface OTServerAdapter {
    sendOperation(
        identifier: string,
        revision: number,
        operation: OTOperation,
        submissionId: string
    ): void
    sendCursor(identifier: string, cursor: OTRange): void
    registerCallbacks(
        identifier: string,
        callbacks: OTServerAdapterCallbacks
    ): void
    disconnect(): void
}

export class OTEditorClient {
    serverAdapter: OTServerAdapter
    editorAdapter: OTEditorAdapter
    state: OTState
    revision: number

    constructor(
        private identifier: string,
        revision: number,
        serverAdapter: OTServerAdapter,
        editorAdapter: OTEditorAdapter
    ) {
        this.revision = revision
        this.serverAdapter = serverAdapter
        this.editorAdapter = editorAdapter
        this.state = Synchronized.getInstance()

        this.serverAdapter.registerCallbacks(this.identifier, {
            ack: () => {
                // Don't let us ack if we're already synchronized as it gets our revision numbers out of wack
                if (this.state instanceof Synchronized) {
                    return
                }

                log('ack called!')

                this.serverAck()
            },
            operation: (operation: OTOperation) => {
                log(
                    'new server op!',
                    JSON.stringify(operation),
                    this.state.constructor.name,
                    JSON.stringify(this.state)
                )
                this.applyServer(operation)
            },
            rollback: () => {
                this.serverRollback()
            },
            cursor: this._onApiSelectionChange,
            reconnect: (didAck: boolean) => {
                // We only send a reconnect if we didn't ack, because if we did ack either we went into Synchronized
                // from the AwaitingConfirm state or into AwaitingConfirm from AwaitingWithBuffer, both of which automatically
                // synchronize or send the next operation automatically
                if (!didAck) {
                    this.serverReconnect()
                }
            }
        })

        this.editorAdapter.registerCallbacks({
            operation: (
                operation: OTOperation,
                inverseOperation: OTOperation
            ) => {
                this.applyClient(operation, inverseOperation)
            },
            cursor: (cursor: OTRange) => {
                this.cursorChange(cursor)
            }
        })
    }

    public isSynchronized() {
        return this.state instanceof Synchronized
    }

    _onApiSelectionChange = (
        clientId: number,
        cursor: OTRange,
        clientName: string,
        clientColor: string
    ) => {
        if (!(this.state instanceof Synchronized)) {
            return
        }

        if (!cursor && typeof this.editorAdapter.removeCursor === 'function') {
            this.editorAdapter.removeCursor(clientId)
            return
        }

        const newCursor = this.transformCursor(cursor)
        if (newCursor && typeof this.editorAdapter.setCursor === 'function') {
            this.editorAdapter.setCursor(
                clientId,
                newCursor,
                clientName,
                clientColor
            )
        }
    }

    cursorChange(cursor: OTRange) {
        if (this.state instanceof AwaitingWithBuffer) {
            return
        }
        if (cursor) {
            cursor = { index: cursor.index, length: 0 }
        }
        this.serverAdapter.sendCursor(this.identifier, cursor)
    }

    resetClientWithRevision(revision: number) {
        this.revision = revision
        this.state = Synchronized.getInstance()
    }

    sendOperation(
        revision: number,
        operation: OTOperation,
        submissionId: string
    ) {
        log('SEND OPERATION', revision, operation, submissionId)
        this.serverAdapter.sendOperation(
            this.identifier,
            revision,
            operation,
            submissionId
        )
    }

    applyOperation(operation: OTOperation) {
        this.editorAdapter.applyOperation(operation)
    }

    setState(state: OTState) {
        log(
            '[OTClient - setState]',
            state.constructor.name,
            JSON.stringify(state),
            state
        )
        this.state = state
    }

    applyClient(operation: OTOperation, inverseOperation: OTOperation) {
        this.setState(this.state.applyClient(this, operation, inverseOperation))
    }

    applyServer(operation: OTOperation) {
        this.revision++
        this.setState(this.state.applyServer(this, operation))
    }

    serverAck() {
        this.revision++
        this.setState(this.state.serverAck(this))
    }

    serverReconnect() {
        if (typeof this.state.resend === 'function') {
            this.state.resend(this)
        }
    }

    serverRollback() {
        this.setState(this.state.serverRollback(this))
    }

    transformCursor(cursor: OTRange) {
        return this.state.transformCursor(cursor)
    }

    trigger(eventName: string) {
        log(`[TRIGGER] ${eventName}`)
        // @todo We need to handle this in the future like Dossier does
    }

    disconnect() {
        this.serverAdapter.disconnect()
        this.editorAdapter.disconnect()
    }
}
