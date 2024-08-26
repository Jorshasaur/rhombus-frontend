import Axios, { AxiosError } from 'axios'
import { EventEmitter2, Listener } from 'eventemitter2'
import _ from 'lodash'
import { RangeStatic } from 'quill'
import { VError } from 'verror'
import bugsnag from '../../bugsnag'
import PagesApiService from '../../data/services/PagesApiService'
import { log } from '../../helpers/LogHelper'
import { GenericContents } from '../../interfaces/documentContents'
import {
    RawJSON1ServerRevision,
    JSON1ServerRevision
} from '../../interfaces/revision'
import {
    OTOperation,
    OTRange,
    OTServerAdapter as OTServerAdapterInterface,
    OTServerAdapterCallbacks
} from './OTClient'
import { ServerCursor, SocketEvents, SocketManager } from './SocketManager'
import {
    validateIncomingJSON1Operation,
    validateRevisions
} from './Validations'
import { JSON1Wrapper } from './Advil'

const DEFAULT_ROLLBACK_ATTEMPTS = 3

export interface OTServerAdapterOptions {
    rollbackAttempts?: number
}

export class OTEmitter {
    emitter = new EventEmitter2()

    constructor(callbacks: OTServerAdapterCallbacks) {
        Object.keys(callbacks).forEach((eventName: string) => {
            this.emitter.on(eventName, callbacks[eventName])
        })
    }

    emitOperation(operation: OTOperation) {
        this.emitter.emit('operation', operation)
    }

    emitAck() {
        this.emitter.emit('ack')
    }

    emitRollback() {
        this.emitter.emit('rollback')
    }

    emitReconnect(didAck: boolean) {
        this.emitter.emit('reconnect', didAck)
    }

    emitCursor(
        clientId: number,
        cursor: OTRange,
        clientName: string,
        clientColor: string
    ) {
        this.emitter.emit('cursor', clientId, cursor, clientName, clientColor)
    }
}

enum OTDocumentStateType {
    document,
    pane
}

class OTDocumentState {
    revisionsBeforeReady: RawJSON1ServerRevision[] = []
    lastSent: JSON1ServerRevision | null = null
    lastAck: JSON1ServerRevision | null = null
    rollbackAttempts: number = 0
    ready = false

    constructor(
        public identifier: string,
        public type: OTDocumentStateType,
        public currentRevision: number,
        public contents: any
    ) {}

    reset() {
        this.ready = false
        this.revisionsBeforeReady = []
    }
}

export enum OTServerAdapterEvents {
    ready = 'ready',
    resetDoc = 'reset-doc',
    ack = 'ack',
    operation = 'operation',
    disconnect = 'disconnect',
    reconnect = 'reconnect'
}

export class OTServerAdapter implements OTServerAdapterInterface {
    initialInitFinished: boolean
    sendOperationCancelTokenSource = Axios.CancelToken.source()
    emitter = new EventEmitter2()
    otEmitters: Map<string, OTEmitter> = new Map()
    otStates: Map<string, OTDocumentState> = new Map()

    constructor(
        public paneId: string,
        public documentId: string,
        documentContents: GenericContents,
        private socketManager: SocketManager,
        private options: OTServerAdapterOptions = {}
    ) {
        if (this.options.rollbackAttempts == null) {
            this.options.rollbackAttempts = DEFAULT_ROLLBACK_ATTEMPTS
        }

        this.setDocumentContents(documentContents)
        this.attachToSocket()
    }

    disconnect() {
        this.emitter.removeAllListeners()
        this.socketManager.off(SocketEvents.clientReady, this.onClientReady)
        this.socketManager.off(SocketEvents.paneOperation, this.onPaneOperation)
        this.socketManager.off(SocketEvents.cursor, this.onCursor)
        this.socketManager.off(SocketEvents.disconnect, this.onDisconnect)
    }

    setDocumentContents(document: GenericContents) {
        this.otStates.set(
            this.paneId,
            new OTDocumentState(
                this.paneId,
                OTDocumentStateType.pane,
                document.revision,
                document.operation
            )
        )

        this.initialInitFinished = false

        log('Initial Doc Received: ', new Date().getTime(), this.otStates)
    }

    resetDoc() {
        this.socketManager.disconnect()
        if (this.sendOperationCancelTokenSource != null) {
            this.sendOperationCancelTokenSource.cancel()
        }
        this.emitter.emit(OTServerAdapterEvents.resetDoc)
    }

    sendCursor(identifier: string, cursor: RangeStatic) {
        this.socketManager.sendCursor(cursor)
    }

