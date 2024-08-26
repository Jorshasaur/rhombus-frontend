import cuid from 'cuid'
import { Blot } from 'parchment/dist/src/blot/abstract/blot'
import PubSub from 'pubsub-js'
import {
    BlockEmbed as BlockEmbedType,
    Inline as InlineType,
    RangeStatic
} from 'quill'
import Delta from 'quill-delta'
import Quill from 'quill/core'
import { Unsubscribe } from 'redux'
import { COMMENT_STATUSES } from '../../../../constants/comments'
import { COMMENT_MARKING_MODULE_NAME } from '../../../../constants/quill-modules'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../constants/topics'
import {
    createNewCommentThread,
    deselectCommentThread,
    highlightCommentThread,
    selectCommentThread,
    unhighlightCommentThread
} from '../../../../data/comments/actions'
import store from '../../../../data/store'
import { Embed } from '../../../../interfaces/Embed'
import { SelectionType } from '../../../../interfaces/selectionType'
import { getEditor } from '../../../../QuillRegistry'
import { getEditorId } from '../../getEditorId'
import { getBlotOffset } from '../../utils'
import QuillSources from '../QuillSources'
import { getCommentMarkClassName as getClassName } from './getClassName'
import styles from './Mark.module.css'

const Inline: typeof InlineType = Quill.import('blots/inline')
const Block: typeof BlockEmbedType = Quill.import('blots/block')
const Parchment = Quill.import('parchment')

const SCROLL_TOP_OFFSET_COEFFICIENT = 0.31

export function getMarkType(id: string): string {
    const node = document.querySelector(`.${getClassName(id)}`)
    if (node) {
        const blot = Parchment.find(node)
        if (blot) {
            return blot.getMarkType()
        }
    }
    return 'unknown'
}

export class Mark extends Inline {
    public static blotName = 'mark'
    public static tagName = 'span'
    public static className = styles.mark

    domNode: HTMLSpanElement
    selected: boolean = false
    highlighted: boolean = false
    unsubscribe: Unsubscribe

    public static formats(domNode: HTMLSpanElement): string[] | void {
        const state = store.getState()
        const ids = Mark.getIds(domNode)
        if (ids.length < 1) {
            return
        }
        const { threads } = state.comments
        if (threads && threads.length) {
            threads.forEach((thread) => {
                if (
                    thread.status === COMMENT_STATUSES.DRAFT ||
                    thread.resolved ||
                    thread.status === COMMENT_STATUSES.POSTING
                ) {
                    const index = ids.indexOf(thread.markId)
                    if (index > -1) {
                        ids.splice(index, 1)
                    }
                }
            })
        }
        return ids
    }

    public static getIds(domNode: HTMLSpanElement): string[] {
        const value = domNode.getAttribute('data-mark-ids') as string
        if (value === '') {
            return []
        }
        return value.split(',')
    }

    public static create(ids: string[]) {
        const node = super.create(ids) as HTMLSpanElement
        node.setAttribute('data-mark-ids', ids.join(','))
        ids.forEach((id) => {
            node.classList.add(getClassName(id))
        })
        return node
    }

    constructor(domNode: HTMLSpanElement) {
        super(domNode)
        domNode.addEventListener('mouseenter', this.handleMouseEnter)
        domNode.addEventListener('mouseleave', this.handleMouseLeave)
        domNode.addEventListener('click', this.handleClick)

        this.unsubscribe = store.subscribe(this.toggleVisibility)
    }

    toggleVisibility = () => {
        const commentThreads = store.getState().comments.threads
        if (commentThreads.find(({ markId }) => markId === this.getId())) {
            this.domNode.classList.remove(styles.hidden)
            this.unsubscribe()
        } else {
            this.domNode.classList.add(styles.hidden)
        }
    }

    detach() {
        this.domNode.removeEventListener('mouseenter', this.handleMouseEnter)
        this.domNode.removeEventListener('mouseleave', this.handleMouseLeave)
        this.domNode.removeEventListener('click', this.handleClick)
        super.detach()
    }

