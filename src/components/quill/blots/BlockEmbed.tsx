import theme from '@invisionapp/helios/css/theme'
import cuid from 'cuid'
import { get } from 'lodash'
import { BlockEmbed as BlockEmbedType, QuillSelection, Sources } from 'quill'
import Quill from 'quill/core'
import { Blot } from 'parchment/dist/src/blot/abstract/blot'
import React from 'react'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import { v4 as uuid } from 'uuid'
import {
    default as EmbedAnalytics,
    default as EmbedInteractionAnalytics
} from '../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import { BLOCK_EMBED_BLOT_NAME } from '../../../constants/embeds'
import { SHORTKEY } from '../../../constants/general'
import { selectionChanged } from '../../../data/actions'
import { getSelectedIndex } from '../../../data/selection/selectors'
import store from '../../../data/store'
import { getEmbedType } from '../../../helpers/EmbedHelper'
import { BlockEmbedValue } from '../../../interfaces/blockEmbed'
import { BlotSize } from '../../../interfaces/blotSize'
import { Embed } from '../../../interfaces/Embed'
import { keycodes } from '../../../interfaces/keycodes'
import { SelectionType } from '../../../interfaces/selectionType'
import styles from '../../pages/Editor/Blots/Blots.module.css'
import EmbedContainer from '../../pages/Editor/Blots/EmbedContainer'
import { EmbedModal } from '../../pages/Editor/Blots/EmbedModal'
import { getEditorInfo } from '../getEditorId'
import { getCommentMarkClassName } from '../modules/CommentMarking/getClassName'
import QuillEmbeds from '../modules/QuillEmbeds'
import QuillSources from '../modules/QuillSources'
import { getBounds } from '../utils'
import DefaultEmbedTypes from './DefaultEmbedTypes'
import { getEditor } from '../../../QuillRegistry'
import { COMMENT_MARKING_MODULE_NAME } from '../../../constants/quill-modules'
import { GlobalCommentMarkingModule } from '../modules/CommentMarking'
import { ErrorBoundary } from '../../../bugsnag'

const Block: typeof BlockEmbedType = Quill.import('blots/block/embed')

export class BlockEmbed extends Block implements Embed {
    public static blotName = BLOCK_EMBED_BLOT_NAME
    public static className = styles.blockEmbed
    public static tagName = 'DIV'
    static embedTypes = DefaultEmbedTypes

    domNode: HTMLElement
    provider?: EmbedContainer
    isSelected: boolean = false
    isEmbed = true
    editorId: string | null = null
    paneEmbedId: string | null = null
    mainEditor = false

    static create(value: BlockEmbedValue) {
        const node: HTMLElement = super.create(value) as HTMLElement

        node.setAttribute('data-props', JSON.stringify(value))
        node.setAttribute('contenteditable', 'false')
        node.setAttribute('tabindex', '0')
        node.setAttribute('spellcheck', 'false')
        node.setAttribute('id', value.uuid)
        node.setAttribute('data-type', value.type!)
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

        // Mounting the EmbedModal here so that each embed doesn't have to mount
        // it over and over again
        EmbedModal.mount()

        return node
    }

    static value = (domNode: HTMLElement): BlockEmbedValue => {
        return JSON.parse(domNode.getAttribute('data-props')!)
    }

    static setValue(domNode: HTMLElement, value: any) {
        domNode.setAttribute('data-props', JSON.stringify(value))
    }

    public static cloneDOMNode(domNode: HTMLElement): HTMLElement {
        const clonedDomNode = domNode.cloneNode() as HTMLElement

        const dataProps = BlockEmbed.value(clonedDomNode)
        dataProps.uuid = uuid()
        BlockEmbed.setValue(clonedDomNode, dataProps)

        clonedDomNode.classList.remove('selected')

        return clonedDomNode
    }

    public static register(service: string, component: Function) {
        this.embedTypes[service] = component
    }

    public static deregister(service: string) {
        delete this.embedTypes[service]
    }

    constructor(domNode: HTMLElement) {
        super(domNode)

        domNode.addEventListener('click', this.handleClick)
        domNode.addEventListener('keydown', this.handleKeyDown)
        domNode.addEventListener('blur', this.handleBlur)
    }

    attach() {
        super.attach()
        const editorInfo = getEditorInfo((this as unknown) as Blot)
        if (editorInfo) {
            this.editorId = editorInfo.editorId || null
            this.paneEmbedId = editorInfo.embedId || null
            this.mainEditor = editorInfo.mainEditor
        }
    }

    public unviewable = () => get(this, 'provider.state.unviewable', false)
    public viewable = () => !this.unviewable()

    public setSize(size: BlotSize) {
        if (this.unviewable()) {
            return
        }

        this.setDataAttribute('size', size)
        if (this.provider) {
            this.provider.setState({ size })
        }
        this._trackResize(size)
    }

    public resetEmbedData(embedData: Object) {
        if (this.provider) {
            this.provider.resetEmbedData(embedData)
        }
    }

    private _trackResize(size: BlotSize) {
        const state = store.getState()
        const value = BlockEmbed.value(this.domNode)
        const asset = state.assets[value.embedData.id]
        const embedType =
            asset && getEmbedType(asset.contentType, asset.fileName)
        const service =
            value.service === 'invision' ? 'flat_prototype' : value.service
        new EmbedInteractionAnalytics()
            .onResized()
            .withProperties({
                newEmbedSize: size,
                documentId: state.currentDocument.id,
                teamId: state.user.teamId,
                userId: state.user.userId,
                extension: embedType || service
            })
            .track()
    }