    sendOperation(
        identifier: string,
        revision: number,
        operation: JSON1Wrapper,
        submissionId: string
    ) {
        const otState = this.otStates.get(identifier)
        log('Current OTState is', otState, identifier)
        if (otState == null) {
            return
        }

        const lastSent = {
            revision: revision,
            operation: operation,
            submissionId: submissionId
        }
        otState.lastSent = lastSent

        log(
            'Submitting Revision ' +
                lastSent.revision +
                ' with submissionId ' +
                lastSent.submissionId
        )

        const dataToSend = {
            paneId: identifier,
            revision: lastSent.revision,
            operation: lastSent.operation,
            submissionId: lastSent.submissionId,
            documentId: this.documentId,
            type: 'json1'
        }

        log('OUTGOING DATA', dataToSend)

        PagesApiService.submitPanesOperation(
            dataToSend,
            this.sendOperationCancelTokenSource.token
        ).catch((err) => {
            this._handleSendOperationError(otState, err)
        })
    }

    _handleSendOperationError = (otState: OTDocumentState, err: AxiosError) => {
        if (err instanceof Axios.Cancel) {
            return
        } else if (err.message === 'Network Error') {
            // reconnect socket when there is Network error
            this.reconnect()
        } else {
            const status = err.response != null ? err.response.status : 500

            // Because we do a check before this function is called, we are guarenteed a correct JSON response
            switch (status) {
                case 428:
                    this.serverRollback(otState)
                    break
                default:
                    // Don't ever end up in a situation where we stop submitting pending operations
                    setTimeout(() => {
                        if (otState.lastSent != null) {
                            this.sendOperation(
                                otState.identifier,
                                otState.lastSent.revision,
                                otState.lastSent.operation,
                                otState.lastSent.submissionId
                            )
                        }
                    }, 1000)
                    break
            }
        }
    }

    getOTEmitter(identifier: string) {
        const emitter = this.otEmitters.get(identifier)

        if (emitter == null) {
            // @todo handle non existent emitter differently - why doesn't exist actually..
            throw new Error(`There is no emitter for ${identifier}`)
        }
        return emitter
    }

    emitOperation(identifier: string, operation: OTOperation) {
        this.getOTEmitter(identifier).emitOperation(operation)
        this.emitter.emit(OTServerAdapterEvents.operation)
    }

    emitAck(identifier: string) {
        this.getOTEmitter(identifier).emitAck()
        this.emitter.emit(OTServerAdapterEvents.ack)
    }

    emitRollback(identifier: string) {
        this.getOTEmitter(identifier).emitRollback()
    }

    emitReconnect(identifier: string, didAck: boolean) {
        this.getOTEmitter(identifier).emitReconnect(didAck)
        this.emitter.emit(OTServerAdapterEvents.reconnect)
    }

    serverOperation(identifier: string, data: RawJSON1ServerRevision) {
        const otState = this.otStates.get(identifier)
        log('Checking server operation', identifier, data, otState)
        if (otState == null) {
            return
        }

        let didAck = false
        if (otState.ready) {
            if (
                otState.lastSent &&
                otState.lastSent.submissionId === data.submissionId
            ) {
                this.serverAck(identifier, data)
                didAck = true
            } else if (
                otState.lastAck != null &&
                otState.lastAck.submissionId === data.submissionId
            ) {
                bugsnag.notify(
                    new Error(
                        'Server ack received multiple times for the same operation'
                    ),
                    {
                        metadata: {
                            curRevision: otState.currentRevision,
                            incomingOperation: data.operation
                        }
                    }
                )
            } else {
                try {
                    validateIncomingJSON1Operation(
                        data,
                        otState.currentRevision
                    )
                } catch (e) {
                    log('Invalid operation', e.message)
                    bugsnag.notify(new VError(e, 'ValidateIncomingOperation'), {
                        metadata: {
                            curRevision: otState.currentRevision,
                            incomingOperation: data.operation
                        }
                    })
                    this.reconnect()
                    return
                }

                this.emitOperation(
                    identifier,
                    new JSON1Wrapper(data.operation.ops)
                )

                if (data.revision > otState.currentRevision) {
                    otState.currentRevision = data.revision
                }
            }
        } else {
            otState.revisionsBeforeReady.push(data)
        }
        return didAck
    }

    serverAck(identifier: string, data: RawJSON1ServerRevision) {
        const otState = this.otStates.get(identifier)
        if (otState == null) {
            return
        }

        if (
            otState.lastSent &&
            otState.lastSent.submissionId === data.submissionId
        ) {
            if (data.revision > otState.currentRevision) {
                otState.currentRevision = data.revision
            }

            otState.lastAck = otState.lastSent
            otState.lastSent = null
            otState.rollbackAttempts = 0
            log('server ack!')
            this.emitAck(identifier)
        } else {
            bugsnag.notify(
                new Error(
                    "Server ack received for operation that doesn't match pending operation"
                ),
                {
                    metadata: {
                        operation: otState.lastSent
                    }
                }
            )
            this.reconnect()
        }
    }

