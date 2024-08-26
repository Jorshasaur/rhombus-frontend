import Axios, { AxiosError, CancelTokenSource } from 'axios'
import { Chance } from 'chance'
import { EventEmitter2 } from 'eventemitter2'
import _ from 'lodash'
import PubSub from 'pubsub-js'
import { DeltaStatic, RangeStatic } from 'quill'
import io from 'socket.io-client'
import { VError } from 'verror'
import bugsnag from '../../bugsnag'
import PagesApiService from '../../data/services/PagesApiService'
import { DocumentContents } from '../../interfaces/documentContents'
import { Permissions } from '../../interfaces/permissions'
import { SOCKET } from '../../constants/network'
import { ServerAdapterCallbacks } from '../ot/OTClient'

const DEFAULT_ROLLBACK_ATTEMPTS = 3
const chance = Chance()

export interface ServerOperationData {
    operation: DeltaStatic
    submissionId: string
    revision: number
    delta?: DeltaStatic
    cursor?: any
}

export interface ServerUpdateData {
    event: string
    users: string[]
}

export interface QuillSocketIOAdapterOptions {
    rollbackAttempts?: number
    userId: number
    userName: string
    color: string
    canEdit: boolean
}

export interface SocketUser {
    userId: number
    companyId?: number
    teamId?: number
    sessionId?: string
    name: string
    email?: string
    color: string
}

export interface ServerCursor {
    clientId: number
    cursor: RangeStatic
    clientName: string
    clientColor: string
}

interface SubscribedToDocumentMessage {
    userId: number
}

interface DocumentPermissionsChanged {
    userId: number
    permissions: Permissions
}

interface FreehandDocumentUpdated {
    freehandDocumentId: number
}

export class QuillSocketIOAdapter extends EventEmitter2 {
    ready: boolean
    messagesBeforeReady: ServerOperationData[]
    user: SocketUser
    initialInitFinished: boolean
    curRevision: number
    lastSent: ServerOperationData | null
    lastAck: ServerOperationData | null
    rollbackAttempts: number
    socket: SocketIOClient.Socket
    sendOperationCancelTokenSource?: CancelTokenSource
    canEdit: boolean
    sendRevert: boolean

    constructor(
        private documentId: string,
        documentContents: DocumentContents,
        private options: QuillSocketIOAdapterOptions
    ) {
        super()

        if (this.options.rollbackAttempts == null) {
            this.options.rollbackAttempts = DEFAULT_ROLLBACK_ATTEMPTS
        }

        this.setDocumentContents(documentContents)
        this.attachToSocket()
        this.canEdit = this.options.canEdit
        this.sendRevert = false
    }

    prepareRevert() {
        this.sendRevert = true
    }

    updatePermissions(canEdit: boolean) {
        this.canEdit = canEdit
        if (!canEdit) {
            this.clearCursor()
        }
    }

    setDocumentContents(document: DocumentContents) {
        this.curRevision = document.revision
        this.user = {
            userId: this.options.userId,
            name: this.options.userName || chance.name(),
            color: this.options.color || chance.color()
        }

        this.ready = false
        this.initialInitFinished = false
        this.rollbackAttempts = 0
        this.lastSent = null
        this.lastAck = null
        this.sendRevert = false
        this.messagesBeforeReady = []

        console.log('Initial Doc Recieved: ', new Date().getTime())
    }

    resetDoc() {
        this.socket.disconnect()
        if (this.sendOperationCancelTokenSource != null) {
            this.sendOperationCancelTokenSource.cancel()
        }
        this.emit('reset-doc')
    }

    sendOperation(
        revision: number,
        operation: DeltaStatic,
        cursor: RangeStatic | undefined,
        submissionId: string
    ) {
        this.lastSent = {
            revision: revision,
            operation: operation,
            cursor: cursor,
            submissionId: submissionId
        }

        console.log(
            'Submitting Revision ' +
                this.lastSent.revision +
                ' with submissionId ' +
                this.lastSent.submissionId
        )

        var dataToSend = {
            documentId: this.documentId,
            revision: this.lastSent.revision,
            operation: this.lastSent.operation,
            submissionId: this.lastSent.submissionId,
            cursor: {},
            revert: this.sendRevert
        }

        if (this.lastSent.cursor) {
            dataToSend.cursor = this.lastSent.cursor.toJSON()
        }

        this.sendOperationCancelTokenSource = Axios.CancelToken.source()
        PagesApiService.submitOperation(
            dataToSend,
            this.sendOperationCancelTokenSource.token
        ).catch(this._handleSendOperationError)
    }

