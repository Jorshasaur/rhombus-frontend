import { EventEmitter } from 'events'
import { RangeStatic } from 'quill'
import Delta, { DeltaStatic } from 'quill-delta'
import {
    AwaitingConfirm,
    AwaitingWithBuffer,
    OTEditorClient,
    ServerAdapterCallbacks,
    Synchronized
} from '../../components/ot/OTClient'
import { markModifier } from '../../components/quill/modules/CommentMarking/modifier'
import QuillSources from '../../components/quill/modules/QuillSources'

jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => {
            return '3a74dc93-8bc0-4358-91f3-c15f686d161f'
        })
    }
})

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

class MockServerAdapter extends EventEmitter {
    sendOperation = jest.fn(
        (
            revision: number,
            operation: DeltaStatic,
            cursor: any,
            submissionId: string
        ) => {
            //
        }
    )

    sendCursor(cursor: RangeStatic) {
        //
    }

    registerCallbacks(callbacks: ServerAdapterCallbacks) {
        Object.keys(callbacks).forEach((eventName: string) => {
            this.on(eventName, callbacks[eventName])
        })
    }

    serverOperation(operation: DeltaStatic) {
        this.emit('operation', operation)
    }

    serverAck() {
        this.emit('ack')
    }

    serverRollback() {
        this.emit('rollback')
    }
}

class EditorAdapter extends EventEmitter {
    contents: DeltaStatic = new Delta()

    updateContents = jest.fn((changeDelta: DeltaStatic) => {
        this.contents = this.contents.compose(changeDelta)
    })

    setContents(contents: DeltaStatic) {
        this.contents = contents
    }

    getContents() {
        return this.contents
    }

    textChange(changeDelta: DeltaStatic, oldContents: DeltaStatic) {
        this.emit('text-change', changeDelta, oldContents, QuillSources.USER)
    }

    getModule(name: string) {
        return {}
    }
}

function getInitialContents() {
    return new Delta([
        { insert: 'Untitled' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: 'This is a document whose text is synced in real time\n' }
    ])
}