    serverRollback(otState: OTDocumentState) {
        log(`server rollback, rollback attempts: ${otState.rollbackAttempts}`)

        // If we trigger 3 (or other programmer defined limit) rollbacks in a row, then just reset the doc
        if (otState.rollbackAttempts >= this.options.rollbackAttempts!) {
            bugsnag.notify(
                new Error(
                    `Server rollback was called ${otState.rollbackAttempts} times`
                ),
                {
                    metadata: {
                        operation: otState.lastSent
                    }
                }
            )
            this.resetDoc()
        } else {
            otState.rollbackAttempts++
            this.emitRollback(otState.identifier)
        }
    }

    onClientReady = () => {
        log('DocumentChannel Connected!', new Date().getTime())
        const otState = this.otStates.get(this.paneId)!
        log('OTSTATE', otState, this.paneId)
        PagesApiService.getPanesRevisionsSinceRevision(
            this.paneId,
            otState.currentRevision
        )
            .then((revisionsResponse) => {
                let revisions: RawJSON1ServerRevision[]

                try {
                    revisions = this._mergeSortAndValidateServerRevisions(
                        otState,
                        revisionsResponse
                    )
                } catch (err) {
                    bugsnag.notify(new VError(err, 'ValidateRevisions'))
                    this.reconnect()
                    return
                }

                otState.ready = true

                const didAck = revisions.reduce(
                    (res: boolean, revision: RawJSON1ServerRevision) => {
                        const ackOperation = this.serverOperation(
                            this.paneId,
                            revision
                        )
                        if (ackOperation) {
                            return true
                        }
                        return res
                    },
                    false
                )

                if (this.initialInitFinished) {
                    this.emitReconnect(this.paneId, didAck)
                }

                if (otState.ready && !this.initialInitFinished) {
                    this.initialInitFinished = true
                    this.emitter.emit(OTServerAdapterEvents.ready)
                }
            })
            .catch((error) => {
                bugsnag.notify(
                    new VError(error, 'GetPanesRevisionsSinceRevision')
                )
                this.reconnect()
            })
    }

    onPaneOperation = (paneId: string, data: RawJSON1ServerRevision) => {
        if (paneId && paneId === this.paneId) {
            log('Socket Operation Received', paneId, this.paneId, data)
            log('Socket Operation is Valid', data)
            this.serverOperation(this.paneId, data)
        }
    }

    onCursor = (data: ServerCursor) => {
        // const otEmitter = this.otEmitters.get(this.documentId)!
        // otEmitter.emitCursor(
        //     data.clientId,
        //     data.cursor,
        //     data.clientName,
        //     data.clientColor
        // )
    }

    onDisconnect = () => {
        this.otStates.forEach((otState) => otState.reset())
        this.emitter.emit(OTServerAdapterEvents.disconnect)
        log('DocumentChannel Disconnected!')
    }

    attachToSocket() {
        log('attach!')
        // Connect event is fired upon a connection including a successful reconnection
        this.socketManager.on(SocketEvents.clientReady, this.onClientReady)
        this.socketManager.on(SocketEvents.paneOperation, this.onPaneOperation)

        // Someday we will need to worry about the cursor, but not today!
        this.socketManager.on(SocketEvents.cursor, this.onCursor)
        this.socketManager.on(SocketEvents.disconnect, this.onDisconnect)
    }

    reconnect() {
        this.socketManager.reconnect()
    }

    on(event: OTServerAdapterEvents, listener: Listener) {
        this.emitter.on(event, listener)
    }

    off(event: OTServerAdapterEvents, listener: Listener) {
        this.emitter.off(event, listener)
    }

    registerCallbacks(identifier: string, callbacks: OTServerAdapterCallbacks) {
        const otEmitter = new OTEmitter(callbacks)
        this.otEmitters.set(identifier, otEmitter)
    }

    _mergeSortAndValidateServerRevisions(
        otState: OTDocumentState,
        serverRevisions: RawJSON1ServerRevision[]
    ) {
        var revisions = _.uniqBy(
            serverRevisions.concat(otState.revisionsBeforeReady),
            'revision'
        )
        revisions = _.sortBy(revisions, 'revision')

        log(
            'serverRevisions!',
            serverRevisions,
            'revisionsBeforeReady: ',
            otState.revisionsBeforeReady,
            'revisions: ',
            revisions
        )

        validateRevisions(revisions, otState.currentRevision)

        return revisions
    }
}
