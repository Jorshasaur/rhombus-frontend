import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'
import { PaneEmbed } from '../../components/quill/blots/PaneEmbed'
import QuillSources from '../../components/quill/modules/QuillSources'
import quillProvider from '../../components/quill/provider'
import { PagesApiService } from '../../data/services/PagesApiService'
import store from '../../data/store'
import { BlotSize } from '../../interfaces/blotSize'
import { keycodes } from '../../interfaces/keycodes'
import { dispatchKeydownEvent } from '../utils'

const ReactDOM: any = jest.genMockFromModule('react-dom')
const Quill: any = jest.genMockFromModule('quill/core')

jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => {
            return '3a74dc93-8bc0-4358-91f3-c15f686d161f'
        })
    }
})

jest.mock('../../data/selection/selectors', () => {
    return {
        getSelectedIndex: jest.fn(() => {
            return 0
        })
    }
})

PagesApiService.prototype.duplicatePane = jest.fn(() => {
    return {
        id: 'new-clone-id'
    }
})

const blockEmbedValue = {
    version: 1,
    originalLink: 'https://link.com',
    service: 'pane' as const,
    type: 'test',
    uuid: '1',
    authorId: '1',
    embedData: {},
    createdAt: '2018-11-08T21:18:24.424Z',
    size: BlotSize.Small,
    unviewable: false
}

