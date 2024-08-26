import { mockSocket } from '../../mockData/mockSocket'
import { SocketManager, SocketEvents } from '../../../data/panes/SocketManager'

jest.mock('socket.io-client', () => {
    return () => {
        return new mockSocket()
    }
})

function getDocumentId() {
    return '1'
}

function getUser() {
    return {
        id: 1,
        name: 'test@invisionapp.com',
        color: '#FF3366'
    }
}

function getCursorRange() {
    return {
        index: 10,
        length: 0
    }
}

function getSocketManager() {
    const socketManager = SocketManager.getInstance()
    socketManager.init(getDocumentId(), getUser())
    socketManager.emitter.emit = jest.fn()
    return socketManager
}

describe('SocketManager', () => {
    it('should create instance of SocketManager', () => {
        const socketManager = getSocketManager()
        expect(socketManager).toBeInstanceOf(SocketManager)
    })

    it('should attach to socket events', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const events = [
            SocketEvents.connect,
            SocketEvents.reconnect,
            SocketEvents.disconnect,
            SocketEvents.update,
            SocketEvents.operation,
            SocketEvents.paneOperation,
            SocketEvents.cursor,
            SocketEvents.commentsUpdated,
            SocketEvents.documentArchived,
            SocketEvents.documentUnarchived,
            SocketEvents.subscribedToDocument,
            SocketEvents.documentPermissionsChanged,
            SocketEvents.freehandDocumentUpdated
        ]

        expect(socketManager.socket.on).toHaveBeenCalledTimes(events.length)

        events.forEach((event: string) => {
            expect(socketManager.socket.on).toBeCalledWith(
                event,
                expect.any(Function)
            )
        })
    })

    it('should send cursor', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const cursor = getCursorRange()
        const user = getUser()

        socketManager.sendCursor(cursor)

        expect(socketManager.socket.emit).toBeCalledWith('cursor', {
            cursor,
            clientId: user.id,
            clientName: user.name,
            clientColor: user.color
        })
    })

    it('should handle connect socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = {}
        socketManager.socket.emit(SocketEvents.connect, data)

        expect(socketManager.emitter.emit).toBeCalledWith(SocketEvents.connect)
    })

    it('should handle reconnect socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = {}
        socketManager.socket.emit(SocketEvents.reconnect, data)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.reconnect
        )
    })

    it('should handle disconnect socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = {}
        socketManager.socket.emit(SocketEvents.disconnect, data)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.disconnect
        )
    })

    it('should handle update socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = {}
        socketManager.socket.emit(SocketEvents.update, data)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.update,
            data
        )
    })

    it('should handle operation socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = {}
        socketManager.socket.emit(SocketEvents.operation, data)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.operation,
            getDocumentId(),
            data
        )
    })

    it('should handle pane operation socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = { paneId: '12345' }
        socketManager.socket.emit(SocketEvents.paneOperation, data)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.paneOperation,
            '12345',
            data
        )
    })

    it('should handle cursor socket event', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const data = {}
        socketManager.socket.emit(SocketEvents.cursor, data)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.cursor,
            data
        )
    })

    it('should handle comments-updated event from socket', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        socketManager.socket.emit(SocketEvents.commentsUpdated)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.commentsUpdated
        )
    })

    it('should handle archive event from socket', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        socketManager.socket.emit(SocketEvents.documentArchived)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.documentArchived
        )
    })

    it('should handle unarchive event from socket', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        socketManager.socket.emit(SocketEvents.documentUnarchived)

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.documentUnarchived
        )
    })

    it('should handle subscribed-to-document event from socket', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        socketManager.socket.emit(SocketEvents.subscribedToDocument, {
            userId: 1
        })

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.subscribedToDocument
        )
    })

    it('should handle document-permissions-changed event from socket', () => {
        const socketManager = getSocketManager()
        socketManager.attach()

        const permissions = {
            edit: false
        }

        socketManager.socket.emit(SocketEvents.documentPermissionsChanged, {
            userId: 1,
            permissions
        })

        expect(socketManager.emitter.emit).toBeCalledWith(
            SocketEvents.documentPermissionsChanged,
            permissions
        )
    })

    it('should handle freehand update event from socket', () => {
        const socketManager = getSocketManager()
        socketManager.attach()
        jest.spyOn(PubSub, 'publish')

        socketManager.socket.emit(SocketEvents.freehandDocumentUpdated, {
            freehandDocumentId: 1
        })

        expect(PubSub.publish).toBeCalledWith(
            SocketEvents.freehandDocumentUpdated,
            1
        )
    })

    it('should disconnect', () => {
        const socketManager = getSocketManager()
        socketManager.attach()
        socketManager.disconnect()
        expect(socketManager.socket.disconnect).toBeCalled()
    })

    it('should connect', () => {
        const socketManager = getSocketManager()
        socketManager.attach()
        socketManager.connect()
        expect(socketManager.socket.connect).toBeCalled()
    })

    it('should dispose', () => {
        const socketManager = getSocketManager()
        socketManager.attach()
        socketManager.dispose()
        expect(socketManager.socket.close).toBeCalled()
    })

    it('should reconnect', () => {
        jest.useFakeTimers()

        const socketManager = getSocketManager()
        socketManager.attach()
        socketManager.reconnect()

        jest.runOnlyPendingTimers()

        expect(socketManager.socket.disconnect).toBeCalled()
        expect(socketManager.socket.connect).toBeCalled()
    })
})
