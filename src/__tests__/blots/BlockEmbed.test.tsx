import * as sinon from 'sinon'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import QuillSources from '../../components/quill/modules/QuillSources'
import quillProvider from '../../components/quill/provider'
import store from '../../data/store'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { BlotSize } from '../../interfaces/blotSize'
import { keycodes } from '../../interfaces/keycodes'
import { SelectionType } from '../../interfaces/selectionType'
import { mockQuill } from '../mockData/mockQuill'
import { assertFirstCallArgs, dispatchKeydownEvent } from '../utils'

const ReactDOM: any = jest.genMockFromModule('react-dom')
const Quill: any = mockQuill

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

jest.mock('../../QuillRegistry', () => {
    return {
        getEditor: () => {
            return Quill
        }
    }
})

jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => {
            return '3a74dc93-8bc0-4358-91f3-c15f686d161f'
        })
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
    createdAt: '2018-11-08T21:18:24.424Z',
    size: BlotSize.Small,
    unviewable: false
}

const sandbox = sinon.createSandbox()

beforeEach(() => {
    ReactDOM.render = jest.fn()
    Quill.getIndex = jest.fn(() => {
        return 1
    })

    Quill.deleteText = jest.fn()
    Quill.setSelection = jest.fn()
    Quill.insertText = jest.fn()

    Quill.container = document.createElement('div')

    Quill.selection = {
        rangeToNative() {
            return [
                document.createElement('p'),
                0,
                document.createElement('p'),
                0
            ]
        }
    }

    const doc = document as any
    doc.getSelection = jest.fn(() => {
        return {
            removeAllRanges: jest.fn(),
            addRange: jest.fn()
        }
    })
    doc.createRange = jest.fn(() => {
        return {
            setStart: jest.fn(),
            setEnd: jest.fn()
        }
    })
})