    _handleSendOperationError = (err: AxiosError) => {
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
                    this.serverRollback()
                    break
                default:
                    // Don't ever end up in a situation where we stop submitting pending operations
                    setTimeout(() => {
                        if (this.lastSent != null) {
                            this.sendOperation(
                                this.lastSent.revision,
                                this.lastSent.operation,
                                this.lastSent.cursor,
                                this.lastSent.submissionId
                            )
                        }
                    }, 1000)
                    break
            }
        }
    }

    reconnect() {
        if (!this.socket.disconnected) {
            this.socket.disconnect()
        }
        setTimeout(() => {
            this.socket.connect()
        }, 1000)
    }

    sendCursor(cursor: RangeStatic) {
        if (this.canEdit) {
            this.socket.emit('cursor', {
                cursor: cursor,
                clientId: this.user.userId,
                clientName: this.user.name,
                clientColor: this.user.color
            })
        }
    }

    clearCursor() {
        this.socket.emit('cursor', {
            cursor: null,
            clientId: this.user.userId,
            clientName: this.user.name,
            clientColor: this.user.color
        })
    }

    serverOperation(data: ServerOperationData) {
        let didAck = false
        if (this.ready) {
            if (
                this.lastSent &&
                this.lastSent.submissionId === data.submissionId
            ) {
                this.serverAck(data)
                didAck = true
            } else if (
                this.lastAck != null &&
                this.lastAck.submissionId === data.submissionId
            ) {
                bugsnag.notify(
                    new Error(
                        'Server ack received multiple times for the same operation'
                    ),
                    {
                        metadata: {
                            curRevision: this.curRevision,
                            incomingOperation: data.operation
                        }
                    }
                )
            } else {
                try {
                    this.validateIncomingOperation(data)
                } catch (e) {
                    bugsnag.notify(new VError(e, 'ValidateIncomingOperation'), {
                        metadata: {
                            curRevision: this.curRevision,
                            incomingOperation: data.operation
                        }
                    })
                    this.reconnect()
                    return
                }

                this.emit('operation', data.operation)

                if (data.revision > this.curRevision) {
                    this.curRevision = data.revision
                }
            }
        } else {
            this.messagesBeforeReady.push(data)
        }
        return didAck
    }

    serverAck(data: ServerOperationData) {
        if (this.lastSent && this.lastSent.submissionId === data.submissionId) {
            if (data.revision > this.curRevision) {
                this.curRevision = data.revision
            }

            this.lastAck = this.lastSent
            this.lastSent = null
            this.sendRevert = false
            this.rollbackAttempts = 0

            this.emit('ack')
        } else {
            bugsnag.notify(
                new Error(
                    "Server ack received for operation that doesn't match pending operation"
                ),
                {
                    metadata: {
                        operation: this.lastSent
                    }
                }
            )
            this.reconnect()
        }
    }

    serverRollback() {
        console.log(
            `server rollback, rollback attempts: ${this.rollbackAttempts}`
        )

        // If we trigger 3 (or other programmer defined limit) rollbacks in a row, then just reset the doc
        if (this.rollbackAttempts >= this.options.rollbackAttempts!) {
            bugsnag.notify(
                new Error(
                    `Server rollback was called ${this.rollbackAttempts} times`
                ),
                {
                    metadata: {
                        operation: this.lastSent
                    }
                }
            )
            this.resetDoc()
        } else {
            this.rollbackAttempts++
            this.emit('rollback')
        }
    }

    connect() {
        this.socket.connect()
    }

    disconnect() {
        if (!this.socket.disconnected) {
            this.socket.disconnect()
        }
    }

    attachToSocket() {
        const baseUrl = window.INVISION_ENV.PAGES_API

        this.socket = io(baseUrl, {
            path: '/rhombus-api/ws',
            transports: ['websocket'],
            reconnectionDelayMax: 30000,
            query: {
                documentId: this.documentId,
                userId: this.user.userId
            }
        })

        // Connect event is fired upon a connection including a successful reconnection
        this.socket.on(SOCKET.connect, () => {
            console.log('DocumentChannel Connected!', new Date().getTime())

            PagesApiService.getRevisionsSinceRevision(this.curRevision)
                .then((revisionsResponse) => {
                    let revisions: ServerOperationData[]

                    try {
                        revisions = this._mergeSortAndValidateServerRevisions(
                            revisionsResponse,
                            this.messagesBeforeReady
                        )
                    } catch (err) {
                        bugsnag.notify(new VError(err, 'ValidateRevisions'))
                        this.reconnect()
                        return
                    }

                    this.ready = true

                    const didAck = revisions.reduce(
                        (res: boolean, revision: ServerOperationData) => {
                            const ackOperation = this.serverOperation(revision)
                            if (ackOperation) {
                                return true
                            }
                            return res
                        },
                        false
                    )

                    if (this.initialInitFinished) {
                        this.emit('reconnect', didAck)
                    }

                    if (this.ready && !this.initialInitFinished) {
                        this.initialInitFinished = true
                        this.emit('ready')
                    }
                })
                .catch((error) => {
                    bugsnag.notify(
                        new VError(error, 'GetRevisionsSinceRevision')
                    )
                    this.reconnect()
                })
        })

        this.socket.on(SOCKET.disconnect, () => {
            this.ready = false
            this.messagesBeforeReady = []

            this.emit(SOCKET.disconnect)
            console.log('DocumentChannel Disconnected!')
        })

        this.socket.on(SOCKET.update, (data: ServerUpdateData) => {
            this.emit(SOCKET.update, data)
        })

        this.socket.on(SOCKET.operation, (data: ServerOperationData) => {
            // console.log('operation from socket', args)
            this.serverOperation(data)
        })

        this.socket.on(SOCKET.cursor, (data: ServerCursor) => {
            // console.log('cursor from socket', args)
            this.emit(
                SOCKET.cursor,
                data.clientId,
                data.cursor,
                data.clientName,
                data.clientColor
            )
        })

        this.socket.on(SOCKET.commentsUpdated, () => {
            this.emit(SOCKET.commentsUpdated)
        })

        this.socket.on(SOCKET.documentArchived, () => {
            this.emit(SOCKET.documentArchived)
        })

        this.socket.on(SOCKET.documentUnarchived, () => {
            this.emit(SOCKET.documentUnarchived)
        })

        this.socket.on(
            SOCKET.subscribedToDocument,
            (args: SubscribedToDocumentMessage) => {
                if (args.userId === this.user.userId) {
                    this.emit(SOCKET.subscribedToDocument)
                }
            }
        )

        this.socket.on(
            SOCKET.documentPermissionsChanged,
            (args: DocumentPermissionsChanged) => {
                if (args.userId === this.user.userId) {
                    this.emit(
                        SOCKET.documentPermissionsChanged,
                        args.permissions
                    )
                }
            }
        )

        this.socket.on(
            SOCKET.freehandDocumentUpdated,
            ({ freehandDocumentId }: FreehandDocumentUpdated) => {
                PubSub.publish(
                    SOCKET.freehandDocumentUpdated,
                    freehandDocumentId
                )
            }
        )
    }

    getCurrentUser() {
        return this.user
    }

    registerCallbacks(callbacks: ServerAdapterCallbacks) {
        Object.keys(callbacks).forEach((eventName: string) => {
            this.on(eventName, callbacks[eventName])
        })
    }

    dispose() {
        this.socket.close()
    }

    validateIncomingOperation(operation: ServerOperationData) {
        // If no operation, bail
        assert(
            operation != null,
            'QuillSocketIOAdapter: Invalid Incoming Operation (Missing Operation)'
        )
        assert(
            operation.operation != null,
            'QuillSocketIOAdapter: Invalid Incoming Operation (Missing Operation.operation)'
        )
        // Delta is object with ops key
        assert(
            operation.operation.ops != null,
            'QuillSocketIOAdapter: Invalid Incoming Operation (Delta has not ops key)'
        )
        assert(
            Array.isArray(operation.operation.ops),
            'QuillSocketIOAdapter: Invalid Incoming Operation (Delta ops is not Array)'
        )
        // Incoming revision can't be equal or less than the curRevision
        assert(
            operation.revision > this.curRevision,
            'QuillSocketIOAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
        )
        // Incoming revision must be curRevision + 1 (otherwise we've missed a revision somewhere)
        assert(
            this.curRevision + 1 === operation.revision,
            'QuillSocketIOAdapter: Invalid Incoming Operation (revision is greater than +1 current revision)'
        )

        return true
    }

    _mergeSortAndValidateServerRevisions(
        serverRevs: ServerOperationData[],
        messagesBeforeReadyRevs: ServerOperationData[]
    ) {
        var revisions = _.uniqBy(
            serverRevs.concat(messagesBeforeReadyRevs),
            'revision'
        )
        revisions = _.sortBy(revisions, 'revision')

        console.log(
            'serverRevs!',
            serverRevs,
            'messagesBeforeReadyRevs: ',
            messagesBeforeReadyRevs,
            'revisions: ',
            revisions
        )

        this._validateRevisions(revisions)

        return revisions
    }

    _validateRevisions(revisions: ServerOperationData[]) {
        if (revisions.length === 0) {
            return true
        }

        // Make sure we haven't skipped a revision
        assert(
            this.curRevision + 1 === revisions[0].revision,
            'QuillSocketIOAdapter: Invalid Revisions (Missing Revision(s) between current revision and revisions)'
        )

        // Make sure revs are sequential, not duplicated, and non-missing
        revisions.forEach((revision: ServerOperationData, i: number) => {
            if (i > 0) {
                assert(
                    revision.revision - revisions[i - 1].revision === 1,
                    'QuillSocketIOAdapter: Invalid Revisions (Non-Sequential Revisions'
                )
            }
        })

        return true
    }
}

// Throws an error if the first argument is falsy. Useful for debugging.
function assert(b: boolean, msg: string) {
    if (!b) {
        throw new Error(msg || 'assertion error')
    }
}
