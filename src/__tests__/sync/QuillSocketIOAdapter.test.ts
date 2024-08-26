import Axios from 'axios'
import { EventEmitter } from 'events'
import PubSub from 'pubsub-js'
import Delta from 'quill-delta'
import setImmediatePromise from 'set-immediate-promise'
import bugsnag from '../../bugsnag'
import { QuillSocketIOAdapter } from '../../components/quill/QuillSocketIOAdapter'
import PagesApiService from '../../data/services/PagesApiService'
import { DocumentContents } from '../../interfaces/documentContents'
import { SOCKET } from '../../constants/network'
import '../../lib/prototypes.js'

class SocketEmitter extends EventEmitter {}

class mockSocket {
    emitter = new SocketEmitter()

    disconnect = jest.fn()
    connect = jest.fn()

    on = jest.fn((event: string, listener: (...args: any[]) => void) => {
        this.emitter.on(event, listener)
    })

    emit = jest.fn((event: string, ...args: any[]) => {
        this.emitter.emit(event, ...args)
    })
}

jest.mock('socket.io-client', () => {
    return () => {
        return new mockSocket()
    }
})

function getDocumentId() {
    return '1'
}

function getInitialDocumentContents(): DocumentContents {
    return {
        revision: 1,
        delta: [
            { insert: 'Untitled' },
            { insert: '\n', attributes: { header: 1 } },
            { insert: 'This is a document whose text is synced in real time\n' }
        ]
    }
}

function getOptions() {
    return {
        userId: 1,
        userName: 'test@invisionapp.com',
        color: '#FF3366',
        canEdit: true
    }
}

function initServerAdapter() {
    const documentId = getDocumentId()
    const documentContents = getInitialDocumentContents()
    const options = getOptions()

    QuillSocketIOAdapter.prototype.emit = jest.fn()
    const serverAdapter = new QuillSocketIOAdapter(
        documentId,
        documentContents,
        options
    )

    return serverAdapter
}

function getRevision() {
    return {
        operation: new Delta({
            ops: [{ insert: 'text' }]
        }),
        submissionId: '1',
        revision: 2
    }
}

function getCursorRange() {
    return {
        index: 10,
        length: 0
    }
}

function getCursorData() {
    return {
        clientId: 1,
        cursor: getCursorRange(),
        clientName: 'test',
        clientColor: '#fff'
    }
}

