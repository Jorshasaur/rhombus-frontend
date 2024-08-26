import cuid from 'cuid'
import { BlockEmbed as BlockEmbedType, QuillSelection, Sources } from 'quill'
import Quill from 'quill/core'
import React from 'react'
import ReactDOM from 'react-dom'
import { v4 as uuid } from 'uuid'
import { default as EmbedAnalytics } from '../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import {
    PANE_EMBED_BLOT_NAME,
    PANE_SERVICE_NAME
} from '../../../constants/embeds'
import { SHORTKEY } from '../../../constants/general'
import { selectionChanged } from '../../../data/actions'
import { getAuthor } from '../../../data/authors/selectors'
import { getSelectedIndex } from '../../../data/selection/selectors'
import { PagesApiService } from '../../../data/services/PagesApiService'
import store from '../../../data/store'
import { BlotSize } from '../../../interfaces/blotSize'
import { Embed } from '../../../interfaces/Embed'
import { keycodes } from '../../../interfaces/keycodes'
import { SelectionType } from '../../../interfaces/selectionType'
import embedInstanceService from '../../../services/EmbedInstanceService'
import styles from '../../pages/Editor/Blots/Blots.module.css'
import { PaneEmbedProvider } from '../../pages/Editor/Blots/PaneEmbed/PaneEmbedProvider'
import { getEditorId } from '../getEditorId'
import { getCommentMarkClassName } from '../modules/CommentMarking/getClassName'
import QuillSources from '../modules/QuillSources'
import quillProvider from '../provider'
import { getBounds } from '../utils'
import { ErrorBoundary } from '../../../bugsnag'

interface PaneEmbedValue {
    authorId: string
    createdAt: string
    dataUrl?: string
    embed?: any
    embedData: any
    originalLink?: string
    service: typeof PANE_SERVICE_NAME
    size?: BlotSize
    unviewable?: boolean
    uuid: string
    version: number
}

const Block: typeof BlockEmbedType = Quill.import('blots/block/embed')

export class PaneEmbed extends Block implements Embed {
    public static blotName = PANE_EMBED_BLOT_NAME
    public static className = styles.paneEmbed
    public static tagName = 'DIV'
    static service = PANE_SERVICE_NAME

    domNode: HTMLElement
    isSelected: boolean = false
    isEmbed = true
    editorId: string | null = null

    constructor(domNode: HTMLElement) {
        super(domNode)
        domNode.addEventListener('blur', this.handleBlur)
        domNode.addEventListener('keydown', this.handleKeyDown)
    }

    attach() {
        super.attach()
        this.editorId = getEditorId(this as any) || null
    }

    static addInstance(id: string, instance: PaneEmbedProvider) {
        embedInstanceService.addInstance(id, instance)
    }

    static create(value: PaneEmbedValue) {
        const node: HTMLElement = super.create(value) as HTMLElement

        node.setAttribute('data-props', JSON.stringify(value))
        node.setAttribute('contenteditable', 'false')
        node.setAttribute('tabindex', '0')
        node.setAttribute('spellcheck', 'false')
        node.setAttribute('id', value.uuid)
        node.setAttribute('data-service', value.service)
        node.setAttribute('data-version', `${value.version}`)
        node.setAttribute('data-uuid', value.uuid)
        node.setAttribute('data-embed', JSON.stringify(value.embedData))
        node.setAttribute('data-authorId', value.authorId)
        node.setAttribute('data-originalLink', value.originalLink!)
        node.setAttribute('data-createdAt', value.createdAt)
        node.setAttribute('data-rhombus', 'true')
        node.setAttribute('data-testid', `blot__embed-${value.service!}`)

        if (value.unviewable != null) {
            node.setAttribute('data-unviewable', `${value.unviewable}`)
        }

        if (value.size != null) {
            node.setAttribute('data-size', value.size)
        }

        const className = styles[`embed-${value.service!}`]
        if (className != null) {
            node.classList.add(className)
        }

        const { threadIds } = value.embedData
        if (threadIds) {
            threadIds.forEach((threadId: string) => {
                node.classList.add(getCommentMarkClassName(threadId))
            })
        }

        ReactDOM.render(
            <ErrorBoundary>
                <PaneEmbedProvider
                    ref={(instance) => {
                        if (instance) {
                            this.addInstance(value.uuid, instance)
                        }
                    }}
                    authorId={value.authorId}
                    authorName={getAuthor(store.getState(), value.authorId)}
                    embedData={value.embedData}
                    key={value.uuid}
                    uuid={value.uuid}
                    version={value.version}
                    createdAt={value.createdAt}
                    quillBlotElement={node}
                />
            </ErrorBoundary>,
            node
        )
        const span = document.createElement('div')
        node.appendChild(span)
        return node
    }