    public addComment() {
        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }

        const commentMarking = quill.getModule(COMMENT_MARKING_MODULE_NAME)
        const id = commentMarking.createFromEmbed(this)
        setImmediate(() => {
            GlobalCommentMarkingModule.select(id)
        })
    }

    public addMark(id: string) {
        this.domNode.classList.add(getCommentMarkClassName(id))
        const dataProps = BlockEmbed.value(this.domNode)
        let { threadIds } = dataProps.embedData
        if (threadIds == null) {
            threadIds = []
        }
        threadIds.push(id)
        dataProps.embedData.threadIds = threadIds
        this.resetEmbedData(dataProps.embedData)
        BlockEmbed.setValue(this.domNode, dataProps)
    }

    public removeMark(id: string) {
        this.domNode.classList.remove(getCommentMarkClassName(id))
        const dataProps = BlockEmbed.value(this.domNode)
        const { threadIds } = dataProps.embedData
        if (threadIds != null) {
            const index = threadIds.indexOf(id)
            if (index > -1) {
                threadIds.splice(index, 1)
            }
            dataProps.embedData.threadIds = threadIds
            this.resetEmbedData(dataProps.embedData)
            BlockEmbed.setValue(this.domNode, dataProps)
        }
        this.unhighlight()
    }

    public getMarkType() {
        return this.domNode.getAttribute('data-service')
    }

    public highlight() {
        this.domNode.classList.add('selected')
    }

    public unhighlight() {
        this.domNode.classList.remove('selected')
    }

    public select(index: number) {
        this.isSelected = true
        this.highlight()
        this.domNode.focus()
        const bounds = this.domNode.getBoundingClientRect()
        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }

        const containerBounds = quill.container.getBoundingClientRect()
        let { top, right, bottom, left, width, height } = getBounds(
            bounds,
            containerBounds
        )

        const service = this.domNode.getAttribute('data-service')!
        if (service === QuillEmbeds.IMAGE) {
            const { firstElementChild } = this.domNode
            if (firstElementChild != null) {
                const imageBounds = firstElementChild.getBoundingClientRect()
                width = imageBounds.width
            }
        }

        store.dispatch(
            selectionChanged(
                this.editorId,
                this.mainEditor,
                this.paneEmbedId,
                index,
                0,
                SelectionType.Embed,
                service,
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

        const dataProps = BlockEmbed.value(this.domNode)
        dataProps[name] = value
        BlockEmbed.setValue(this.domNode, dataProps)
    }

    handleClick = (e: MouseEvent) => {
        if (!this.isSelected) {
            const target = e.target as HTMLElement

            if (target && target.dataset.allowPropagation !== 'true') {
                e.stopPropagation()
            }

            const quill = getEditor(this.editorId!)
            if (!quill) {
                return
            }

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
        const which = e.which || e.keyCode
        const shortKey = e[SHORTKEY]
        const shiftKey = e.shiftKey
        if (which === keycodes.Enter) {
            this.handleEnter()
        } else if (which === keycodes.Backspace || which === keycodes.Delete) {
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
    handleHistory(historyMethod: 'undo' | 'redo') {
        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }
        const history = quill.getModule('history')
        history[historyMethod]()
    }
    handleArrows(which: number) {
        let index = getSelectedIndex(store.getState())
        if (index == null) {
            return
        }

        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }

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
        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }

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

    remove() {
        this.domNode.removeEventListener('click', this.handleClick)
        this.domNode.removeEventListener('keydown', this.handleKeyDown)
        this.domNode.removeEventListener('blur', this.handleBlur)
        super.remove()
    }

    handleDelete() {
        const selectedIndex = getSelectedIndex(store.getState())
        if (selectedIndex == null) {
            return
        }

        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }
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

        const quill = getEditor(this.editorId!)
        if (!quill) {
            return
        }
        const newIndex = selectedIndex + 1
        quill.insertText(newIndex, '\n', { id: cuid() }, QuillSources.USER)
        this.setQuillSelection(newIndex, 0, QuillSources.USER)
    }

    handleBlur = () => {
        if (document.activeElement !== this.domNode) {
            this.isSelected = false
            this.unhighlight()
        }
    }

    deleteAt(index: number, length: number) {
        ReactDOM.unmountComponentAtNode(this.domNode)
        super.deleteAt(index, length)
    }

    // Any is defined as the type in the Parchment documentation
    formatAt(index: number, length: number, format: string, value: any) {
        if (this.domNode.children.length === 0) {
            const data = this.value(this.domNode)[BLOCK_EMBED_BLOT_NAME]
            if (data.service in BlockEmbed.embedTypes) {
                const res = BlockEmbed.embedTypes[data.service](
                    data,
                    this.domNode,
                    this.paneEmbedId != null
                )
                let component
                if (Array.isArray(res)) {
                    this.provider = res[1]
                    component = res[0]
                } else {
                    component = res
                }

                ReactDOM.render(
                    <ErrorBoundary>
                        <ThemeProvider theme={theme}>{component}</ThemeProvider>
                    </ErrorBoundary>,
                    this.domNode
                )
            }
        }
        super.formatAt(index, length, format, value)
    }
}
