import Delta from 'quill-delta'
import theQuill from 'quill/core'
import {
    CommentMarking,
    Mark,
    GlobalCommentMarkingModule
} from '../../components/quill/modules/CommentMarking'
import QuillSources from '../../components/quill/modules/QuillSources'
import quillProvider from '../../components/quill/provider'
import {
    deselectCommentThread,
    highlightCommentThread,
    selectCommentThread,
    unhighlightCommentThread
} from '../../data/comments/actions'
import store from '../../data/store'
import { SelectionType } from '../../interfaces/selectionType'
import { COMMENT_STATUSES } from '../../constants/comments'
import { mockQuill } from '../mockData/mockQuill'
import { registerEditor } from '../../QuillRegistry'

const Block = theQuill.import('blots/block')
const Parchment = theQuill.import('parchment')

const Quill = mockQuill
quillProvider.setQuill(Quill)

jest.mock('cuid', () => {
    return () => {
        return '1'
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

jest.mock('../../components/quill/getEditorId', () => {
    return {
        getEditorId() {
            return 'editor-id'
        }
    }
})

beforeEach(() => {
    Quill.root = document.createElement('div')
    Quill.scrollingContainer = document.createElement('div')
    GlobalCommentMarkingModule.initialize(Quill.scrollingContainer)
    registerEditor('editor-id', Quill)
    const originalListener = Quill.root.addEventListener.bind(Quill.root)
    Quill.root.addEventListener = jest.fn((eventName, cb) => {
        originalListener(eventName, cb)
    })

    const modules = {}

    Quill.setModule = (name: string, module: any) => {
        modules[name] = module
    }

    Quill.getModule = (name: string) => {
        return modules[name]
    }

    store.dispatch = jest.fn()
})

function createMark(...ids: string[]) {
    const domNode = Mark.create(ids)
    const originalListener = domNode.addEventListener.bind(domNode)
    domNode.addEventListener = jest.fn((eventName, cb) => {
        originalListener(eventName, cb)
    })
    return new Mark(domNode)
}

function createText(text: string) {
    const textNode = document.createTextNode(text)
    return new Parchment.Text(textNode)
}

function createLineWithMarkAndText(mark: Mark, text: string) {
    const line = new Block(Block.create())

    const textBlot = createText(text)
    textBlot.parent = mark

    line.descendants = () => {
        return [textBlot]
    }

    Quill.getLines = () => {
        return [line]
    }

    return line
}

describe('CommentMarking', () => {
    it('should create instance of CommentMarking', () => {
        const commentMarking = new CommentMarking(Quill, true)
        expect(commentMarking).toBeInstanceOf(CommentMarking)
    })

    it('should create instance of Mark', () => {
        const id = '1'
        const mark = createMark(id)
        expect(mark).toBeInstanceOf(Mark)

        expect(mark.domNode.addEventListener).toHaveBeenCalledWith(
            'mouseenter',
            expect.any(Function)
        )
        expect(mark.domNode.addEventListener).toHaveBeenCalledWith(
            'mouseleave',
            expect.any(Function)
        )
        expect(mark.domNode.addEventListener).toHaveBeenCalledWith(
            'click',
            expect.any(Function)
        )
        expect(mark.domNode.className).toEqual(`mark mark-id-${id}`)
        expect(mark.domNode.getAttribute('data-mark-ids')).toEqual(id)
        expect(Mark.formats(mark.domNode)).toEqual([id])
    })

    it('should be marked on mouseenter and unmarked on mouseleave', () => {
        const id = '1'
        const mark = createMark(id)

        document.getElementsByClassName = jest.fn(() => {
            return [mark.domNode]
        })

        // mark
        const mouseEnterEvent = document.createEvent('HTMLEvents')
        mouseEnterEvent.initEvent('mouseenter', false, true)
        mark.domNode.dispatchEvent(mouseEnterEvent)

        expect(store.dispatch).toBeCalledWith(highlightCommentThread(id))
        expect(mark.selected).toBeTruthy()
        expect(mark.highlighted).toBeTruthy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id} selected`)

        // unmark
        const mouseLeaveEvent = document.createEvent('HTMLEvents')
        mouseLeaveEvent.initEvent('mouseleave', false, true)
        mark.domNode.dispatchEvent(mouseLeaveEvent)

        expect(store.dispatch).toBeCalledWith(unhighlightCommentThread())
        expect(mark.selected).toBeFalsy()
        expect(mark.highlighted).toBeFalsy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id}`)
    })

    it('should be selected on click and deselected on root click ', () => {
        const id = '1'
        const mark = createMark(id)
        document.getElementsByClassName = jest.fn(() => {
            return [mark.domNode]
        })

        const commentMarking = new CommentMarking(Quill, true)
        Quill.setModule(CommentMarking.moduleName, commentMarking)

        // select
        const clickEvent = document.createEvent('HTMLEvents')
        clickEvent.initEvent('click', false, true)
        mark.domNode.dispatchEvent(clickEvent)

        expect(store.dispatch).toBeCalledWith(selectCommentThread(id))
        expect(mark.selected).toBeTruthy()
        expect(mark.highlighted).toBeFalsy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id} selected`)
        expect(GlobalCommentMarkingModule.selectedId).toBe(id)

        // deselect
        Quill.selection = {
            getRange() {
                return [
                    {
                        index: 1
                    }
                ]
            }
        }
        Quill.getLeaf = () => {
            return
        }

        GlobalCommentMarkingModule.clear()

        expect(store.dispatch).toBeCalledWith(deselectCommentThread())
        expect(mark.selected).toBeFalsy()
        expect(mark.highlighted).toBeFalsy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id}`)
        expect(GlobalCommentMarkingModule.selectedId).toBeNull()
    })

    it('should select and deselect given id blots', () => {
        const id = '1'
        const mark = createMark(id)

        document.getElementsByClassName = jest.fn(() => {
            return [mark.domNode]
        })

        // select
        GlobalCommentMarkingModule.select(id)

        expect(store.dispatch).toBeCalledWith(selectCommentThread(id))
        expect(mark.selected).toBeTruthy()
        expect(mark.highlighted).toBeFalsy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id} selected`)
        expect(GlobalCommentMarkingModule.selectedId).toBe(id)

        // mouseenter
        const mouseEnterEvent = document.createEvent('HTMLEvents')
        mouseEnterEvent.initEvent('mouseenter', false, true)
        mark.domNode.dispatchEvent(mouseEnterEvent)

        expect(mark.highlighted).toBeFalsy()

        // mouseleave
        const mouseLeaveEvent = document.createEvent('HTMLEvents')
        mouseLeaveEvent.initEvent('mouseleave', false, true)
        mark.domNode.dispatchEvent(mouseLeaveEvent)

        expect(mark.selected).toBeTruthy()
        expect(mark.highlighted).toBeFalsy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id} selected`)

        // deselect
        GlobalCommentMarkingModule.deselect(id)

        expect(store.dispatch).toBeCalledWith(deselectCommentThread())
        expect(mark.selected).toBeFalsy()
        expect(mark.highlighted).toBeFalsy()
        expect(mark.domNode.className).toEqual(`mark mark-id-${id}`)
        expect(GlobalCommentMarkingModule.selectedId).toBeNull()
    })

    it('should select one blot and highlight another', () => {
        const id1 = '1'
        const mark1 = createMark(id1)

        document.getElementsByClassName = jest.fn(() => {
            return [mark1.domNode]
        })

        GlobalCommentMarkingModule.select(id1)

        // select one
        expect(store.dispatch).toBeCalledWith(selectCommentThread(id1))
        expect(mark1.selected).toBeTruthy()
        expect(mark1.highlighted).toBeFalsy()
        expect(mark1.domNode.className).toEqual(`mark mark-id-${id1} selected`)
        expect(GlobalCommentMarkingModule.selectedId).toBe(id1)

        // highlight another
        const id2 = '2'
        const mark2 = createMark(id2)

        document.getElementsByClassName = jest.fn(() => {
            return [mark2.domNode]
        })

        const mouseEnterEvent = document.createEvent('HTMLEvents')
        mouseEnterEvent.initEvent('mouseenter', false, true)
        mark2.domNode.dispatchEvent(mouseEnterEvent)

        expect(store.dispatch).toBeCalledWith(highlightCommentThread(id2))
        expect(mark2.selected).toBeTruthy()
        expect(mark2.highlighted).toBeTruthy()
        expect(mark2.domNode.className).toEqual(`mark mark-id-${id2} selected`)
    })

    it('should create mark', () => {
        const commentMarking = new CommentMarking(Quill, true)
        const id = '1'

        Quill.getSelection = () => {
            return {
                index: 1,
                length: 1
            }
        }

        const mark = createMark(id)
        createLineWithMarkAndText(mark, 'Test')

        Quill.formatText = jest.fn()

        commentMarking.create(1, 1, SelectionType.Text)

        expect(Quill.formatText).toBeCalledWith(
            1,
            1,
            'mark',
            [id],
            QuillSources.USER
        )
    })

    it('should create embed mark', () => {
        jest.useFakeTimers()

        const commentMarking = new CommentMarking(Quill, true)

        const leaf = {
            addMark: jest.fn()
        }

        Quill.getLeaf = () => {
            return [leaf]
        }

        commentMarking.create(1, 1, SelectionType.Embed)

        jest.runOnlyPendingTimers()

        expect(leaf.addMark).toBeCalledWith('1')
    })

    it('should create mark with multiple ids', () => {
        const commentMarking = new CommentMarking(Quill, true)
        const id1 = '2'
        const id2 = '1'

        Quill.getSelection = () => {
            return {
                index: 1,
                length: 1
            }
        }

        const mark = createMark(id1)
        createLineWithMarkAndText(mark, 'Test')

        Quill.formatText = jest.fn()

        commentMarking.create(1, 1, SelectionType.Text)

        expect(Quill.formatText).toBeCalledWith(
            1,
            1,
            'mark',
            [id2, id1],
            QuillSources.USER
        )
    })

    it('should remove id from formats when it is newCommentThreadId', () => {
        const id = '1'

        store.getState = jest.fn(() => {
            return {
                comments: {
                    threads: [
                        {
                            markId: id,
                            status: COMMENT_STATUSES.DRAFT
                        }
                    ]
                }
            }
        })

        const domNode = Mark.create(['2', id])

        expect(Mark.formats(domNode)).toEqual(['2'])
    })

    it('should remove mark', () => {
        const id = '1'

        const mark = createMark(id)

        jest.spyOn(document, 'getElementsByClassName').mockImplementationOnce(
            () => {
                return [mark.domNode]
            }
        )

        createLineWithMarkAndText(mark, 'Test')

        Quill.getFormat = () => {
            return {
                mark: [id]
            }
        }
        Quill.getIndex = () => 1
        Parchment.find = () => ({
            length: () => 1
        })
        Quill.updateContents = jest.fn()

        GlobalCommentMarkingModule.remove(id)

        expect(Quill.updateContents).toBeCalledWith(
            new Delta([
                { retain: 1 },
                { retain: 1, attributes: { mark: null } }
            ]),
            QuillSources.USER
        )
    })

    it('should remove id from mark with multiple ids ', () => {
        const id1 = '1'
        const id2 = '2'

        const mark = createMark(id1, id2)

        jest.spyOn(document, 'getElementsByClassName').mockImplementationOnce(
            () => {
                return [mark.domNode]
            }
        )

        createLineWithMarkAndText(mark, 'Test')

        Quill.formatText = jest.fn()
        Quill.getIndex = () => 1
        Parchment.find = () => ({
            length: () => 1
        })
        GlobalCommentMarkingModule.remove(id1)

        expect(Quill.formatText).toBeCalledWith(
            1,
            1,
            'mark',
            [id2],
            QuillSources.USER
        )
    })

    it('should ignore marks without id', () => {
        store.getState = jest.fn(() => {
            return {}
        })

        const domNode = Mark.create([])

        expect(Mark.formats(domNode)).toBeUndefined()
    })
})