describe('QuillSocketIOAdapter', () => {
    it('should create instance of QuillSocketIOAdapter', () => {
        const serverAdapter = initServerAdapter()
        expect(serverAdapter).toBeInstanceOf(QuillSocketIOAdapter)
        expect(serverAdapter.socket).toBeInstanceOf(mockSocket)
        expect(serverAdapter.ready).toBeFalsy()

        const socket = serverAdapter.socket! as any
        const events = [
            SOCKET.connect,
            SOCKET.disconnect,
            SOCKET.update,
            SOCKET.operation,
            SOCKET.cursor,
            SOCKET.commentsUpdated,
            SOCKET.documentArchived,
            SOCKET.documentUnarchived,
            SOCKET.subscribedToDocument,
            SOCKET.documentPermissionsChanged,
            SOCKET.freehandDocumentUpdated
        ]

        expect(socket.on).toHaveBeenCalledTimes(events.length)

        events.forEach((event: string) => {
            expect(socket.on).toBeCalledWith(event, expect.any(Function))
        })
    })

    it('should handle revisions that were created before reconnect', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()

        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()
        expect(serverAdapter.ready).toBeTruthy()

        expect(serverAdapter.initialInitFinished).toBeTruthy()
        expect(serverAdapter.emit).toBeCalledWith('ready')
        expect(serverAdapter.emit).not.toBeCalledWith('reconnect', false)

        socket.emit('disconnect')

        const revision = getRevision()
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([revision])
        })

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socket.emit('connect')
        await setImmediatePromise()

        expect(PagesApiService.getRevisionsSinceRevision).toBeCalledWith(1)
        expect(serverAdapter.emit).toBeCalledWith('reconnect', false)
        expect(serverOperationSpy).toBeCalledWith(revision)
    })

    it('should handle revisions that were created before connect', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()

        const socket = serverAdapter.socket!

        const revision = getRevision()
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([revision])
        })

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socket.emit('connect')
        await setImmediatePromise()

        expect(PagesApiService.getRevisionsSinceRevision).toBeCalledWith(1)
        expect(serverOperationSpy).toBeCalledWith(revision)
        expect(serverAdapter.emit).toBeCalledWith(
            'operation',
            revision.operation
        )
    })

    it('should handle revisions that were created before reconnect and ack', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()

        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()

        expect(serverAdapter.initialInitFinished).toBeTruthy()
        expect(serverAdapter.emit).not.toBeCalledWith('reconnect', false)

        socket.emit('disconnect')

        const revision = getRevision()

        serverAdapter.lastSent = {
            revision: revision.revision,
            operation: revision.operation,
            submissionId: revision.submissionId,
            cursor: undefined
        }

        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([revision])
        })

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socket.emit('connect')
        await setImmediatePromise()

        expect(PagesApiService.getRevisionsSinceRevision).toBeCalledWith(1)
        expect(serverOperationSpy).toBeCalledWith(revision)
        expect(serverAdapter.emit).toBeCalledWith('ack')
        expect(serverAdapter.emit).not.toBeCalledWith(
            'operation',
            revision.operation
        )
        expect(serverAdapter.emit).toBeCalledWith('reconnect', true)
    })

    it('should handle operation event from socket', async () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socket.emit('connect')
        await setImmediatePromise()

        const revision = getRevision()
        socket.emit('operation', revision)

        expect(serverOperationSpy).toBeCalledWith(revision)
        expect(serverAdapter.emit).toBeCalledWith(
            'operation',
            revision.operation
        )
        expect(serverAdapter.curRevision).toBe(revision.revision)
    })

    it('should handle ack from socket', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socket.emit('connect')
        await setImmediatePromise()

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.lastSent = {
            revision: revision.revision,
            operation: revision.operation,
            submissionId: revision.submissionId,
            cursor: undefined
        }

        socket.emit('operation', revision)

        expect(serverOperationSpy).toBeCalledWith(revision)
        expect(serverAdapter.emit).toBeCalledWith('ack')
        expect(serverAdapter.curRevision).toBe(revision.revision)
    })

    it('should not ack multiple times for same operation', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socket.emit('connect')
        await setImmediatePromise()

        let revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.lastSent = {
            revision: revision.revision,
            operation: revision.operation,
            submissionId: revision.submissionId,
            cursor: undefined
        }

        socket.emit('operation', revision)

        expect(serverOperationSpy).toBeCalledWith(revision)
        expect(serverAdapter.emit).toBeCalledWith('ready')
        expect(serverAdapter.emit).toBeCalledWith('ack')
        expect(serverAdapter.curRevision).toBe(revision.revision)

        socket.emit('operation', revision)
        socket.emit('operation', revision)

        expect(serverAdapter.emit).toHaveBeenCalledTimes(2)
        expect(serverAdapter.lastSent).toBeNull()
        expect(serverAdapter.lastAck).toBeDefined()
        expect(serverAdapter.lastAck!.submissionId).toBe(revision.submissionId)

        revision = getRevision()
        revision.revision = 3
        revision.submissionId = '3'
        socket.emit('operation', revision)

        expect(serverAdapter.emit).toBeCalledWith('operation', {
            ops: [{ insert: 'text' }]
        })
        expect(serverAdapter.emit).toHaveBeenCalledTimes(3)
    })

    it('should not handle same operation multiple times', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')
        const notifySpy = jest.spyOn(bugsnag, 'notify')

        socket.emit('connect')
        await setImmediatePromise()

        const revision = getRevision()
        revision.submissionId = '2'

        socket.emit('operation', revision)

        expect(serverOperationSpy).toBeCalledWith(revision)
        expect(serverAdapter.emit).toBeCalledWith('ready')
        expect(serverAdapter.emit).toBeCalledWith('operation', {
            ops: [{ insert: 'text' }]
        })
        expect(serverAdapter.curRevision).toBe(revision.revision)

        serverAdapter.reconnect = jest.fn()
        socket.emit('operation', revision)

        expect(serverAdapter.emit).toHaveBeenCalledTimes(2)
        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should send operation', () => {
        const serverAdapter = initServerAdapter()

        PagesApiService.submitOperation = jest.fn(() => {
            return Promise.resolve({})
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )

        expect(PagesApiService.submitOperation).toBeCalledWith(
            {
                documentId: getDocumentId(),
                revision: revision.revision,
                operation: revision.operation,
                submissionId: revision.submissionId,
                cursor: {},
                revert: false
            },
            expect.any(Axios.CancelToken)
        )
        expect(serverAdapter.lastSent).toEqual(revision)
    })

    it('should handle operation error', async () => {
        jest.useFakeTimers()

        const serverAdapter = initServerAdapter()

        PagesApiService.submitOperation = jest.fn(() => {
            return Promise.reject(new Error('Error'))
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )

        await setImmediatePromise()

        const sendOperationSpy = jest.spyOn(serverAdapter, 'sendOperation')

        jest.runOnlyPendingTimers()

        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
        expect(sendOperationSpy).toBeCalledWith(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )
    })

    it('should handle network error', async () => {
        jest.useFakeTimers()

        const serverAdapter = initServerAdapter()

        PagesApiService.submitOperation = jest.fn(() => {
            return Promise.reject(new Error('Network Error'))
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )

        await setImmediatePromise()

        jest.runOnlyPendingTimers()

        expect(serverAdapter.socket.disconnect).toBeCalled()
        expect(serverAdapter.socket.connect).toBeCalled()
    })

    it('should handle operation rollback', async () => {
        const serverAdapter = initServerAdapter()

        PagesApiService.submitOperation = jest.fn(() => {
            const error = {
                response: {
                    status: 428
                }
            }

            return Promise.reject(error)
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )

        await setImmediatePromise()

        expect(serverAdapter.emit).toBeCalledWith('rollback')
    })

    it('should reset document after 4 rollbackAttempts', async () => {
        const serverAdapter = initServerAdapter()
        serverAdapter.resetDoc = jest.fn()

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        PagesApiService.submitOperation = jest.fn(() => {
            const error = {
                response: {
                    status: 428
                }
            }

            return Promise.reject(error)
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )
        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )
        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )
        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )

        await setImmediatePromise()

        expect(serverAdapter.resetDoc).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should handle cursor from socket', () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        const cursor = getCursorData()
        socket.emit('cursor', cursor)

        expect(serverAdapter.emit).toBeCalledWith(
            'cursor',
            cursor.clientId,
            cursor.cursor,
            cursor.clientName,
            cursor.clientColor
        )
    })

    it('should send cursor', () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!
        const cursor = getCursorRange()
        const options = getOptions()

        serverAdapter.sendCursor(cursor)

        expect(socket.emit).toBeCalledWith('cursor', {
            cursor,
            clientId: options.userId,
            clientName: options.userName,
            clientColor: options.color
        })
    })

    it('should register callbacks', () => {
        const serverAdapter = initServerAdapter()

        const onSpy = jest.spyOn(serverAdapter, 'on')

        const ackCallback = () => {
            //
        }

        const operationCallback = () => {
            //
        }

        const rollbackCallback = () => {
            //
        }

        const cursorCallback = () => {
            //
        }

        const reconnectCallback = () => {
            //
        }

        serverAdapter.registerCallbacks({
            ack: ackCallback,
            operation: operationCallback,
            rollback: rollbackCallback,
            cursor: cursorCallback,
            reconnect: reconnectCallback
        })

        expect(onSpy).toBeCalledWith('ack', ackCallback)
        expect(onSpy).toBeCalledWith('operation', operationCallback)
        expect(onSpy).toBeCalledWith('rollback', rollbackCallback)
        expect(onSpy).toBeCalledWith('cursor', cursorCallback)
        expect(onSpy).toBeCalledWith('reconnect', reconnectCallback)
    })

    it('should handle disconnect socket event', () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        socket.emit('disconnect')

        expect(serverAdapter.ready).toBeFalsy()
        expect(serverAdapter.messagesBeforeReady).toEqual([])
        expect(serverAdapter.emit).toBeCalledWith('disconnect')
    })

    it('should handle update socket event', () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        const data = {}
        socket.emit('update', data)

        expect(serverAdapter.emit).toBeCalledWith('update', data)
    })

    it('should validate operation', () => {
        const serverAdapter = initServerAdapter()
        serverAdapter.curRevision = 2
        const revision = getRevision()
        revision.revision = 3

        expect(serverAdapter.validateIncomingOperation(revision)).toBeTruthy()

        const expectThrowError = (operation: any, message: string) => {
            try {
                serverAdapter.validateIncomingOperation(operation)
                throw new Error('Operation is valid')
            } catch (e) {
                // eslint-disable-next-line
                expect(e).toEqual(new Error(message))
            }
        }

        expectThrowError(
            undefined,
            'QuillSocketIOAdapter: Invalid Incoming Operation (Missing Operation)'
        )
        expectThrowError(
            {},
            'QuillSocketIOAdapter: Invalid Incoming Operation (Missing Operation.operation)'
        )
        expectThrowError(
            { operation: {} },
            'QuillSocketIOAdapter: Invalid Incoming Operation (Delta has not ops key)'
        )
        expectThrowError(
            { operation: { ops: {} } },
            'QuillSocketIOAdapter: Invalid Incoming Operation (Delta ops is not Array)'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 1 },
            'QuillSocketIOAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 2 },
            'QuillSocketIOAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 3 },
            'Operation is valid'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 4 },
            'QuillSocketIOAdapter: Invalid Incoming Operation (revision is greater than +1 current revision)'
        )
    })

    it('should correctly handle revisions on socket connect', () => {
        return new Promise((done) => {
            const serverAdapter = initServerAdapter()
            const socket = serverAdapter.socket!

            const secondClientText = 'Hello World!'
            let textIndex = 1

            jest.useRealTimers()

            PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
                return new Promise((resolve) => {
                    const resolveAfterTimeout = () => {
                        resolve([
                            {
                                operation: {
                                    ops: [{ insert: 'H' }]
                                },
                                submissionId: '1',
                                revision: 2
                            }
                        ])
                    }
                    setTimeout(resolveAfterTimeout, 40)
                })
            })

            const notifySpy = jest.spyOn(bugsnag, 'notify')
            notifySpy.mockClear()

            const validate = () => {
                expect(notifySpy).not.toBeCalled()
                expect(
                    serverAdapter.messagesBeforeReady.length
                ).toBeGreaterThanOrEqual(1)
                expect(serverAdapter.initialInitFinished).toBeTruthy()
                done()
            }

            const sendOperation = () => {
                const character = secondClientText[textIndex]

                const operation = {
                    operation: {
                        ops: [{ insert: character }]
                    },
                    submissionId: `${textIndex + 1}`,
                    revision: 2 + textIndex
                }

                socket.emit('operation', operation)

                textIndex += 1

                if (textIndex === secondClientText.length) {
                    process.nextTick(validate)
                } else {
                    setTimeout(sendOperation, 10)
                }
            }

            sendOperation()
            socket.emit('connect')
        })
    })
    it('should handle comments-updated event from socket', async () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()

        const revision = getRevision()
        socket.emit('comments-updated', revision)

        expect(serverAdapter.emit).toBeCalledWith('comments-updated')
    })

    it('should handle archive event from socket', async () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()

        socket.emit(SOCKET.documentArchived)

        expect(serverAdapter.emit).toBeCalledWith(SOCKET.documentArchived)
    })

    it('should handle unarchive event from socket', async () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()

        socket.emit(SOCKET.documentUnarchived)

        expect(serverAdapter.emit).toBeCalledWith(SOCKET.documentUnarchived)
    })

    it('should handle freehand update event from socket', async () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!
        jest.spyOn(PubSub, 'publish')

        socket.emit('connect')
        await setImmediatePromise()

        socket.emit(SOCKET.freehandDocumentUpdated, { freehandDocumentId: 1 })

        expect(PubSub.publish).toBeCalledWith(SOCKET.freehandDocumentUpdated, 1)
    })

    it('should reconnect when there is getRevisionsSinceRevision error', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.reject(new Error('revision error'))
        })

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        const serverAdapter = initServerAdapter()
        serverAdapter.reconnect = jest.fn()

        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect when there is _mergeSortAndValidateServerRevisions error', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()
        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        serverAdapter._mergeSortAndValidateServerRevisions = jest.fn(() => {
            throw new Error('_mergeSortAndValidateServerRevisions error')
        })

        serverAdapter.reconnect = jest.fn()

        const socket = serverAdapter.socket!

        socket.emit('connect')
        await setImmediatePromise()

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect when there is validateIncomingOperation error in serverOperation', async () => {
        PagesApiService.getRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const serverAdapter = initServerAdapter()
        serverAdapter.reconnect = jest.fn()

        const socket = serverAdapter.socket!

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        socket.emit('connect')
        await setImmediatePromise()

        const revision = getRevision()
        revision.revision = 10
        socket.emit('operation', revision)

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect when there is serverAck is invalid', async () => {
        const serverAdapter = initServerAdapter()
        serverAdapter.reconnect = jest.fn()

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        serverAdapter.serverAck({
            operation: new Delta(),
            submissionId: '',
            revision: 10
        })

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })
    it('should disconnect', () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        serverAdapter.disconnect()

        expect(socket.disconnect).toBeCalledWith()
    })
    it('should hide cursor when user does not have edit permissions', () => {
        const serverAdapter = initServerAdapter()
        const socket = serverAdapter.socket!

        serverAdapter.updatePermissions(false)
        const options = getOptions()
        expect(socket.emit).toBeCalledWith('cursor', {
            clientColor: options.color,
            clientId: options.userId,
            clientName: options.userName,
            cursor: null
        })
    })
    it('should send a revert revision', () => {
        const serverAdapter = initServerAdapter()

        expect(serverAdapter.sendRevert).toEqual(false)

        serverAdapter.prepareRevert()

        expect(serverAdapter.sendRevert).toEqual(true)

        PagesApiService.submitOperation = jest.fn(() => {
            return Promise.resolve({})
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            revision.revision,
            revision.operation,
            undefined,
            revision.submissionId
        )

        expect(PagesApiService.submitOperation).toBeCalledWith(
            {
                documentId: getDocumentId(),
                revision: revision.revision,
                operation: revision.operation,
                submissionId: revision.submissionId,
                cursor: {},
                revert: true
            },
            expect.any(Axios.CancelToken)
        )
        expect(serverAdapter.lastSent).toEqual(revision)

        serverAdapter.serverAck(revision)

        expect(serverAdapter.sendRevert).toEqual(false)
    })
})