    public select() {
        this.domNode.classList.add(styles.selected)
        this.selected = true
        this.highlighted = false
    }

    public deselect() {
        this.domNode.classList.remove(styles.selected)
        this.selected = false
    }

    public highlight() {
        if (!this.selected) {
            this.select()
            this.highlighted = true
        }
    }

    public unhighlight() {
        if (this.highlighted) {
            this.deselect()
            this.highlighted = false
        }
    }

    public getMarkType() {
        return 'text'
    }

    handleClick = () => {
        const id = this.getId()
        GlobalCommentMarkingModule.select(id, this.domNode)
    }

    handleMouseEnter = () => {
        if (!this.selected) {
            const id = this.getId()
            forEachMarkBlotFromId(id, highlightBlot)
            store.dispatch(highlightCommentThread(id))
        }
    }

    handleMouseLeave = () => {
        if (this.highlighted) {
            const id = this.getId()
            forEachMarkBlotFromId(id, unhighlightBlot)
            store.dispatch(unhighlightCommentThread())
        }
    }

    getId() {
        const ids = Mark.getIds(this.domNode)
        return ids[0]
    }
}

interface MarkRange {
    index: number
    length: number
    ids: string[]
}

function getEditorFromMark(mark: Blot) {
    const editorId = getEditorId(mark)
    if (!editorId) {
        return
    }

    return getEditor(editorId)
}

export class GlobalCommentMarking {
    selectedId: string | null
    scrollingContainer: HTMLDivElement

    public initialize(scrollingContainer: HTMLDivElement) {
        this.scrollingContainer = scrollingContainer
    }

    public select(id: string, scrollDomNode?: HTMLSpanElement) {
        if (id === this.selectedId) {
            return
        }

        this.clear()
        this.selectedId = id
        forEachMarkBlotFromId(id, selectBlot)

        if (!scrollDomNode) {
            scrollDomNode = document.querySelector(
                `.${getClassName(id)}`
            ) as HTMLSpanElement
        }
        this.scrollToMark(scrollDomNode)

        store.dispatch(selectCommentThread(id))
    }

    private scrollToMark(scrollDomNode: HTMLSpanElement) {
        if (scrollDomNode != null) {
            const { top } = scrollDomNode.getBoundingClientRect()
            this.scrollingContainer.scrollTop +=
                top - window.innerHeight * SCROLL_TOP_OFFSET_COEFFICIENT
        }
    }

    public deselect(id: string) {
        this.selectedId = null
        forEachMarkBlotFromId(id, deselectBlot)
        store.dispatch(deselectCommentThread())
    }

    public clear() {
        if (this.selectedId != null) {
            this.deselect(this.selectedId)
        }
    }

    public highlight(id: string) {
        forEachMarkBlotFromId(id, selectBlot)
    }

    public unhighlight(id: string) {
        if (id === this.selectedId) {
            return
        }
        forEachMarkBlotFromId(id, deselectBlot)
    }

    public remove(id: string) {
        this.selectedId = null
        const marks = document.getElementsByClassName(getClassName(id))
        Array.from(marks).forEach((element: HTMLSpanElement) => {
            const blot = Parchment.find(element) as Embed | Blot
            const blotEmbed = blot as Embed

            if (blotEmbed.isEmbed) {
                blotEmbed.removeMark(id)
            } else {
                const markBlot = blot as Blot
                const quill = getEditorFromMark(markBlot)
                if (!quill) {
                    return
                }
                const index = quill.getIndex(markBlot)
                const length = markBlot.length()
                const markRanges = getMarkRanges(quill, { index, length })
                markRanges.forEach((markRange: MarkRange) => {
                    const { ids } = markRange

                    const idIndex = ids.indexOf(id)
                    if (idIndex > -1) {
                        ids.splice(idIndex, 1)
                    }

                    if (ids.length > 0) {
                        quill.formatText(
                            markRange.index,
                            markRange.length,
                            'mark',
                            ids,
                            QuillSources.USER
                        )
                    } else {
                        quill.updateContents(
                            new Delta()
                                .retain(markRange.index)
                                .retain(markRange.length, { mark: null }),
                            QuillSources.USER
                        )
                    }
                })
            }
        })

        PubSub.publish(DOCUMENT_CHANGE_REPOSITION, null)
    }
}

