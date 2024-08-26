import Delta from 'quill-delta'
import setImmediatePromise from 'set-immediate-promise'
import waitForExpect from 'wait-for-expect'
import SelectionManager from '../../components/pages/Editor/SelectionManager'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import { CommentMarking } from '../../components/quill/modules/CommentMarking'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import QuillSources from '../../components/quill/modules/QuillSources'
import store from '../../data/store'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { SelectionType } from '../../interfaces/selectionType'
import { mockQuill } from '../mockData/mockQuill'
store.dispatch = jest.fn()

const lodash = require('lodash')

interface Line {
    index: number
    prev: {}
}

lodash.debounce = (fn) => fn

const Quill = mockQuill

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

const service: BlockEmbedService = 'prototype'

const blockEmbedValue = {
    version: 1,
    originalLink: 'https://link.com',
    service,
    type: 'test',
    uuid: '1',
    authorId: '1',
    embedData: {},
    createdAt: '2018-11-08T21:18:24.424Z'
}

const options = {
    enabled: true,
    mainEditor: true
}

function createBlockEmbed() {
    return new BlockEmbed(BlockEmbed.create(blockEmbedValue))
}

beforeEach(() => {
    const events = {}

    Quill.on = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }

    Quill.off = (eventName: string, handler: Function) => {
        delete events[eventName]
    }

    Quill.emit = (eventName: string, ...args: any[]) => {
        events[eventName](...args)
    }

    const domNode = document.createElement('div')

    Quill.container = domNode

    Quill.getBounds = () => {
        return domNode.getBoundingClientRect()
    }

    Quill.getFormat = () => {
        return {}
    }

    Quill.getLine = (index = 0) => {
        const line = {
            index,
            prev: {}
        }
        return [line, 0]
    }
    Quill.getIndex = (line: Line) => line.index
    Quill.getText = () => {
        return 'abc'
    }

    Quill.getLines = () => {
        return [{}, createBlockEmbed(), {}, createBlockEmbed()]
    }

    Quill.scroll = {}
    Quill.selection = {
        getRange() {
            return [
                {
                    index: 1,
                    length: 10
                }
            ]
        }
    }

    Quill.insertText = jest.fn()

    Quill.root = document.createElement('div')

    const modules = {}

    Quill.setModule = (name: string, module: any) => {
        modules[name] = module
    }

    Quill.setSelection = () => undefined

    Quill.getModule = (name: string) => {
        return modules[name]
    }

    Quill.getLength = () => {
        return 300
    }

    BlockEmbed.prototype.unhighlight = jest.fn()
    BlockEmbed.prototype.highlight = jest.fn()
    store.dispatch = jest.fn()
})

