import { OTServerAdapter, OTEmitter } from '../../../data/panes/OTServerAdapter'
import { GenericContents } from '../../../interfaces/documentContents'
import PagesApiService from '../../../data/services/PagesApiService'
import setImmediatePromise from 'set-immediate-promise'
import bugsnag from '../../../bugsnag'
import Axios from 'axios'
import { mockSocket } from '../../mockData/mockSocket'
import { SocketEvents } from '../../../data/panes/SocketManager'
import { validateIncomingJSON1Operation } from '../../../data/panes/Validations'

jest.mock('../../../helpers/LogHelper', () => {
    return {
        log: jest.fn()
    }
})

function getDocumentId() {
    return '1'
}

const paneId = 'aabbcc-112233'

function getInitialDocumentContents(): GenericContents {
    return {
        revision: 1,
        operation: []
    }
}

function initServerAdapter() {
    const documentId = getDocumentId()
    const documentContents = getInitialDocumentContents()
    const socketManager = new mockSocket() as any

    const serverAdapter = new OTServerAdapter(
        paneId,
        documentId,
        documentContents,
        socketManager
    )

    serverAdapter.emitter.emit = jest.fn()

    return {
        serverAdapter,
        socketManager
    }
}

function getDocumentOTState(serverAdapter: OTServerAdapter) {
    return serverAdapter.otStates.get(serverAdapter.paneId)!
}

function registerCallbacks(serverAdapter: OTServerAdapter) {
    const callbacks = {
        ack: jest.fn(),
        operation: jest.fn(),
        rollback: jest.fn(),
        cursor: jest.fn(),
        reconnect: jest.fn()
    }
    serverAdapter.registerCallbacks(serverAdapter.paneId, callbacks)
    return callbacks
}