describe('OTEditorClient', () => {
    it('should create instance of OTEditorClient', () => {
        const currentRevision = 0

        const serverAdapter: any = {
            registerCallbacks: jest.fn()
        }

        const editorAdapter: any = {
            on: jest.fn()
        }

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        expect(otEditorClient).toBeInstanceOf(OTEditorClient)
        expect(serverAdapter.registerCallbacks).toBeCalled()
        expect(editorAdapter.on).toHaveBeenCalledTimes(2)
        expect(otEditorClient.revision).toBe(1)
    })

    it('should update contents from server operation', () => {
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)

        const operation = getInitialContents()

        serverAdapter.serverOperation(operation)

        expect(editorAdapter.updateContents).toBeCalledWith(
            operation,
            QuillSources.API
        )
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(2)
    })

    it('should create awaiting confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // verify state after text change
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        expect(serverAdapter.sendOperation).toBeCalledWith(
            currentRevision + 1,
            textChange,
            undefined,
            submissionId
        )

        const inverseDelta = editorAdapter.contents.diff(initialContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState = otEditorClient.state as AwaitingConfirm

        expect(otState.outstanding).toEqual(textChange)
        expect(otState.submissionId).toEqual(submissionId)
        expect(otState.inverseOutstanding).toEqual(inverseDelta)

        // receive awaiting operation confirm from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(2)
    })

    it('should create awaiting confirm with buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        // create second text change
        let previousContents = editorAdapter.contents

        const secondTextChange = new Delta()
            .retain(previousContents.length())
            .insert(' second')
        editorAdapter.updateContents(secondTextChange)
        editorAdapter.textChange(secondTextChange, previousContents)

        // verify state
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'
        const inverseOutstanding = previousContents.diff(initialContents)
        let inverseBuffer = editorAdapter.contents.diff(previousContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        const otState1 = otEditorClient.state as AwaitingWithBuffer

        expect(otState1.outstanding).toEqual(textChange)
        expect(otState1.submissionId).toEqual(submissionId)
        expect(otState1.inverseOutstanding).toEqual(inverseOutstanding)
        expect(otState1.buffer).toEqual(secondTextChange)
        expect(otState1.inverseBuffer).toEqual(inverseBuffer)

        // create third text change
        previousContents = editorAdapter.contents
        const thirdTextChange = new Delta()
            .retain(previousContents.length())
            .insert(' third')
        editorAdapter.updateContents(thirdTextChange)
        editorAdapter.textChange(thirdTextChange, previousContents)

        // verify state
        const thirdInverseBuffer = editorAdapter.contents.diff(previousContents)
        const buffer = secondTextChange.compose(thirdTextChange)
        inverseBuffer = thirdInverseBuffer.compose(inverseBuffer)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        const otState2 = otEditorClient.state as AwaitingWithBuffer

        expect(otState2.outstanding).toEqual(textChange)
        expect(otState2.submissionId).toEqual(submissionId)
        expect(otState2.inverseOutstanding).toEqual(inverseOutstanding)
        expect(otState2.buffer).toEqual(buffer)
        expect(otState2.inverseBuffer).toEqual(inverseBuffer)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState3 = otEditorClient.state as AwaitingConfirm

        expect(otState3.outstanding).toEqual(buffer)
        expect(otState3.submissionId).toEqual(submissionId)
        expect(otState3.inverseOutstanding).toEqual(inverseBuffer)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(3)
    })

    it('should update and transform contents from server operation while awaiting for confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // verify state after text change
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        expect(serverAdapter.sendOperation).toBeCalledWith(
            currentRevision + 1,
            textChange,
            undefined,
            submissionId
        )

        const inverseDelta = editorAdapter.contents.diff(initialContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState1 = otEditorClient.state as AwaitingConfirm

        expect(otState1.outstanding).toEqual(textChange)
        expect(otState1.submissionId).toEqual(submissionId)
        expect(otState1.inverseOutstanding).toEqual(inverseDelta)

        // receive operation on same line from server
        const serverTextChange = new Delta()
            .retain(initialContents.length())
            .insert('Server text change')
        serverAdapter.serverOperation(serverTextChange)

        const ops = editorAdapter.contents.ops!
        expect(ops[ops.length - 1]).toEqual({
            insert:
                'This is a document whose text is synced in real time\nServer text changeNew line message'
        })

        const transformedOperation = serverTextChange.transform(
            textChange,
            true
        )
        const transformedInverseOperation = serverTextChange.transform(
            inverseDelta,
            true
        )

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState2 = otEditorClient.state as AwaitingConfirm

        expect(otState2.outstanding).toEqual(transformedOperation)
        expect(otState2.submissionId).toEqual(submissionId)
        expect(otState2.inverseOutstanding).toEqual(transformedInverseOperation)

        // receive awaiting operation confirm from server
        serverAdapter.serverAck()

        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(3)
    })

    it('should update and transform contents from server operation while awaiting for confirm with buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message\n')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // verify state
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        const inverseDelta = editorAdapter.contents.diff(initialContents)
        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        // receive operation on same line from server
        const serverTextChange = new Delta()
            .retain(initialContents.length())
            .insert('Server text change\n')
        serverAdapter.serverOperation(serverTextChange)

        let ops = editorAdapter.contents.ops!
        expect(ops[ops.length - 1]).toEqual({
            insert:
                'This is a document whose text is synced in real time\nServer text change\nNew line message\n'
        })

        const transformedOperation = serverTextChange.transform(
            textChange,
            true
        )
        const transformedInverseOperation = serverTextChange.transform(
            inverseDelta,
            true
        )

        // create second text change
        const previousContents = editorAdapter.contents

        const secondTextChange = new Delta()
            .retain(previousContents.length())
            .insert('second')
        editorAdapter.updateContents(secondTextChange)
        editorAdapter.textChange(secondTextChange, previousContents)

        // verify state
        const inverseBuffer = editorAdapter.contents.diff(previousContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        const otState1 = otEditorClient.state as AwaitingWithBuffer

        expect(otState1.outstanding).toEqual(transformedOperation)
        expect(otState1.submissionId).toEqual(submissionId)
        expect(otState1.inverseOutstanding).toEqual(transformedInverseOperation)
        expect(otState1.buffer).toEqual(secondTextChange)
        expect(otState1.inverseBuffer).toEqual(inverseBuffer)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState2 = otEditorClient.state as AwaitingWithBuffer

        expect(otState2.outstanding).toEqual(secondTextChange)
        expect(otState2.submissionId).toEqual(submissionId)
        expect(otState2.inverseOutstanding).toEqual(inverseBuffer)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        ops = editorAdapter.contents.ops!
        expect(ops[ops.length - 1]).toEqual({
            insert:
                'This is a document whose text is synced in real time\nServer text change\nNew line message\nsecond'
        })
        expect(otEditorClient.revision).toBe(4)
    })

    it('should rollback awaiting confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // rollback
        serverAdapter.serverRollback()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(editorAdapter.contents).toEqual(initialContents)
        expect(otEditorClient.revision).toBe(1)
    })

    it('should ignore empty buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change - A
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('A')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // create second text change - B
        let previousContents = editorAdapter.contents
        const len = previousContents.length()
        const secondTextChange = new Delta().retain(len).insert('B')
        editorAdapter.updateContents(secondTextChange)
        editorAdapter.textChange(secondTextChange, previousContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        // create third text change - delete B
        previousContents = editorAdapter.contents
        const thirdTextChange = new Delta().retain(len).delete(1)
        editorAdapter.updateContents(thirdTextChange)
        editorAdapter.textChange(thirdTextChange, previousContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        // server ack
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(2)
    })

    it('should rollback awaiting confirm with buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message')
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // create second text change
        const previousContents = editorAdapter.contents

        const secondTextChange = new Delta()
            .retain(previousContents.length())
            .insert('second')
        editorAdapter.updateContents(secondTextChange)
        editorAdapter.textChange(secondTextChange, previousContents)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        const otState1 = otEditorClient.state as AwaitingWithBuffer

        const applyOperationSpy = jest.spyOn(otEditorClient, 'applyOperation')

        // rollback
        serverAdapter.serverRollback()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(editorAdapter.contents).toEqual(initialContents)
        expect(applyOperationSpy).toHaveBeenCalledTimes(2)
        expect(applyOperationSpy).toBeCalledWith(otState1.inverseBuffer)
        expect(applyOperationSpy).toBeCalledWith(otState1.inverseOutstanding)
    })

    it('should correctly apply modifiers', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        otEditorClient.addModifier(markModifier)

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const attributes = { mark: [] }
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message', attributes)
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        const otState = otEditorClient.state as AwaitingConfirm

        expect(otState.outstanding).toEqual(
            new Delta([
                { retain: 62 },
                { insert: 'New line message', attributes: {} }
            ])
        )

        expect(otState.inverseOutstanding).toEqual(
            new Delta([{ retain: 62 }, { delete: 16 }])
        )
    })

    it('should correctly apply modifiers for change in attributes', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        otEditorClient.addModifier(markModifier)

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const attributes = { mark: [], author: 9 }

        const textChange = new Delta().retain(9).retain(4, attributes)
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        const otState = otEditorClient.state as AwaitingConfirm

        expect(otState.outstanding).toEqual(
            new Delta([{ retain: 9 }, { attributes: { author: 9 }, retain: 4 }])
        )

        expect(otState.inverseOutstanding).toEqual(
            new Delta([
                { retain: 9 },
                { attributes: { author: null }, retain: 4 }
            ])
        )
    })

    it('should return isSynchronized flag correctly', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeTruthy()

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const attributes = { mark: [] }
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message', attributes)
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeFalsy()
    })
    it('should catch unknown blots and display a default error to the user', () => {
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()
        const emitEvent = 'apply-operation-error'
        const parchmentError = new Error('[Parchment] Unable to create blot')
        editorAdapter.updateContents = jest.fn(() => {
            throw parchmentError
        })
        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        otEditorClient.emit = jest.fn()
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)

        const operation = getInitialContents()

        serverAdapter.serverOperation(operation)

        expect(otEditorClient.emit).toBeCalledWith(
            emitEvent,
            parchmentError,
            operation
        )
    })
    it('should catch unknown blots and display an error with the editing authors name to the user', () => {
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()
        const emitEvent = 'apply-operation-error'
        const parchmentError = new Error('[Parchment] Unable to create blot')
        editorAdapter.updateContents = jest.fn(() => {
            throw parchmentError
        })
        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        otEditorClient.emit = jest.fn()
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)

        const operation = new Delta([
            { insert: 'Untitled' },
            { insert: '\n', attributes: { header: 1, author: '1' } },
            { insert: 'This is a document whose text is synced in real time\n' }
        ])

        serverAdapter.serverOperation(operation)

        expect(otEditorClient.emit).toBeCalledWith(
            emitEvent,
            parchmentError,
            operation
        )
    })

    it('should reset client state with revision', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeTruthy()

        // set initial contents
        const initialContents = getInitialContents()
        editorAdapter.setContents(initialContents)

        // create text change
        const attributes = { mark: [] }
        const textChange = new Delta()
            .retain(initialContents.length())
            .insert('New line message', attributes)
        editorAdapter.setContents(initialContents.compose(textChange))
        editorAdapter.textChange(textChange, initialContents)

        // reset
        otEditorClient.resetClientWithRevision(2)

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeTruthy()
        expect(otEditorClient.revision).toEqual(2)
    })
})