export const GlobalCommentMarkingModule = new GlobalCommentMarking()

export class CommentMarking {
    static moduleName = COMMENT_MARKING_MODULE_NAME

    constructor(private quill: Quill, enabled: boolean) {}

    private createTextMark(id: string, index: number, length: number) {
        const markRanges = getMarkRanges(this.quill, { index, length })

        markRanges.forEach((markRange: MarkRange) => {
            const { ids } = markRange

            if (ids.indexOf(id) === -1) {
                ids.unshift(id)
            }

            this.quill.formatText(
                markRange.index,
                markRange.length,
                'mark',
                ids,
                QuillSources.USER
            )
        })

        return id
    }

    public create(index: number, length: number, selectionType: SelectionType) {
        const id = cuid()

        if (selectionType === SelectionType.Embed) {
            const [blot] = this.quill.getLeaf(index) as [Embed]
            blot.addMark(id)
        } else {
            this.createTextMark(id, index, length)
        }

        store.dispatch(createNewCommentThread(id, index, length))

        return id
    }

    public createFromEmbed(embed: Embed) {
        const id = cuid()
        embed.addMark(id)
        const index = this.quill.getIndex(embed)
        store.dispatch(createNewCommentThread(id, index, 1))
        return id
    }
}

function getMarkRanges(editor: Quill, range: RangeStatic): MarkRange[] {
    if (!range) {
        return []
    }
    const lines = editor.getLines(range)
    const marks: MarkRange[] = []
    const firstLineParentOffset = getBlotOffset(editor, lines[0])

    let firstLineOffset = range.index - firstLineParentOffset
    let currentIndex = firstLineParentOffset
    let length = 0

    lines.forEach((line: any, lineIndex: number) => {
        let childIndex = 0
        if (line.isEmbed) {
            length += 1
            currentIndex += 1
            return
        }

        line.descendants(Parchment.Leaf).every((child: any): boolean => {
            let currentLength = child.length()

            if (currentIndex + currentLength > range.index) {
                if (lineIndex === 0 && childIndex === 0) {
                    const lineOffset = firstLineOffset
                    currentLength -= lineOffset
                    currentIndex += lineOffset
                }

                length += currentLength

                if (length > range.length) {
                    currentLength = currentLength - (length - range.length)
                }

                if (currentLength === 0) {
                    return false
                }

                let leaf = child
                while (!(leaf instanceof Block)) {
                    leaf = leaf.parent
                    if (leaf instanceof Mark) {
                        break
                    }
                }

                const mark: MarkRange = {
                    index: currentIndex,
                    length: currentLength,
                    ids: []
                }

                if (leaf instanceof Mark) {
                    mark.ids = Mark.getIds(leaf.domNode)
                }

                marks.push(mark)

                childIndex += 1
            }

            firstLineOffset -= currentLength
            currentIndex += currentLength

            return length <= range.length
        })

        length += 1
        currentIndex += 1
    })

    return marks
}

function forEachMarkBlotFromId(id: string, func: (blot: Mark) => void) {
    const elements = document.getElementsByClassName(getClassName(id))
    return Array.from(elements).forEach((element: HTMLSpanElement) => {
        func(Parchment.find(element))
    })
}

function selectBlot(blot: Mark | Embed) {
    if ((blot as Embed).isEmbed) {
        blot.highlight()
    } else {
        ;(blot as Mark).select()
    }
}

function deselectBlot(blot: Mark | Embed) {
    if ((blot as Embed).isEmbed) {
        blot.unhighlight()
    } else {
        ;(blot as Mark).deselect()
    }
}

function highlightBlot(blot: Mark) {
    blot.highlight()
}

function unhighlightBlot(blot: Mark) {
    blot.unhighlight()
}
