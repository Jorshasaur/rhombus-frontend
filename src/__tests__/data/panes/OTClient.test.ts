import {
    OTEditorClient,
    Synchronized,
    AwaitingConfirm,
    AwaitingWithBuffer,
    OTEditorAdapterCallbacks,
    OTServerAdapterCallbacks,
    OTEditorAdapter,
    OTOperation
} from '../../../data/panes/OTClient'
import { EventEmitter } from 'events'
import Delta, { DeltaStatic } from 'quill-delta'
import { RangeStatic } from 'quill'
import { getInitialContents, getInitialJSONContents } from '../../utils'
import { JSON1ServerRevision } from '../../../interfaces/revision'
import json1 from 'ot-json1'
import { JSON1Wrapper } from '../../../data/panes/Advil'

jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => {
            return '3a74dc93-8bc0-4358-91f3-c15f686d161f'
        })
    }
})

jest.mock('../../../helpers/LogHelper', () => {
    return {
        log: jest.fn()
    }
})

const docIdentifier = '1'
const imageData = {
    type: 'image',
    value: { height: 10, id: '12345', width: 10 }
}

const addImageOP = json1.replaceOp(['elements'], true, imageData)

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

    sendCursor(identifier: string, cursor: RangeStatic) {
        //
    }

    registerCallbacks(identifier: string, callbacks: OTServerAdapterCallbacks) {
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

class MockJSONServerAdapter extends EventEmitter {
    sendOperation = jest.fn(
        (
            identifier: string,
            revision: number,
            operation: OTOperation,
            submissionId: string
        ) => {
            //
        }
    )

    sendCursor(identifier: string, cursor: RangeStatic) {
        //
    }

    registerCallbacks(identifier: string, callbacks: OTServerAdapterCallbacks) {
        Object.keys(callbacks).forEach((eventName: string) => {
            this.on(eventName, callbacks[eventName])
        })
    }

    serverOperation(identifier: string, data: JSON1ServerRevision) {
        this.emit('operation', data.operation)
    }

    serverAck() {
        this.emit('ack')
    }

    serverRollback() {
        this.emit('rollback')
    }
}

class EditorAdapter extends EventEmitter implements OTEditorAdapter {
    contents: DeltaStatic = new Delta()

    applyOperation = jest.fn((changeDelta: DeltaStatic) => {
        this.contents = this.contents.compose(changeDelta)
    })

    updateContents = jest.fn((changeDelta: DeltaStatic) => {
        this.contents = this.contents.compose(changeDelta)
    })

    private callbacks: OTEditorAdapterCallbacks

    registerCallbacks(callbacks: OTEditorAdapterCallbacks) {
        this.callbacks = callbacks
    }

    setContents(contents: DeltaStatic) {
        this.contents = contents
    }

    textChange(operation: DeltaStatic, oldContents: DeltaStatic) {
        const contents = oldContents.compose(operation)
        const inverseOperation = contents.diff(oldContents)

        this.callbacks.operation(operation, inverseOperation)
    }

    getModule(name: string) {
        return {}
    }

    disconnect() {}
}

class JSONEditorAdapter extends EventEmitter implements OTEditorAdapter {
    contents: any

    constructor(paneContents: any) {
        super()
        this.contents = paneContents
    }

    applyOperation = jest.fn((operation: JSON1Wrapper) => {
        this.contents = json1.type.apply(this.contents, operation.ops)
    })

    updateContents = jest.fn((operation: JSON1Wrapper) => {
        this.contents = json1.type.apply(this.contents, operation.ops)
    })

    change(operation: OTOperation, oldContents: OTOperation) {
        this.callbacks.operation(operation, oldContents)
    }

    private callbacks: OTEditorAdapterCallbacks

    registerCallbacks(callbacks: OTEditorAdapterCallbacks) {
        this.callbacks = callbacks
    }

    disconnect() {}
}

describe('Delta OTEditorClient', () => {
    it('should create instance of OTEditorClient', () => {
        const currentRevision = 0

        const serverAdapter: any = {
            registerCallbacks: jest.fn()
        }

        const editorAdapter: any = {
            registerCallbacks: jest.fn()
        }

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        expect(otEditorClient).toBeInstanceOf(OTEditorClient)
        expect(serverAdapter.registerCallbacks).toBeCalled()
        expect(editorAdapter.registerCallbacks).toBeCalled()
        expect(otEditorClient.revision).toBe(1)
    })
    it('should apply operation to editor adapter from server operation', () => {
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)

        const operation = getInitialContents()

        serverAdapter.serverOperation(operation)

        expect(editorAdapter.applyOperation).toBeCalledWith(operation)
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(2)
    })
    it('should create awaiting confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            docIdentifier,
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
            docIdentifier,
            currentRevision + 1,
            textChange,
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
            docIdentifier,
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
            docIdentifier,
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
            docIdentifier,
            currentRevision + 1,
            textChange,
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
            docIdentifier,
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
            docIdentifier,
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
            docIdentifier,
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
            docIdentifier,
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
    it('should return isSynchronized flag correctly', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            docIdentifier,
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
    it('should reset client state with revision', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockServerAdapter()
        const editorAdapter = new EditorAdapter()

        const otEditorClient = new OTEditorClient(
            docIdentifier,
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

describe('JSON1 OTEditorClient', () => {
    it('should apply operation to editor adapter from server operation', () => {
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)

        const revision = {
            operation: new JSON1Wrapper(addImageOP),
            submissionId: '123',
            revision: 2,
            paneId: '12345'
        }

        serverAdapter.serverOperation('pane-id-1', revision)

        expect(editorAdapter.applyOperation).toBeCalledWith(revision.operation)
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(2)
    })
    it('should create awaiting confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        const wrapper = new JSON1Wrapper(addImageOP)
        // Inverts are tomorrow's problems, be sure to eat breakfast that day
        editorAdapter.change(wrapper, wrapper)

        // verify state after text change
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        expect(serverAdapter.sendOperation).toBeCalledWith(
            docIdentifier,
            currentRevision + 1,
            { ops: addImageOP },
            submissionId
        )

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState = otEditorClient.state as AwaitingConfirm

        expect(otState.outstanding.ops).toEqual(addImageOP)
        expect(otState.submissionId).toEqual(submissionId)
        expect(otState.inverseOutstanding.ops).toEqual(addImageOP)

        // receive awaiting operation confirm from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(2)
    })
    it('should create awaiting confirm with buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        const wrapper = new JSON1Wrapper(addImageOP)
        // Inverts are tomorrow's problems, be sure to eat breakfast that day
        editorAdapter.change(wrapper, wrapper)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const secondOp = [
            'elements',
            0,
            'value',
            'height',
            {
                i: 30,
                r: ['elements', 0, 'value', 'height']
            }
        ]
        const secondWrapper = new JSON1Wrapper(secondOp)
        editorAdapter.change(secondWrapper, secondWrapper)

        // verify state
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        const otState1 = otEditorClient.state as AwaitingWithBuffer

        expect(otState1.outstanding).toEqual(wrapper)
        expect(otState1.submissionId).toEqual(submissionId)
        expect(otState1.buffer).toEqual(secondWrapper)

        const thirdOp = [
            'elements',
            0,
            'value',
            'height',
            {
                i: 900,
                r: ['elements', 0, 'value', 'height']
            }
        ]
        const thirdWrapper = new JSON1Wrapper(thirdOp)
        editorAdapter.change(thirdWrapper, thirdWrapper)

        const buffer = secondWrapper.compose(thirdWrapper)

        const otState2 = otEditorClient.state as AwaitingWithBuffer
        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)
        expect(otState2.buffer).toEqual(buffer)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState3 = otEditorClient.state as AwaitingConfirm

        expect(otState3.outstanding).toEqual(buffer)
        expect(otState3.submissionId).toEqual(submissionId)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(3)
    })
    it('should update and transform contents from server operation while awaiting for confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        const wrapper = new JSON1Wrapper(addImageOP)
        editorAdapter.updateContents(wrapper)
        editorAdapter.change(wrapper, wrapper)

        // verify state after text change
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        expect(editorAdapter.contents).toEqual({
            elements: imageData,
            id: '12334',
            viewType: 'table'
        })
        expect(serverAdapter.sendOperation).toBeCalledWith(
            docIdentifier,
            currentRevision + 1,
            { ops: addImageOP },
            submissionId
        )

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState1 = otEditorClient.state as AwaitingConfirm

        expect(otState1.outstanding.ops).toEqual(addImageOP)
        expect(otState1.submissionId).toEqual(submissionId)

        const op = json1.replaceOp(['id'], true, 'aabbcc')
        const serverWrapper = new JSON1Wrapper(op)
        const revision = {
            operation: serverWrapper,
            submissionId: '1234',
            revision: currentRevision + 1
        }
        serverAdapter.serverOperation('pane-1234', revision)

        expect(editorAdapter.contents).toEqual({
            elements: imageData,
            id: 'aabbcc',
            viewType: 'table'
        })

        const transformedOperation = json1.type.transform(
            wrapper.ops,
            op,
            'left'
        )

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState2 = otEditorClient.state as AwaitingConfirm

        expect(otState2.outstanding.ops).toEqual(transformedOperation)
        expect(otState2.submissionId).toEqual(submissionId)

        // receive awaiting operation confirm from server
        serverAdapter.serverAck()

        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(3)

        expect(editorAdapter.contents).toEqual({
            elements: imageData,
            id: 'aabbcc',
            viewType: 'table'
        })
    })
    it('should update and transform contents from server operation while awaiting for confirm with buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        const wrapper = new JSON1Wrapper(addImageOP)
        editorAdapter.change(wrapper, wrapper)

        // verify state after text change
        const submissionId = '3a74dc93-8bc0-4358-91f3-c15f686d161f'

        expect(serverAdapter.sendOperation).toBeCalledWith(
            docIdentifier,
            currentRevision + 1,
            { ops: addImageOP },
            submissionId
        )

        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState = otEditorClient.state as AwaitingConfirm

        expect(otState.outstanding.ops).toEqual(addImageOP)
        expect(otState.submissionId).toEqual(submissionId)

        const op = json1.replaceOp(['id'], true, 'aabbcc')
        const serverWrapper = new JSON1Wrapper(op)
        const revision = {
            operation: serverWrapper,
            submissionId: '1234',
            revision: currentRevision + 1
        }
        serverAdapter.serverOperation('pane-1234', revision)

        // create second text change

        const secondWrapper = new JSON1Wrapper(
            json1.insertOp(['id'], 'rabbitrabbit')
        )
        editorAdapter.change(secondWrapper, secondWrapper)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)
        const transformedOperation = serverWrapper.transform(wrapper)

        const otState1 = otEditorClient.state as AwaitingWithBuffer

        expect(otState1.outstanding).toEqual(transformedOperation)
        expect(otState1.submissionId).toEqual(submissionId)
        expect(otState1.buffer.ops).toEqual(secondWrapper.ops)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(AwaitingConfirm)

        const otState2 = otEditorClient.state as AwaitingWithBuffer

        expect(otState2.outstanding.ops).toEqual(secondWrapper.ops)
        expect(otState2.submissionId).toEqual(submissionId)

        // receive ack from server
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(otEditorClient.revision).toBe(4)
    })
    it('should rollback awaiting confirm', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        const wrapper = new JSON1Wrapper(addImageOP)
        editorAdapter.change(wrapper, wrapper)

        // rollback
        serverAdapter.serverRollback()

        // verify state
        expect(otEditorClient.state).toBeInstanceOf(Synchronized)
        expect(editorAdapter.contents).toEqual(editorAdapter.contents)
        expect(otEditorClient.revision).toBe(1)
    })
    it('should ignore empty buffer', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // create text change - A
        const wrapper = new JSON1Wrapper(addImageOP)
        editorAdapter.updateContents(wrapper)
        editorAdapter.change(wrapper, wrapper)

        // create second text change - B
        const secondWrapper = new JSON1Wrapper(
            json1.replaceOp(['viewType'], 'table', 't-rex')
        )
        editorAdapter.updateContents(secondWrapper)
        editorAdapter.change(secondWrapper, secondWrapper)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        // create third text change - delete B
        const thirdWrapper = new JSON1Wrapper(
            json1.replaceOp(['viewType'], 'table', 'table')
        )
        editorAdapter.updateContents(thirdWrapper)
        editorAdapter.change(thirdWrapper, thirdWrapper)

        expect(otEditorClient.state).toBeInstanceOf(AwaitingWithBuffer)

        // server ack
        serverAdapter.serverAck()

        // verify state
        expect(otEditorClient.revision).toBe(2)
    })
    it('should rollback awaiting confirm with buffer', () => {
        // init OTEditorClient
        const initialContents = getInitialJSONContents()
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(initialContents)

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        const serverWrapper = new JSON1Wrapper(
            json1.replaceOp(['id'], '12334', 'aabbccc'),
            json1.replaceOp(['id'], 'aabbccc', '12334')
        )
        editorAdapter.change(serverWrapper, serverWrapper.invert())

        // create second text change
        const secondOp = json1.replaceOp(['viewType'], 'table', 'magic')
        const secondWrapper = new JSON1Wrapper(
            secondOp,
            json1.replaceOp(['viewType'], 'magic', 'table')
        )
        editorAdapter.change(secondWrapper, secondWrapper.invert())

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
    it('should return isSynchronized flag correctly', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeTruthy()

        // create text change
        const wrapper = new JSON1Wrapper(addImageOP)
        editorAdapter.change(wrapper, wrapper)

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeFalsy()
    })
    it('should reset client state with revision', () => {
        // init OTEditorClient
        const currentRevision = 0
        const serverAdapter = new MockJSONServerAdapter()
        const editorAdapter = new JSONEditorAdapter(getInitialJSONContents())

        const otEditorClient = new OTEditorClient(
            docIdentifier,
            currentRevision + 1,
            serverAdapter,
            editorAdapter
        )

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeTruthy()

        // create change
        const wrapper = new JSON1Wrapper(addImageOP)
        editorAdapter.change(wrapper, wrapper)

        // reset
        otEditorClient.resetClientWithRevision(2)

        // validate isSynchronized
        expect(otEditorClient.isSynchronized()).toBeTruthy()
        expect(otEditorClient.revision).toEqual(2)
    })
})