describe('SelectionManager', () => {
    it('should watch for editor change and drag events when module is enabled', () => {
        const handleDraggingSpy = jest.spyOn(
            SelectionManager.prototype,
            'handleDragging'
        )
        Quill.on = jest.fn()
        const selectionManager = new SelectionManager(Quill, options)
        expect(Quill.on).toHaveBeenCalledTimes(1)
        expect(handleDraggingSpy).toHaveBeenCalledTimes(1)
        handleDraggingSpy.mockRestore()
        selectionManager.detach()
    })

    it('should deselect embeds when focused element is body', async () => {
        const selectionManager = new SelectionManager(Quill, options)

        const handleEmbedDeselectSpy = jest.spyOn(
            selectionManager,
            'handleEmbedDeselect'
        )

        jest.spyOn(store, 'getState').mockImplementationOnce(() => {
            return {
                selection: {
                    index: 1
                }
            }
        })

        const mouseUpEvent = document.createEvent('HTMLEvents')
        mouseUpEvent.initEvent('mouseup', false, true)
        document.body.dispatchEvent(mouseUpEvent)

        const dispatchCall = {
            type: 'CLEAR_SELECTION'
        }
        expect(handleEmbedDeselectSpy).toHaveBeenCalled()
        expect(store.dispatch).toBeCalledWith(dispatchCall)

        selectionManager.detach()
    })

    it('should not watch for editor change and drag events when module is disabled', () => {
        const handleDraggingSpy = jest.spyOn(
            SelectionManager.prototype,
            'handleDragging'
        )
        Quill.on = jest.fn()
        const selectionManager = new SelectionManager(Quill, { enabled: false })
        expect(Quill.on).not.toBeCalled()
        expect(handleDraggingSpy).not.toBeCalled()
        handleDraggingSpy.mockRestore()
        selectionManager.detach()
    })

    it('should handle selection on editor selection change event', async () => {
        const editorId = 'editor-id'
        const embedId = 'embed-id'

        const selectionManager = new SelectionManager(Quill, {
            enabled: true,
            editorId,
            embedId
        })

        const range = { index: 1, length: 0 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()

        const dispatchCall = {
            data: {
                editorId,
                activeEmbed: embedId,
                mainEditor: false,
                blotName: '',
                bottom: 0,
                height: 0,
                index: range.index,
                isFirstLine: false,
                left: 0,
                right: 0,
                selectionLength: range.length,
                selectionType: SelectionType.Text,
                text: 'abc',
                top: 0,
                width: 0
            },
            type: 'SELECTION_CHANGED'
        }
        expect(store.dispatch).toBeCalledWith(dispatchCall)

        selectionManager.detach()
    })

    it('should ignore empty and silent selection', async () => {
        const selectionManager = new SelectionManager(Quill, options)

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            null,
            null,
            QuillSources.SILENT
        )
        await setImmediatePromise()

        expect(store.dispatch).not.toHaveBeenCalled()

        selectionManager.detach()
    })

    it('should clear selection if there is no range', async () => {
        const selectionManager = new SelectionManager(Quill, options)
        selectionManager.unhighlightEmbeds = jest.fn()

        Quill.getSelection = () => {
            return null
        }

        const commentMarking = new CommentMarking(Quill, true)
        commentMarking.selectedId = '1'
        commentMarking.clear = jest.fn()
        Quill.setModule(CommentMarking.moduleName, commentMarking)

        Quill.emit(QuillEvents.EDITOR_CHANGE, QuillEvents.TEXT_CHANGE)
        await setImmediatePromise()

        const dispatchCall = {
            type: 'CLEAR_SELECTION'
        }
        expect(selectionManager.unhighlightEmbeds).toHaveBeenCalled()
        expect(store.dispatch).toBeCalledWith(dispatchCall)

        selectionManager.detach()
    })
    it('should not clear text marking if focused on Quill', async () => {
        const selectionManager = new SelectionManager(Quill, options)
        selectionManager.unhighlightEmbeds = jest.fn()

        Quill.getSelection = () => {
            return null
        }

        const commentMarking = new CommentMarking(Quill, true)
        commentMarking.clear = jest.fn()

        const fakeInput = document.createElement('input')
        fakeInput.className = 'ql-editor'
        fakeInput.focus()

        Quill.setModule(CommentMarking.moduleName, commentMarking)

        Quill.emit(QuillEvents.EDITOR_CHANGE, QuillEvents.TEXT_CHANGE)
        await setImmediatePromise()

        const dispatchCall = {
            type: 'CLEAR_SELECTION'
        }
        expect(selectionManager.unhighlightEmbeds).toHaveBeenCalled()
        expect(store.dispatch).toBeCalledWith(dispatchCall)
        expect(commentMarking.clear).not.toBeCalled()

        selectionManager.detach()
    })
    it('should handle selection and highlight embeds', async () => {
        const editorId = 'editor-id'
        const selectionManager = new SelectionManager(Quill, {
            enabled: true,
            editorId
        })

        const range = { index: 1, length: 10 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()
        await setImmediatePromise()

        const dispatchCall = {
            data: {
                editorId,
                activeEmbed: null,
                mainEditor: false,
                blotName: '',
                bottom: 0,
                height: 0,
                index: range.index,
                isFirstLine: false,
                left: 0,
                right: 0,
                selectionLength: range.length,
                selectionType: SelectionType.Text,
                text: 'abc',
                top: 0,
                width: 0
            },
            type: 'SELECTION_CHANGED'
        }

        expect(store.dispatch).toBeCalledWith(dispatchCall)
        expect(selectionManager.highlightedEmbeds).not.toBeNull()
        expect(selectionManager.highlightedEmbeds!).toHaveLength(2)

        Quill.emit(QuillEvents.EDITOR_CHANGE, QuillEvents.SELECTION_CHANGE, {
            index: 1,
            length: 0
        })
        await setImmediatePromise()

        expect(BlockEmbed.prototype.highlight).toHaveBeenCalledTimes(2)
        expect(BlockEmbed.prototype.unhighlight).toHaveBeenCalledTimes(2)

        selectionManager.detach()
    })

    it('should not highlight embeds when triple-clicking a text line above', async () => {
        const range = { index: 1, length: 10 }
        const cache = { length: 10 }
        Quill.getSelection = () => range
        Quill.getLine = (index = 0) => {
            const line = {
                index,
                cache,
                prev: {}
            }
            return [line, 0]
        }

        const selectionManager = new SelectionManager(Quill, options)
        const setSelection = jest.spyOn(Quill, 'setSelection')

        const tripleClickEvent = new CustomEvent('tripleclick')
        Quill.container.dispatchEvent(tripleClickEvent)

        await Promise.resolve()
        expect(setSelection).toHaveBeenCalledWith(range.index, cache.length - 1)

        selectionManager.detach()
    })

    it('should handle selection on editor text change event', async () => {
        const editorId = 'editor-id'
        const selectionManager = new SelectionManager(Quill, {
            enabled: true,
            mainEditor: true,
            editorId
        })

        const range = { index: 88, length: 0 }

        Quill.getSelection = () => {
            return range
        }

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            new Delta([{ retain: 1 }, { insert: 'a' }]),
            undefined,
            QuillSources.USER
        )

        const dispatchCall = {
            data: {
                editorId,
                activeEmbed: null,
                mainEditor: true,
                blotName: '',
                bottom: 0,
                height: 0,
                index: range.index,
                isFirstLine: false,
                left: 0,
                right: 0,
                selectionLength: range.length,
                selectionType: SelectionType.Text,
                text: 'abc',
                top: 0,
                width: 0
            },
            type: 'SELECTION_CHANGED'
        }

        await waitForExpect(() => {
            expect(store.dispatch).toBeCalledWith(dispatchCall)
        })

        selectionManager.detach()
    })

    it('should highlight embeds when user is dragging selection', async () => {
        jest.useFakeTimers()

        const selectionManager = new SelectionManager(Quill, options)

        const mouseDownEvent = document.createEvent('HTMLEvents')
        mouseDownEvent.initEvent('mousedown', false, true)
        document.body.dispatchEvent(mouseDownEvent)

        jest.runOnlyPendingTimers()

        expect(selectionManager.mouseDown).toBe(true)

        const dispatchSelectionChange = () => {
            const selectionChangeEvent = document.createEvent('HTMLEvents')
            selectionChangeEvent.initEvent('selectionchange', false, true)
            document.dispatchEvent(selectionChangeEvent)
        }

        dispatchSelectionChange()
        await setImmediatePromise()

        expect(BlockEmbed.prototype.highlight).toHaveBeenCalledTimes(2)

        dispatchSelectionChange()
        await setImmediatePromise()
        await setImmediatePromise()

        expect(BlockEmbed.prototype.unhighlight).toHaveBeenCalledTimes(2)
        expect(BlockEmbed.prototype.highlight).toHaveBeenCalledTimes(4)

        const mouseUpEvent = document.createEvent('HTMLEvents')
        mouseUpEvent.initEvent('mouseup', false, true)
        document.body.dispatchEvent(mouseUpEvent)

        expect(selectionManager.mouseDown).toBe(false)

        selectionManager.detach()
    })

    it('should not highlight embeds when native selection change without mouse events', () => {
        const selectionManager = new SelectionManager(Quill, options)

        const selectionChangeEvent = document.createEvent('HTMLEvents')
        selectionChangeEvent.initEvent('selectionchange', false, true)
        document.dispatchEvent(selectionChangeEvent)

        expect(selectionManager.mouseDown).toBe(false)
        expect(BlockEmbed.prototype.highlight).not.toBeCalled()

        selectionManager.detach()
    })

    it('should create a new line if cursor is at the end of document', async () => {
        const selectionManager = new SelectionManager(Quill, options)
        const insertEndingBlankLineMock = jest.spyOn(
            selectionManager,
            'insertEndingBlankLine'
        )
        Quill.getLine = () => {
            return [
                {
                    length: () => {
                        return 1
                    },
                    domNode: {
                        textContent: {
                            replace: () => {
                                return ''
                            }
                        }
                    }
                }
            ]
        }

        const range = { index: 299, length: 0 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()

        expect(insertEndingBlankLineMock).toBeCalled()
        expect(store.dispatch).toBeCalled()

        selectionManager.detach()
    })

    it('should transform embed position when there is text change from other client', async () => {
        const selectionManager = new SelectionManager(Quill, options)
        selectionManager.handleSelectionChange = jest.fn()

        jest.spyOn(store, 'getState').mockImplementationOnce(() => {
            return {
                selection: {
                    index: 2,
                    selectionType: SelectionType.Embed
                }
            }
        })

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            new Delta([{ retain: 1 }, { insert: 'a' }]),
            undefined,
            QuillSources.API
        )
        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({
            data: { index: 3 },
            type: 'SELECTION_INDEX_CHANGED'
        })
        expect(selectionManager.handleSelectionChange).not.toBeCalled()

        selectionManager.detach()
    })
})
