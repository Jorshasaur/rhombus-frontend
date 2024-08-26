import { EventEmitter2 } from 'eventemitter2'
import {
    DeltaOperation,
    DeltaStatic,
    RangeStatic,
    SelectionChangeHandler,
    Sources,
    TextChangeHandler
} from 'quill'
import Delta from 'quill-delta'
import { v4 as uuid } from 'uuid'
import { VError } from 'verror'
import bugsnag from '../../bugsnag'
import QuillSources from '../quill/modules/QuillSources'

export interface OTState {
    applyClient(
        client: OTEditorClient,
        operation: DeltaStatic,
        inverseOperation: DeltaStatic
    ): OTState
    applyServer(client: OTEditorClient, operation: DeltaStatic): OTState
    serverAck(client: OTEditorClient): OTState
    resend?(client: OTEditorClient): void
    serverRollback(client: OTEditorClient): OTState
    transformCursor(cursor: RangeStatic): RangeStatic
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
        operation: DeltaStatic,
        inverseOperation: DeltaStatic
    ): OTState {
        const submissionId = uuid()
        client.sendOperation(client.revision, operation, submissionId)
        return new AwaitingConfirm(operation, submissionId, inverseOperation)
    }

    applyServer(client: OTEditorClient, operation: DeltaStatic): OTState {
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
    transformCursor(cursor: RangeStatic) {
        return cursor
    }
}

export class AwaitingConfirm implements OTState {
    outstanding: DeltaStatic
    submissionId: string
    inverseOutstanding: DeltaStatic

    constructor(
        outstanding: DeltaStatic,
        submissionId: string,
        inverseOutstanding: DeltaStatic
    ) {
        // Save the pending operation
        this.outstanding = outstanding
        this.submissionId = submissionId
        this.inverseOutstanding = inverseOutstanding
    }

    applyClient(
        client: OTEditorClient,
        operation: DeltaStatic,
        inverseOperation: DeltaStatic
    ): OTState {
        // When the user makes an edit, don't send the operation immediately,
        // instead switch to 'AwaitingWithBuffer' state
        return new AwaitingWithBuffer(
            this.outstanding,
            operation,
            this.submissionId,
            this.inverseOutstanding,
            inverseOperation
        )
    }