function getRevision() {
    return {
        operation: { ops: [] },
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

describe('OTServerAdapter', () => {
    it('should create instance of OTServerAdapter', () => {
        const { serverAdapter, socketManager } = initServerAdapter()
        expect(serverAdapter).toBeInstanceOf(OTServerAdapter)
        expect(serverAdapter.initialInitFinished).toBeFalsy()

        const events = [
            SocketEvents.clientReady,
            SocketEvents.paneOperation,
            SocketEvents.cursor,
            SocketEvents.disconnect
        ]

        expect(socketManager.on).toHaveBeenCalledTimes(events.length)

        events.forEach((event: string) => {
            expect(socketManager.on).toBeCalledWith(event, expect.any(Function))
        })
    })

    it('should handle revisions that were created before reconnect', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const otState = getDocumentOTState(serverAdapter)
        const callbacks = registerCallbacks(serverAdapter)

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(otState.ready).toBeTruthy()
        expect(serverAdapter.initialInitFinished).toBeTruthy()
        expect(serverAdapter.emitter.emit).toBeCalledWith('ready')
        expect(serverAdapter.emitter.emit).not.toBeCalledWith(
            'reconnect',
            false
        )

        socketManager.emit('disconnect')

        const revision = getRevision()
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([revision])
        })

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(PagesApiService.getPanesRevisionsSinceRevision).toBeCalledWith(
            serverAdapter.paneId,
            1
        )
        expect(callbacks.reconnect).toBeCalledWith(false)
        expect(serverAdapter.emitter.emit).toBeCalledWith('reconnect')
        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
    })

    it('should handle revisions that were created before connect', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)

        const revision = getRevision()
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([revision])
        })

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(PagesApiService.getPanesRevisionsSinceRevision).toBeCalledWith(
            serverAdapter.paneId,
            1
        )
        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
        expect(serverAdapter.emitter.emit).toBeCalledWith('operation')
        expect(callbacks.operation).toBeCalledWith(revision.operation)
    })

    it('should handle revisions that were created before reconnect and ack', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)
        const otState = getDocumentOTState(serverAdapter)

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(serverAdapter.initialInitFinished).toBeTruthy()
        expect(callbacks.reconnect).not.toBeCalledWith(false)

        socketManager.emit('disconnect')

        const revision = getRevision()

        otState.lastSent = {
            revision: revision.revision,
            operation: revision.operation,
            submissionId: revision.submissionId
        }

        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([revision])
        })

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(PagesApiService.getPanesRevisionsSinceRevision).toBeCalledWith(
            serverAdapter.paneId,
            1
        )
        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
        expect(callbacks.ack).toBeCalled()
        expect(serverAdapter.emitter.emit).toBeCalledWith('ack')
        expect(callbacks.operation).not.toBeCalledWith(revision.operation)
        expect(callbacks.reconnect).toBeCalledWith(true)
    })

    it('should handle operation event from socket', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)
        const otState = getDocumentOTState(serverAdapter)

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        const revision = getRevision()
        socketManager.emit('pane-operation', paneId, revision)

        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
        expect(callbacks.operation).toBeCalledWith(revision.operation)
        expect(otState.currentRevision).toBe(revision.revision)
    })

    it('should handle ack from socket', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)
        const otState = getDocumentOTState(serverAdapter)

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        const revision = getRevision()
        revision.submissionId = '2'

        otState.lastSent = {
            revision: revision.revision,
            operation: revision.operation,
            submissionId: revision.submissionId
        }

        socketManager.emit('pane-operation', paneId, revision)

        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
        expect(serverAdapter.emitter.emit).toBeCalledWith('ack')
        expect(callbacks.ack).toBeCalled()
        expect(otState.currentRevision).toBe(revision.revision)
    })

    it('should not ack multiple times for same operation', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)
        const otState = getDocumentOTState(serverAdapter)

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        let revision = getRevision()
        revision.submissionId = '2'

        otState.lastSent = {
            revision: revision.revision,
            operation: revision.operation,
            submissionId: revision.submissionId
        }

        socketManager.emit('pane-operation', paneId, revision)

        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
        expect(serverAdapter.emitter.emit).toBeCalledWith('ready')
        expect(callbacks.ack).toBeCalled()
        expect(otState.currentRevision).toBe(revision.revision)

        socketManager.emit('pane-operation', paneId, revision)
        socketManager.emit('pane-operation', paneId, revision)

        expect(callbacks.ack).toHaveBeenCalledTimes(1)
        expect(otState.lastSent).toBeNull()
        expect(otState.lastAck).toBeDefined()
        expect(otState.lastAck!.submissionId).toBe(revision.submissionId)

        revision = getRevision()
        revision.revision = 3
        revision.submissionId = '3'
        socketManager.emit('pane-operation', paneId, revision)

        expect(callbacks.operation).toBeCalledWith({
            ops: []
        })
    })

    it('should not handle same operation multiple times', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)
        const otState = getDocumentOTState(serverAdapter)

        const serverOperationSpy = jest.spyOn(serverAdapter, 'serverOperation')
        const notifySpy = jest.spyOn(bugsnag, 'notify')

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        const revision = getRevision()
        revision.submissionId = '2'

        socketManager.emit('pane-operation', paneId, revision)

        expect(serverOperationSpy).toBeCalledWith(
            serverAdapter.paneId,
            revision
        )
        expect(serverAdapter.emitter.emit).toBeCalledWith('ready')
        expect(callbacks.operation).toBeCalledWith({
            ops: []
        })
        expect(otState.currentRevision).toBe(revision.revision)

        serverAdapter.reconnect = jest.fn()
        socketManager.emit('pane-operation', paneId, revision)

        expect(callbacks.operation).toHaveBeenCalledTimes(1)
        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should send operation', () => {
        const { serverAdapter } = initServerAdapter()
        const otState = getDocumentOTState(serverAdapter)

        PagesApiService.submitPanesOperation = jest.fn(() => {
            return Promise.resolve({})
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )

        expect(PagesApiService.submitPanesOperation).toBeCalledWith(
            {
                documentId: getDocumentId(),
                paneId,
                revision: revision.revision,
                operation: revision.operation,
                submissionId: revision.submissionId,
                type: 'json1'
            },
            expect.any(Axios.CancelToken)
        )
        expect(otState.lastSent).toEqual(revision)
    })

    it('should handle operation error', async () => {
        jest.useFakeTimers()

        const { serverAdapter } = initServerAdapter()

        PagesApiService.submitPanesOperation = jest.fn(() => {
            return Promise.reject(new Error('Error'))
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.sendOperation(
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )

        await setImmediatePromise()

        const sendOperationSpy = jest.spyOn(serverAdapter, 'sendOperation')

        jest.runOnlyPendingTimers()

        expect(setTimeout).toHaveBeenLastCalledWith(expect.any(Function), 1000)
        expect(sendOperationSpy).toBeCalledWith(
            paneId,
            revision.revision,
            revision.operation,
            revision.submissionId
        )
    })

    it('should handle network error', async () => {
        jest.useFakeTimers()

        const { serverAdapter } = initServerAdapter()

        PagesApiService.submitPanesOperation = jest.fn(() => {
            return Promise.reject(new Error('Network Error'))
        })

        const revision = getRevision()
        revision.submissionId = '2'

        serverAdapter.reconnect = jest.fn()
        serverAdapter.sendOperation(
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )

        await setImmediatePromise()

        jest.runOnlyPendingTimers()

        expect(serverAdapter.reconnect).toBeCalled()
    })

    it('should handle operation rollback', async () => {
        const { serverAdapter } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)

        PagesApiService.submitPanesOperation = jest.fn(() => {
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
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )

        await setImmediatePromise()

        expect(callbacks.rollback).toBeCalledWith()
    })

    it('should reset document after 4 rollbackAttempts', async () => {
        const { serverAdapter } = initServerAdapter()
        const callbacks = registerCallbacks(serverAdapter)
        serverAdapter.resetDoc = jest.fn()

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        PagesApiService.submitPanesOperation = jest.fn(() => {
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
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )
        serverAdapter.sendOperation(
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )
        serverAdapter.sendOperation(
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )
        serverAdapter.sendOperation(
            paneId,
            revision.revision,
            revision.operation as any,
            revision.submissionId
        )

        await setImmediatePromise()

        expect(serverAdapter.resetDoc).toBeCalled()
        expect(notifySpy).toBeCalled()
        expect(callbacks.rollback).toBeCalledTimes(3)
    })

    it('should register callbacks', () => {
        const { serverAdapter } = initServerAdapter()
        registerCallbacks(serverAdapter)

        expect(serverAdapter.otEmitters.size).toEqual(1)
    })

    it('should handle disconnect socket event', () => {
        const { serverAdapter, socketManager } = initServerAdapter()
        const otState = getDocumentOTState(serverAdapter)
        otState.ready = true

        socketManager.emit('disconnect')

        expect(otState.ready).toBeFalsy()
        expect(otState.revisionsBeforeReady).toEqual([])
        expect(serverAdapter.emitter.emit).toBeCalledWith('disconnect')
    })

    it('should validate operation', () => {
        const currentRevision = 2

        const revision = getRevision()
        revision.revision = 3

        expect(
            validateIncomingJSON1Operation(revision, currentRevision)
        ).toBeTruthy()

        const expectThrowError = (operation: any, message: string) => {
            const errorFunction = () => {
                validateIncomingJSON1Operation(operation, currentRevision)
            }
            expect(errorFunction).toThrowError(message)
        }

        expectThrowError(
            undefined,
            'OTServerAdapter: Invalid Incoming Operation (Missing Operation)'
        )
        expectThrowError(
            {},
            'OTServerAdapter: Invalid Incoming Operation (Missing Operation.operation)'
        )
        expectThrowError(
            { operation: {} },
            'OTServerAdapter: Invalid Incoming Operation (JSON1 op is not Array)'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 1 },
            'OTServerAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 2 },
            'OTServerAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
        )
        expectThrowError(
            { operation: { ops: [] }, revision: 4 },
            'OTServerAdapter: Invalid Incoming Operation (revision is greater than +1 current revision)'
        )
    })

    it('should correctly handle revisions on socket connect', () => {
        return new Promise((done) => {
            const { serverAdapter, socketManager } = initServerAdapter()
            registerCallbacks(serverAdapter)
            const otState = getDocumentOTState(serverAdapter)

            const secondClientText = 'Hello World!'
            let textIndex = 1

            jest.useRealTimers()

            PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
                return new Promise((resolve) => {
                    const resolveAfterTimeout = () => {
                        resolve([
                            {
                                operation: {
                                    ops: []
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
                    otState.revisionsBeforeReady.length
                ).toBeGreaterThanOrEqual(1)
                expect(serverAdapter.initialInitFinished).toBeTruthy()
                done()
            }

            const sendOperation = () => {
                const character = secondClientText[textIndex]

                const operation = {
                    operation: {
                        ops: []
                    },
                    submissionId: `${textIndex + 1}`,
                    revision: 2 + textIndex
                }

                socketManager.emit('pane-operation', paneId, operation)

                textIndex += 1

                if (textIndex === secondClientText.length) {
                    process.nextTick(validate)
                } else {
                    setTimeout(sendOperation, 10)
                }
            }

            sendOperation()
            socketManager.emit('connect')
            socketManager.emit('client-ready')
        })
    })

    it('should reconnect when there is getRevisionsSinceRevision error', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.reject(new Error('revision error'))
        })

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        const { serverAdapter, socketManager } = initServerAdapter()
        serverAdapter.reconnect = jest.fn()

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect when there is _mergeSortAndValidateServerRevisions error', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        serverAdapter._mergeSortAndValidateServerRevisions = jest.fn(() => {
            throw new Error('_mergeSortAndValidateServerRevisions error')
        })

        serverAdapter.reconnect = jest.fn()

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect when there is validateIncomingOperation error in serverOperation', async () => {
        PagesApiService.getPanesRevisionsSinceRevision = jest.fn(() => {
            return Promise.resolve([])
        })

        const { serverAdapter, socketManager } = initServerAdapter()
        serverAdapter.reconnect = jest.fn()

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        socketManager.emit('connect')
        socketManager.emit('client-ready')
        await setImmediatePromise()

        const revision = getRevision()
        revision.revision = 10
        socketManager.emit('pane-operation', paneId, revision)

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect when serverAck is invalid', async () => {
        const { serverAdapter } = initServerAdapter()
        serverAdapter.reconnect = jest.fn()

        const notifySpy = jest.spyOn(bugsnag, 'notify')
        notifySpy.mockClear()

        serverAdapter.serverAck(paneId, {
            operation: { ops: [] },
            submissionId: '',
            revision: 10
        })

        expect(serverAdapter.reconnect).toBeCalled()
        expect(notifySpy).toBeCalled()
    })

    it('should reconnect', () => {
        const { serverAdapter, socketManager } = initServerAdapter()
        socketManager.reconnect = jest.fn()

        serverAdapter.reconnect()

        expect(socketManager.reconnect).toBeCalledWith()
    })

    it('OTEmitter - should register callbacks and handle OT methods', () => {
        const callbacks = {
            ack: jest.fn(),
            operation: jest.fn(),
            rollback: jest.fn(),
            cursor: jest.fn(),
            reconnect: jest.fn()
        }

        const otEmitter = new OTEmitter(callbacks)

        const operation = { ops: [] }
        otEmitter.emitOperation(operation as any)

        expect(callbacks.operation).toBeCalledWith(operation)

        otEmitter.emitAck()

        expect(callbacks.ack).toBeCalled()

        otEmitter.emitRollback()

        expect(callbacks.rollback).toBeCalled()

        otEmitter.emitReconnect(true)

        expect(callbacks.reconnect).toBeCalledWith(true)
    })

    it('should remove emitter events on disconnect', async () => {
        const { serverAdapter, socketManager } = initServerAdapter()
        serverAdapter.onPaneOperation = jest.fn()
        serverAdapter.attachToSocket()
        const revision = getRevision()
        revision.revision = 10
        socketManager.emit('pane-operation', paneId, revision)
        await setImmediatePromise()

        expect(serverAdapter.onPaneOperation).toHaveBeenCalledTimes(1)

        serverAdapter.disconnect()
        socketManager.emit('pane-operation', paneId, revision)
        socketManager.emit('pane-operation', paneId, revision)
        socketManager.emit('pane-operation', paneId, revision)
        await setImmediatePromise()

        expect(serverAdapter.onPaneOperation).toHaveBeenCalledTimes(1)
    })
})