beforeEach(() => {
    ReactDOM.render = jest.fn()
    Quill.getIndex = jest.fn(() => {
        return 1
    })

    Quill.deleteText = jest.fn()
    Quill.setSelection = jest.fn()
    Quill.insertText = jest.fn()
    Quill.insertEmbed = jest.fn()
    Quill.on = jest.fn()

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

    quillProvider.setQuill(Quill)

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
        const createdBlock = PaneEmbed.create(blockEmbedValue)
        expect(createdBlock.className).toBe('paneEmbed embed-pane')
    })

    it('should get the value of the embed', () => {
        const createdBlock = PaneEmbed.create(blockEmbedValue)
        const blockValue = PaneEmbed.value(createdBlock)
        expect(blockValue).toEqual(blockEmbedValue)
    })

    it('should correctly clone dom node', () => {
        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.highlight()

        const clonedDOMNode = PaneEmbed.cloneDOMNode(embed.domNode)

        const domNodeProps = JSON.parse(domNode.getAttribute('data-props')!)
        const clonedDOMNodeProps = JSON.parse(
            clonedDOMNode.getAttribute('data-props')!
        )

        expect(clonedDOMNode.classList.contains('selected')).toBe(false)
        expect(clonedDOMNodeProps).toEqual({
            authorId: '1',
            embedData: {},
            originalLink: 'https://link.com',
            service: 'pane',
            type: 'test',
            uuid: '3a74dc93-8bc0-4358-91f3-c15f686d161f',
            createdAt: '2018-11-08T21:18:24.424Z',
            version: 1,
            size: BlotSize.Small,
            unviewable: false
        })
        expect(domNodeProps.uuid).not.toBe(clonedDOMNodeProps.uuid)
    })

    it('should set size', () => {
        const trackSpy = jest
            .spyOn(AnalyticsBuilder.prototype, 'track')
            .mockImplementation(jest.fn())
        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.setSize(BlotSize.Small)

        expect(domNode.getAttribute('data-props')).toEqual(
            '{"version":1,"originalLink":"https://link.com","service":"pane","type":"test","uuid":"1","authorId":"1","embedData":{},"createdAt":"2018-11-08T21:18:24.424Z","size":"small","unviewable":false}'
        )
        expect(domNode.getAttribute('data-size')).toEqual(BlotSize.Small)
        // @todo check size state
        expect(trackSpy).toHaveBeenCalled()
    })

    it('should set size on creation', () => {
        const domNode = PaneEmbed.create(
            Object.assign({}, blockEmbedValue, { size: 'small' })
        )
        new PaneEmbed(domNode)

        expect(domNode.getAttribute('data-props')).toEqual(
            '{"version":1,"originalLink":"https://link.com","service":"pane","type":"test","uuid":"1","authorId":"1","embedData":{},"createdAt":"2018-11-08T21:18:24.424Z","size":"small","unviewable":false}'
        )
        expect(domNode.getAttribute('data-size')).toEqual('small')
    })

    it('should call resetEmbedData when adding a new mark', () => {
        const domNode = PaneEmbed.create(
            Object.assign({}, blockEmbedValue, { size: 'small' })
        )
        const blockEmbed = new PaneEmbed(domNode)
        PaneEmbed.prototype.resetEmbedData = jest.fn()
        blockEmbed.addMark('12345')
        expect(PaneEmbed.prototype.resetEmbedData).toHaveBeenCalledWith({
            threadIds: ['12345']
        })
    })

    it('should call resetEmbedData when removing a new mark', () => {
        const threads = ['5566', '11223344']
        const embedValues = Object.assign({}, blockEmbedValue, {
            embedData: { threadIds: threads }
        })
        const domNode = PaneEmbed.create(embedValues)
        const blockEmbed = new PaneEmbed(domNode)
        PaneEmbed.prototype.resetEmbedData = jest.fn()
        blockEmbed.removeMark('5566')
        expect(PaneEmbed.prototype.resetEmbedData).toHaveBeenCalledWith({
            threadIds: ['11223344']
        })
    })

    it('should clone the pane correctly', async () => {
        store.getState = jest.fn(() => {
            return {
                currentDocument: {
                    id: '123456'
                }
            }
        })
        const paneNode = Object.assign({}, blockEmbedValue, {
            embedData: {
                pane: 'aabbcc'
            }
        })
        await PaneEmbed.clonePane(paneNode)
        expect(store.getState).toHaveBeenCalled()
        expect(PagesApiService.prototype.duplicatePane).toHaveBeenCalled()
        expect(paneNode.embedData.pane).toEqual('new-clone-id')
        expect(Quill.insertEmbed).toHaveBeenCalledWith(
            0,
            'pane-embed',
            paneNode,
            QuillSources.USER
        )
    })

    it('should deselect on blur', () => {
        quillProvider.setQuill(Quill)

        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.isSelected = true
        embed.highlight()

        const evt = document.createEvent('HTMLEvents')
        evt.initEvent('blur', false, true)
        domNode.dispatchEvent(evt)

        expect(domNode.classList.contains('selected')).toBe(false)
        expect(embed.isSelected).toBe(false)
    })

    it('should handle enter', () => {
        quillProvider.setQuill(Quill)

        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.select(1)

        dispatchKeydownEvent(domNode, keycodes.Enter)

        expect(Quill.insertText).toBeCalledWith(
            1,
            '\n',
            { id: expect.any(String) },
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(1, 0, QuillSources.USER)
    })

    it('should handle key up', () => {
        quillProvider.setQuill(Quill)

        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.select(1)

        const nextEmbed = new PaneEmbed(PaneEmbed.create(blockEmbedValue))
        let newIndex = -1
        Quill.getLeaf = jest.fn((index: number) => {
            newIndex = index
            return [nextEmbed]
        })

        dispatchKeydownEvent(domNode, keycodes.Up)

        expect(nextEmbed.isSelected).toBe(true)
        expect(nextEmbed.domNode).toBe(document.activeElement)
        expect(newIndex).toBe(-1)
    })

    it('should handle key left', () => {
        quillProvider.setQuill(Quill)

        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
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
        expect(Quill.setSelection).toBeCalledWith(-1, 0, QuillSources.USER)
    })

    it('should handle key down', () => {
        quillProvider.setQuill(Quill)

        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.select(1)

        const nextEmbed = new PaneEmbed(PaneEmbed.create(blockEmbedValue))
        let newIndex = -1
        Quill.getLeaf = jest.fn((index: number) => {
            newIndex = index
            return [nextEmbed]
        })

        dispatchKeydownEvent(domNode, keycodes.Down)

        expect(nextEmbed.isSelected).toBe(true)
        expect(nextEmbed.domNode).toBe(document.activeElement)
        expect(newIndex).toBe(1)
    })

    it('should handle key right', () => {
        quillProvider.setQuill(Quill)

        const domNode = PaneEmbed.create(blockEmbedValue)
        const embed = new PaneEmbed(domNode)
        embed.select(1)

        Quill.getLeaf = jest.fn((index: number) => {
            return ['']
        })

        dispatchKeydownEvent(domNode, keycodes.Right)

        expect(Quill.setSelection).toBeCalledWith(1, 0, QuillSources.USER)
    })
})