describe('Block embed blot', () => {
    it('should create the blot', () => {
        const createdBlock = BlockEmbed.create(blockEmbedValue)
        expect(createdBlock.className).toBe('blockEmbed embed-prototype')
    })

    it('should get the value of the embed', () => {
        const createdBlock = BlockEmbed.create(blockEmbedValue)
        const blockValue = BlockEmbed.value(createdBlock)
        expect(blockValue).toEqual(blockEmbedValue)
    })

    it('should handle click', () => {
        const storeDispatchCall = sandbox.spy(store, 'dispatch')

        const domNode = BlockEmbed.create(blockEmbedValue)
        new BlockEmbed(domNode)

        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('click', false, true)
        domNode.dispatchEvent(evt)
        expect(domNode.classList.contains('selected')).toBe(true)
        expect(document.activeElement).toBe(domNode)

        expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)

        const action = {
            data: {
                activeEmbed: null,
                editorId: null,
                mainEditor: false,
                blotName: 'prototype',
                bottom: 0,
                height: 0,
                index: 1,
                isFirstLine: false,
                left: 0,
                right: 0,
                selectionLength: 0,
                selectionType: SelectionType.Embed,
                text: null,
                top: 0,
                width: 0
            },
            type: 'SELECTION_CHANGED'
        }
        assertFirstCallArgs(storeDispatchCall, action)
    })

    it('should handle shift click', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        new BlockEmbed(domNode)

        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('click', false, true)
        domNode.dispatchEvent(evt)

        expect(domNode.classList.contains('selected')).toBe(true)
        expect(document.activeElement).toBe(domNode)

        expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)

        const secondDomNode = BlockEmbed.create(blockEmbedValue)
        new BlockEmbed(secondDomNode)

        Quill.getIndex = jest.fn(() => {
            return 10
        })

        const secondEvt = document.createEvent('HTMLEvents')
        secondEvt.initEvent('click', false, true)
        Object.defineProperty(secondEvt, 'shiftKey', {
            writable: true,
            configurable: true,
            value: true
        })
        secondDomNode.dispatchEvent(secondEvt)

        expect(Quill.setSelection).toBeCalledWith(1, 10, QuillSources.USER)
    })

    it('should deselect on blur', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.isSelected = true
        embed.highlight()

        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('blur', false, true)
        domNode.dispatchEvent(evt)

        expect(domNode.classList.contains('selected')).toBe(false)
        expect(embed.isSelected).toBe(false)
    })

    it('should handle backspace and select previous embed', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        const nextEmbed = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
        let prevIndex = -1

        Quill.getLeaf = jest.fn((index: number) => {
            prevIndex = index
            return [nextEmbed]
        })

        dispatchKeydownEvent(domNode, keycodes.Backspace)

        expect(Quill.deleteText).toBeCalledWith(1, 1, QuillSources.USER)
        expect(nextEmbed.domNode.classList.contains('selected')).toBe(true)
        expect(nextEmbed.isSelected).toBe(true)
        expect(prevIndex).toBe(0)
    })

    it('should handle delete and select previous text', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        let prevIndex = -1

        Quill.getLeaf = jest.fn((index: number) => {
            prevIndex = index
            return ['']
        })

        dispatchKeydownEvent(domNode, keycodes.Delete)

        expect(Quill.deleteText).toBeCalledWith(1, 1, QuillSources.USER)
        expect(prevIndex).toBe(0)
        expect(Quill.setSelection).toBeCalledWith(0, 0, QuillSources.USER)
    })

    it('should handle enter', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        dispatchKeydownEvent(domNode, keycodes.Enter)

        expect(Quill.insertText).toBeCalledWith(
            2,
            '\n',
            { id: expect.any(String) },
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(2, 0, QuillSources.USER)
    })

    it('should handle key up', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        const nextEmbed = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
        let newIndex = -1
        Quill.getLeaf = jest.fn((index: number) => {
            newIndex = index
            return [nextEmbed]
        })

        dispatchKeydownEvent(domNode, keycodes.Up)

        expect(nextEmbed.domNode.classList.contains('selected')).toBe(true)
        expect(nextEmbed.isSelected).toBe(true)
        expect(nextEmbed.domNode).toBe(document.activeElement)
        expect(newIndex).toBe(0)
    })

    it('should handle key left', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        Quill.getLeaf = jest.fn((index: number) => {
            return ['']
        })

        const rangeNode = document.createElement('p')
        Quill.selection = {
            rangeToNative() {
                return [rangeNode, 0, rangeNode, 0]
            }
        }

        const selection = {
            removeAllRanges: jest.fn(),
            addRange: jest.fn()
        }

        const range = {
            setStart: jest.fn(),
            setEnd: jest.fn()
        }

        const doc = document as any
        doc.getSelection = jest.fn(() => {
            return selection
        })
        doc.createRange = jest.fn(() => {
            return range
        })

        dispatchKeydownEvent(domNode, keycodes.Left)

        expect(document.getSelection).toBeCalled()
        expect(document.createRange).toBeCalled()
        expect(range.setStart).toBeCalledWith(rangeNode, 0)
        expect(range.setEnd).toBeCalledWith(rangeNode, 0)
        expect(selection.removeAllRanges).toBeCalled()
        expect(selection.addRange).toBeCalledWith(range)
        expect(Quill.setSelection).toBeCalledWith(0, 0, QuillSources.USER)
    })

    it('should handle key down', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        const nextEmbed = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
        let newIndex = -1
        Quill.getLeaf = jest.fn((index: number) => {
            newIndex = index
            return [nextEmbed]
        })

        dispatchKeydownEvent(domNode, keycodes.Down)

        expect(nextEmbed.domNode.classList.contains('selected')).toBe(true)
        expect(nextEmbed.isSelected).toBe(true)
        expect(nextEmbed.domNode).toBe(document.activeElement)
        expect(newIndex).toBe(2)
    })

    it('should handle key right', () => {
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        Quill.getLeaf = jest.fn((index: number) => {
            return ['']
        })

        dispatchKeydownEvent(domNode, keycodes.Right)

        expect(Quill.setSelection).toBeCalledWith(2, 0, QuillSources.USER)
    })

    it('should correctly clone dom node', () => {
        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.highlight()

        const clonedDOMNode = BlockEmbed.cloneDOMNode(embed.domNode)

        const domNodeProps = JSON.parse(domNode.getAttribute('data-props')!)
        const clonedDOMNodeProps = JSON.parse(
            clonedDOMNode.getAttribute('data-props')!
        )

        expect(clonedDOMNode.classList.contains('selected')).toBe(false)
        expect(clonedDOMNodeProps).toEqual({
            authorId: '1',
            embedData: {},
            originalLink: 'https://link.com',
            service: 'prototype',
            type: 'test',
            uuid: '3a74dc93-8bc0-4358-91f3-c15f686d161f',
            createdAt: '2018-11-08T21:18:24.424Z',
            version: 1,
            size: BlotSize.Small,
            unviewable: false
        })
        expect(domNodeProps.uuid).not.toBe(clonedDOMNodeProps.uuid)
    })
    it('should handle undo', () => {
        const historyModule = {
            redo: jest.fn(),
            undo: jest.fn()
        }
        Quill.getModule = jest.fn(() => historyModule)
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        dispatchKeydownEvent(domNode, keycodes.Z, true)

        expect(historyModule.undo).toHaveBeenCalledWith()
    })
    it('should handle redo', () => {
        const historyModule = {
            redo: jest.fn(),
            undo: jest.fn()
        }
        Quill.getModule = jest.fn(() => historyModule)
        quillProvider.setQuill(Quill)

        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.select(1)

        dispatchKeydownEvent(domNode, keycodes.Y, true)

        expect(historyModule.redo).toHaveBeenCalledWith()
    })

    it('should set size', () => {
        const trackSpy = jest
            .spyOn(AnalyticsBuilder.prototype, 'track')
            .mockImplementation(jest.fn())
        const domNode = BlockEmbed.create(blockEmbedValue)
        const embed = new BlockEmbed(domNode)
        embed.provider = {
            setState: jest.fn(),
            state: {
                unviewable: false
            }
        } as any
        embed.setSize(BlotSize.Small)

        expect(domNode.getAttribute('data-props')).toEqual(
            '{"version":1,"originalLink":"https://link.com","service":"prototype","type":"test","uuid":"1","authorId":"1","embedData":{},"createdAt":"2018-11-08T21:18:24.424Z","size":"small","unviewable":false}'
        )
        expect(domNode.getAttribute('data-size')).toEqual(BlotSize.Small)
        expect(embed.provider!.setState).toHaveBeenCalledWith({
            size: BlotSize.Small
        })
        expect(trackSpy).toHaveBeenCalled()
    })

    it('should set size on creation', () => {
        const domNode = BlockEmbed.create(
            Object.assign({}, blockEmbedValue, { size: 'small' })
        )
        new BlockEmbed(domNode)

        expect(domNode.getAttribute('data-props')).toEqual(
            '{"version":1,"originalLink":"https://link.com","service":"prototype","type":"test","uuid":"1","authorId":"1","embedData":{},"createdAt":"2018-11-08T21:18:24.424Z","size":"small","unviewable":false}'
        )
        expect(domNode.getAttribute('data-size')).toEqual('small')
    })

    it('should call resetEmbedData when adding a new mark', () => {
        const domNode = BlockEmbed.create(
            Object.assign({}, blockEmbedValue, { size: 'small' })
        )
        const blockEmbed = new BlockEmbed(domNode)
        BlockEmbed.prototype.resetEmbedData = jest.fn()
        blockEmbed.addMark('12345')
        expect(BlockEmbed.prototype.resetEmbedData).toHaveBeenCalledWith({
            threadIds: ['12345']
        })
    })

    it('should call resetEmbedData when removing a new mark', () => {
        const threads = ['5566', '11223344']
        const embedValues = Object.assign({}, blockEmbedValue, {
            embedData: { threadIds: threads }
        })
        const domNode = BlockEmbed.create(embedValues)
        const blockEmbed = new BlockEmbed(domNode)
        BlockEmbed.prototype.resetEmbedData = jest.fn()
        blockEmbed.removeMark('5566')
        expect(BlockEmbed.prototype.resetEmbedData).toHaveBeenCalledWith({
            threadIds: ['11223344']
        })
    })
})