    static value = (domNode: HTMLElement): PaneEmbedValue => {
        return JSON.parse(domNode.getAttribute('data-props')!)
    }

    static setValue(domNode: HTMLElement, value: any) {
        domNode.setAttribute('data-props', JSON.stringify(value))
    }

    public static cloneDOMNode(domNode: HTMLElement): HTMLElement {
        const clonedDomNode = domNode.cloneNode() as HTMLElement

        const dataProps = PaneEmbed.value(clonedDomNode)
        dataProps.uuid = uuid()
        PaneEmbed.setValue(clonedDomNode, dataProps)

        clonedDomNode.classList.remove('selected')

        return clonedDomNode
    }
    private _getInstance = () => {
        const dataProps = PaneEmbed.value(this.domNode)
        return embedInstanceService.getInstance(dataProps.uuid)
    }

    public unviewable = () => {
        const instance = this._getInstance()
        return instance?.state.unviewable
    }

    public viewable = () => !this.unviewable()

    public static async clonePane(paneNode: PaneEmbedValue) {
        const state = store.getState()
        const selectedIndex = getSelectedIndex(store.getState())
        if (selectedIndex == null) {
            return
        }

        const originalPaneId = paneNode.embedData.pane
        const pagesApiService = new PagesApiService()
        const clone = await pagesApiService.duplicatePane(
            originalPaneId,
            state.currentDocument.id
        )
        paneNode.embedData.pane = clone.id
        const quill = quillProvider.getQuill()
        quill.insertEmbed(
            selectedIndex,
            PANE_EMBED_BLOT_NAME,
            paneNode,
            QuillSources.USER
        )
    }

    public setSize(size: BlotSize) {
        if (this.unviewable()) {
            return
        }

        this.setDataAttribute('size', size)

        const instance = this._getInstance()
        instance?.setState({ size })

        this._trackResize(size)
    }

    public resetEmbedData(embedData: Object) {
        const instance = this._getInstance()
        instance?.resetEmbedData(embedData)
    }

    private _trackResize(size: BlotSize) {
        const state = store.getState()
        new EmbedAnalytics()
            .onResized()
            .withProperties({
                newEmbedSize: size,
                documentId: state.currentDocument.id,
                teamId: state.user.teamId,
                userId: state.user.userId,
                extension: PaneEmbed.service
            })
            .track()
    }

    public addMark(id: string) {
        this.domNode.classList.add(getCommentMarkClassName(id))
        const dataProps = PaneEmbed.value(this.domNode)
        let { threadIds } = dataProps.embedData
        if (threadIds == null) {
            threadIds = []
        }
        threadIds.push(id)
        dataProps.embedData.threadIds = threadIds
        this.resetEmbedData(dataProps.embedData)
        PaneEmbed.setValue(this.domNode, dataProps)
    }

    public removeMark(id: string) {
        this.domNode.classList.remove(getCommentMarkClassName(id))
        const dataProps = PaneEmbed.value(this.domNode)
        const { threadIds } = dataProps.embedData
        if (threadIds != null) {
            const index = threadIds.indexOf(id)
            if (index > -1) {
                threadIds.splice(index, 1)
            }
            dataProps.embedData.threadIds = threadIds
            this.resetEmbedData(dataProps.embedData)
            PaneEmbed.setValue(this.domNode, dataProps)
        }
        this.unhighlight()
    }

    public getMarkType() {
        return PaneEmbed.service
    }

    public highlight() {
        const dataProps = PaneEmbed.value(this.domNode)
        const portal = document.getElementById(`portal-${dataProps.uuid}`)
        portal?.classList.add('selected')
    }

    public unhighlight() {
        const dataProps = PaneEmbed.value(this.domNode)
        const portal = document.getElementById(`portal-${dataProps.uuid}`)
        portal?.classList.remove('selected')
    }

    public select(index: number) {
        this.isSelected = true
        this.highlight()
        this.domNode.focus()
        const bounds = this.domNode.getBoundingClientRect()
        const quill = quillProvider.getQuill()
        const containerBounds = quill.container.getBoundingClientRect()
        const { top, right, bottom, left, width, height } = getBounds(
            bounds,
            containerBounds
        )

        store.dispatch(
            selectionChanged(
                this.editorId,
                true, // @todo we need to change this if we want to support block embed inside table cell
                null,
                index,
                0,
                SelectionType.Embed,
                PaneEmbed.service,
                null,
                top,
                right,
                bottom,
                left,
                width,
                height,
                {},
                false
            )
        )
    }

    private setDataAttribute(name: string, value: string) {
        this.domNode.setAttribute(`data-${name}`, value)

        const dataProps = PaneEmbed.value(this.domNode)
        dataProps[name] = value
        PaneEmbed.setValue(this.domNode, dataProps)
    }

