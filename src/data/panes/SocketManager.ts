import PubSub from 'pubsub-js'
import { EventEmitter2, Listener } from 'eventemitter2'
import io from 'socket.io-client'
import { RangeStatic } from 'quill'
import { Chance } from 'chance'
import { Permissions } from '../../interfaces/permissions'
import { Member } from '../../interfaces/member'
import {
    RawJSON1ServerRevision,
    RawDeltaServerRevision
} from '../../interfaces/revision'

export enum SocketEvents {
    connect = 'connect',
    disconnect = 'disconnect',
    reconnect = 'reconnect',
    update = 'update',
    operation = 'operation',
    paneOperation = 'pane-operation',
    cursor = 'cursor',
    commentsUpdated = 'comments-updated',
    documentArchived = 'document-archived',
    documentUnarchived = 'document-unarchived',
    subscribedToDocument = 'subscribed-to-document',
    documentPermissionsChanged = 'document-permissions-changed',
    freehandDocumentUpdated = 'freehand-document-updated',
    clientReady = 'client-ready'
}

export interface SocketUser {
    id: number
    name: string
    color: string
}

export interface ServerCursor {
    clientId: number
    cursor: RangeStatic
    clientName: string
    clientColor: string
}

export interface ServerUpdateData {
    event: string
    users: Member[]
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

export class SocketManager {
    user: SocketUser
    socket: SocketIOClient.Socket
    emitter = new EventEmitter2()
    documentId: string

    public static instance: SocketManager

    public static getInstance() {
        if (this.instance === null || this.instance === undefined) {
            this.instance = new SocketManager()
        }
        return this.instance
    }

    init(documentId: string, user: SocketUser) {
        this.documentId = documentId
        const chance = Chance()

        this.user = {
            id: user.id,
            name: user.name || chance.name(),
            color: user.color || chance.color()
        }
    }

    on(event: SocketEvents, listener: Listener) {
        this.emitter.on(event, listener)
    }

    off(event: SocketEvents, listener: Listener) {
        this.emitter.off(event, listener)
    }

    public attach() {
        if (this.socket) {
            if (this.socket.connected) {
                this.emitter.emit(SocketEvents.clientReady)
            }
            return
        }
        let baseUrl = window.location.origin
        if (process.env.NODE_ENV === 'development') {
            baseUrl = window.INVISION_ENV.PAGES_API
        }
        this.socket = io(baseUrl, {
            path: '/rhombus-api/ws',
            transports: ['websocket'],
            reconnectionDelayMax: 30000,
            query: {
                documentId: this.documentId,
                userId: this.user.id
            }
        })

        // Connect event is fired upon a connection including a successful reconnection
        this.socket.on(SocketEvents.connect, () => {
            this.emitter.emit(SocketEvents.connect)
            this.emitter.emit(SocketEvents.clientReady)
        })

        this.socket.on(SocketEvents.reconnect, () => {
            this.emitter.emit(SocketEvents.reconnect)
        })

        this.socket.on(SocketEvents.disconnect, () => {
            this.emitter.emit(SocketEvents.disconnect)
        })

        this.socket.on(SocketEvents.update, (data: ServerUpdateData) => {
            this.emitter.emit(SocketEvents.update, data)
        })

        this.socket.on(
            SocketEvents.operation,
            (data: RawDeltaServerRevision) => {
                this.emitter.emit(SocketEvents.operation, this.documentId, data)
            }
        )

        this.socket.on(
            SocketEvents.paneOperation,
            (data: RawJSON1ServerRevision) => {
                this.emitter.emit(
                    SocketEvents.paneOperation,
                    data.paneId!,
                    data
                )
            }
        )

        this.socket.on(SocketEvents.cursor, (data: ServerCursor) => {
            this.emitter.emit(SocketEvents.cursor, data)
        })

        this.socket.on(SocketEvents.commentsUpdated, () => {
            this.emitter.emit(SocketEvents.commentsUpdated)
        })

        this.socket.on(SocketEvents.documentArchived, () => {
            this.emitter.emit(SocketEvents.documentArchived)
        })

        this.socket.on(SocketEvents.documentUnarchived, () => {
            this.emitter.emit(SocketEvents.documentUnarchived)
        })

        this.socket.on(
            SocketEvents.subscribedToDocument,
            (args: SubscribedToDocumentMessage) => {
                if (args.userId === this.user.id) {
                    this.emitter.emit(SocketEvents.subscribedToDocument)
                }
            }
        )

        this.socket.on(
            SocketEvents.documentPermissionsChanged,
            (args: DocumentPermissionsChanged) => {
                if (args.userId === this.user.id) {
                    this.emitter.emit(
                        SocketEvents.documentPermissionsChanged,
                        args.permissions
                    )
                }
            }
        )

        this.socket.on(
            SocketEvents.freehandDocumentUpdated,
            ({ freehandDocumentId }: FreehandDocumentUpdated) => {
                PubSub.publish(
                    SocketEvents.freehandDocumentUpdated,
                    freehandDocumentId
                )
            }
        )
    }

    public dispose() {
        this.socket.close()
    }

    public connect() {
        this.socket.connect()
    }

    public disconnect() {
        if (!this.socket.disconnected) {
            this.socket.disconnect()
        }
    }

    public reconnect() {
        if (!this.socket.disconnected) {
            this.socket.disconnect()
        }
        setTimeout(() => {
            this.socket.connect()
        }, 1000)
    }

    sendCursor(cursor: RangeStatic) {
        this.socket.emit('cursor', {
            cursor: cursor,
            clientId: this.user.id,
            clientName: this.user.name,
            clientColor: this.user.color
        })
    }
}