    applyServer(client: OTEditorClient, operation: DeltaStatic): OTState {
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

    transformCursor(cursor: RangeStatic) {
        return {
            index: this.outstanding.transform(cursor.index),
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
    outstanding: DeltaStatic
    buffer: DeltaStatic
    submissionId: string
    inverseOutstanding: DeltaStatic
    inverseBuffer: DeltaStatic

    constructor(
        outstanding: DeltaStatic,
        buffer: DeltaStatic,
        submissionId: string,
        inverseOutstanding: DeltaStatic,
        inverseBuffer: DeltaStatic
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
        operation: DeltaStatic,
        inverseOperation: DeltaStatic
    ): OTState {
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

    applyServer(client: OTEditorClient, operation: DeltaStatic) {
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

    transformCursor(cursor: RangeStatic) {
        return {
            index: this.buffer.transform(
                this.outstanding.transform(cursor.index)
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

function transformX(clientOp: DeltaStatic, serverOp: DeltaStatic) {
    const pair = []
    // pairs[0] = client.type.transform(client.op, server.op, 'left')
    pair[0] = serverOp.transform(clientOp, true /* side == left / priority */)
    // pairs[1] = client.type.transform(server.op, client.op, 'right')
    pair[1] = clientOp.transform(serverOp, false /* side == right/ priority */)

    return pair
}

export interface EditorAdapter {
    on(eventName: 'text-change', handler: TextChangeHandler): void
    on(eventName: 'selection-change', handler: SelectionChangeHandler): void
    getContents(): DeltaStatic
    updateContents(delta: DeltaStatic, source?: Sources): DeltaStatic
    getModule(name: string): any
}

export interface ServerAdapterCallbacks {
    ack: () => void
    operation: (operation: DeltaOperation[]) => void
    rollback: () => void
    cursor: (
        clientId: number,
        cursor: RangeStatic,
        clientName: string,
        clientColor: string
    ) => void
    reconnect: (didAck: boolean) => void
}

export interface ServerAdapter {
    sendOperation(
        revision: number,
        operation: DeltaStatic,
        cursor: RangeStatic | undefined,
        submissionId: string
    ): void
    sendCursor(cursor: RangeStatic): void
    registerCallbacks(callbacks: ServerAdapterCallbacks): void
}

export interface Modifier {
    (delta: DeltaStatic): DeltaStatic
}

function modifiersReducer(delta: DeltaStatic, modifier: Modifier): DeltaStatic {
    return modifier(delta)
}
export class OTEditorClient extends EventEmitter2 {
    serverAdapter: ServerAdapter
    editorAdapter: EditorAdapter
    cursor: RangeStatic
    state: OTState
    revision: number
    modifiers: Modifier[] = []

    constructor(
        revision: number,
        serverAdapter: ServerAdapter,
        editorAdapter: EditorAdapter
    ) {
        super()
        this.revision = revision
        this.serverAdapter = serverAdapter
        this.editorAdapter = editorAdapter
        this.state = Synchronized.getInstance()
        this.editorAdapter.on('text-change', this._onTextChange.bind(this))
        this.editorAdapter.on(
            'selection-change',
            this._onSelectionChange.bind(this)
        )
        this.serverAdapter.registerCallbacks({
            ack: () => {
                // Don't let us ack if we're already synchronized as it gets our revision numbers out of wack
                if (this.state instanceof Synchronized) {
                    return
                }

                console.log('ack called!')

                this.serverAck()
            },
            operation: (operation: DeltaOperation[]) => {
                console.log(
                    'server op!',
                    JSON.stringify(operation),
                    this.state.constructor.name,
                    JSON.stringify(this.state)
                )
                this.applyServer(new Delta(operation))
            },
            rollback: () => {
                this.serverRollback()
            },
            cursor: this._onApiSelectionChange,
            reconnect: (didAck: boolean) => {
                // We only send a reconnect if we didn't ack, because if we did ack either we went into Syncronized
                // from the AwaitingConfirm state or into AwaitingConfirm from AwaitingWithBuffer, both of which automatically
                // syncronize or send the next operation automatically
                if (!didAck) {
                    this.serverReconnect()
                }
            }
        })
    }

    public isSynchronized() {
        return this.state instanceof Synchronized
    }

    public addModifier(modifier: Modifier) {
        this.modifiers.push(modifier)
    }

    _onTextChange(
        delta: DeltaStatic,
        oldContents: DeltaStatic,
        source: Sources
    ) {
        if (source === QuillSources.USER) {
            console.log('client op!', JSON.stringify(delta))

            const modifiedDelta = this.modifiers.reduce(modifiersReducer, delta)

            const modifiedContents = oldContents.compose(modifiedDelta)

            const inverseDelta = modifiedContents.diff(oldContents)

            const modifiedInverseDelta = this.modifiers.reduce(
                modifiersReducer,
                inverseDelta
            )

            if (
                modifiedInverseDelta.ops &&
                modifiedInverseDelta.ops.length > 0 // ignore empty operations
            ) {
                this.applyClient(modifiedDelta, modifiedInverseDelta)
            }
        }
    }

    _onSelectionChange(
        range: RangeStatic,
        oldRange: RangeStatic,
        source: Sources
    ) {
        console.log('selection change!')
        if (source === QuillSources.USER) {
            this.sendCursor(range)
        }
    }

    _onApiSelectionChange = (
        clientId: number,
        cursor: RangeStatic,
        clientName: string,
        clientColor: string
    ) => {
        if (!(this.state instanceof Synchronized)) {
            return
        }

        if (!cursor) {
            this.editorAdapter.getModule('multi-cursor').removeCursor(clientId)
            return
        }

        const newCursor = this.transformCursor(cursor)
        if (newCursor) {
            this.editorAdapter
                .getModule('multi-cursor')
                .setCursor(clientId, newCursor, clientName, clientColor)
        }
    }

    sendCursor(cursor: RangeStatic) {
        if (this.state instanceof AwaitingWithBuffer) {
            return
        }
        if (cursor) {
            cursor = { index: cursor.index, length: 0 }
        }
        this.serverAdapter.sendCursor(cursor)
    }

    resetClientWithRevision(revision: number) {
        this.revision = revision
        this.state = Synchronized.getInstance()
    }

    sendOperation(
        revision: number,
        operation: DeltaStatic,
        submissionId: string
    ) {
        this.serverAdapter.sendOperation(
            revision,
            operation,
            this.cursor,
            submissionId
        )
    }

    applyOperation(operation: DeltaStatic) {
        try {
            this.editorAdapter.updateContents(
                operation,
                QuillSources.API /* source */
            )
        } catch (e) {
            this.emit('apply-operation-error', e, operation)
        }
    }

    setState(state: OTState) {
        console.log(
            '[OTClient - setState]',
            state.constructor.name,
            JSON.stringify(state)
        )
        this.state = state
    }

    applyClient(operation: DeltaStatic, inverseOperation: DeltaStatic) {
        this.setState(this.state.applyClient(this, operation, inverseOperation))
    }

    applyServer(operation: DeltaStatic) {
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

    transformCursor(cursor: RangeStatic) {
        return this.state.transformCursor(cursor)
    }

    trigger(eventName: string) {
        console.log(`[TRIGGER] ${eventName}`)
        // @todo We need to handle this in the future like Dossier does
    }
}