    handleClick = (e: MouseEvent) => {
        if (!this.isSelected) {
            const quill = quillProvider.getQuill()
            const index = quill.getIndex(this)

            if (e.shiftKey) {
                const state = store.getState()
                const selectionIndex = state.selection.index
                if (selectionIndex != null) {
                    const maxIndex = Math.max(index, selectionIndex)
                    const minIndex = Math.min(index, selectionIndex)
                    this.setQuillSelection(
                        minIndex,
                        maxIndex - minIndex + 1,
                        QuillSources.USER
                    )
                    return
                }
            }

            quill.setSelection(null, QuillSources.SILENT)
            this.select(index)
        }
    }

    handleKeyDown = (e: KeyboardEvent) => {
        if (this.isSelected) {
            const which = e.which || e.keyCode
            const shortKey = e[SHORTKEY]
            const shiftKey = e.shiftKey
            if (which === keycodes.Enter) {
                this.handleEnter()
            } else if (
                which === keycodes.Backspace ||
                which === keycodes.Delete
            ) {
                this.handleDelete()
            } else if (which >= keycodes.Left && which <= keycodes.Down) {
                this.handleArrows(which)
            } else if (
                (which === keycodes.Z && shortKey && shiftKey) ||
                (which === keycodes.Y && shortKey)
            ) {
                this.handleHistory('redo')
            } else if (which === keycodes.Z && shortKey) {
                this.handleHistory('undo')
            } else {
                return
            }
            e.preventDefault()
        }
    }

    handleHistory(historyMethod: 'undo' | 'redo') {
        const quill = quillProvider.getQuill()
        const history = quill.getModule('history')
        history[historyMethod]()
    }

    handleArrows(which: number) {
        let index = getSelectedIndex(store.getState())
        if (index == null) {
            return
        }

        const quill = quillProvider.getQuill()

        if (which === keycodes.Up || which === keycodes.Left) {
            index -= 1
        } else if (which === keycodes.Down || which === keycodes.Right) {
            index += 1
        }

        const [leaf] = quill.getLeaf(index) as [Embed | null]
        if (leaf?.isEmbed) {
            leaf.select(index)
        } else {
            this.setQuillSelection(index, 0, QuillSources.USER)
        }
    }

    setQuillSelection(index: number, length: number, source: Sources) {
        const quill = quillProvider.getQuill()

        // we need to set native selection first to prevent unexpected scroll jumps on .ql-editor focus
        const selection = quill.selection as QuillSelection
        const [
            startNode,
            startOffset,
            endNode,
            endOffset
        ] = selection.rangeToNative({ index, length: 0 })

        const nativeSelection = document.getSelection()

        const range = document.createRange()
        range.setStart(startNode, startOffset)
        range.setEnd(endNode, endOffset)
        if (nativeSelection != null) {
            nativeSelection.removeAllRanges()
            nativeSelection.addRange(range)
        }

        // set quill selection
        quill.setSelection(index, length, source)
    }

    handleDelete() {
        const selectedIndex = getSelectedIndex(store.getState())
        if (selectedIndex == null) {
            return
        }

        const quill = quillProvider.getQuill()
        quill.deleteText(selectedIndex, 1, QuillSources.USER)
        const newIndex = selectedIndex - 1
        const [line] = quill.getLeaf(newIndex) as [Embed | null]
        if (line?.isEmbed) {
            line.select(newIndex)
        } else {
            this.setQuillSelection(newIndex, 0, QuillSources.USER)
        }
        new EmbedAnalytics().onDeleted().track()
    }

    handleEnter() {
        const selectedIndex = getSelectedIndex(store.getState())
        if (selectedIndex == null) {
            return
        }

        const quill = quillProvider.getQuill()
        const newIndex = selectedIndex + 1
        quill.insertText(newIndex, '\n', { id: cuid() }, QuillSources.USER)
        this.setQuillSelection(newIndex, 0, QuillSources.USER)
    }

    handleBlur = (event: FocusEvent) => {
        if (document.activeElement !== this.domNode) {
            this.isSelected = false
            this.unhighlight()
        }
        const target = event.relatedTarget as HTMLElement
        const dataProps = PaneEmbed.value(this.domNode)
        store.dispatch(
            selectionChanged(
                null,
                false,
                dataProps.uuid,
                0,
                0,
                SelectionType.Embed,
                PaneEmbed.service,
                null
            )
        )
        target?.click()
    }

    remove() {
        super.remove()
    }

    deleteAt(index: number, length: number) {
        ReactDOM.unmountComponentAtNode(this.domNode)
        super.deleteAt(index, length)
    }
}
