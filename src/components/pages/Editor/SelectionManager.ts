import cuid from 'cuid'
import { debounce } from 'lodash'
import { RangeStatic, ScrollBlot, Sources } from 'quill'
import Delta from 'quill-delta'
import setImmediatePromise from 'set-immediate-promise'
import {
    clearSelection,
    selectionChanged,
    selectionIndexChanged
} from '../../../data/actions'
import { SelectionState } from '../../../data/reducers/selection'
import store from '../../../data/store'
import { Embed } from '../../../interfaces/Embed'
import { SelectionType } from '../../../interfaces/selectionType'
import '../../../lib/triple-click'
import Quill from '../../quill/entries/Editor'
import QuillEvents from '../../quill/modules/QuillEvents'
import QuillSources from '../../quill/modules/QuillSources'
import { isBlankLine } from '../../quill/utils'

type SelectionChangeArgs = [RangeStatic | null, RangeStatic | null, Sources]
type TextChangeArgs = [Delta, Delta, Sources]

interface Options {
    enabled: boolean
    mainEditor?: boolean
    editorId?: string
    embedId?: string
}

export default class SelectionManager {
    highlightedEmbeds: Array<Embed> | null
    mouseDown: boolean = false
    mouseDownInterval: any
    editorId: string | null
    embedId: string | null
    mainEditor = false

    constructor(private quill: Quill, options: Options) {
        if (options.enabled) {
            this.editorId = options.editorId || null
            this.embedId = options.embedId || null
            this.mainEditor = options.mainEditor == true
            this.handleDragging()
            this.quill.on(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
        }
    }

    detach() {
        this.quill.off(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
        document.removeEventListener(
            'selectionchange',
            this.handleNativeSelectionChange
        )
        document.body.removeEventListener('mousedown', this.handleMouseDown)
        document.body.removeEventListener('mouseup', this.handleMouseUp)
    }

    handleEditorChange = (eventName: string, ...args: any[]) => {
        if (eventName === QuillEvents.SELECTION_CHANGE) {
            const [range, , source] = args as SelectionChangeArgs

            // don't handle selection change here when range is null and source is SILENT
            // it's called when we're setting BlockEmbed selection
            // and BlockEmbed is responsible for managing selection state at this point
            if (range == null && source === QuillSources.SILENT) {
                return
            }
            this.handleSelectionChange(args[0])
        } else if (eventName === QuillEvents.TEXT_CHANGE) {
            const [delta, , source] = args as TextChangeArgs
            const { selection } = store.getState()
            if (this.shouldTransformEmbedPosition(selection, source)) {
                const index = delta.transformPosition(selection.index!)
                store.dispatch(selectionIndexChanged(index))
                return
            } else if (selection.selectionType === SelectionType.Text) {
                const quillSelection = this.quill.getSelection()
                this.handleSelectionChange(quillSelection)
            }
        }
    }

    shouldTransformEmbedPosition(selection: SelectionState, source: Sources) {
        return (
            source === QuillSources.API &&
            selection.selectionType === SelectionType.Embed &&
            selection.index != null
        )
    }

    // NOTE: we can't simply debounce handleSelectionChange because selectionChanged action is also called
    // from other places in the app and debounce can unexpectedly override selection that was set
    // for example by BlockEmbed
    handleSelectionChange = async (range?: RangeStatic) => {
        if (range) {
            // If you click in the editor, store the cursor and selection data
            const bounds = this.quill.getBounds(range.index, range.length)
            let format = this.quill.getFormat(range.index, range.length)
            const [line] = this.quill.getLine(range.index)
            let isFirstLine = false
            if (this.mainEditor) {
                isFirstLine = this.quill.getIndex(line) === 0
            }

            await this.handleEmbedsSelection(range)

            const text = this.quill.getText(range.index, range.length)
            // If format is a code-block, rename it to camel case
            if (format['code-block']) {
                format = {
                    codeBlock: format['code-block'],
                    ...format
                }
                delete format['code-block']
            }

            // If we're on the last line we may need to add an empty space
            if (this.mainEditor && range.index === this.quill.getLength() - 1) {
                this.insertEndingBlankLine(range, line)
            }

            // Pass the updated selection information in
            store.dispatch(
                selectionChanged(
                    this.editorId,
                    this.mainEditor,
                    this.embedId,
                    range.index,
                    range.length,
                    SelectionType.Text,
                    '',
                    text,
                    bounds.top,
                    bounds.right,
                    bounds.bottom,
                    bounds.left,
                    bounds.width,
                    bounds.height,
                    format,
                    isFirstLine
                )
            )
        } else {
            // Clear the cursor and selection data when clicking outside the editor
            const { selection } = store.getState()
            if (selection.editorId === this.editorId) {
                this.clearSelection()
            }
        }
    }

    async clearSelection() {
        store.dispatch(clearSelection())
        await this.unhighlightEmbeds()
    }

    insertEndingBlankLine = (range: RangeStatic, line: any) => {
        const lastLineContent = line.domNode.textContent.replace(/\s/g, '')
        // If the last line is blank, then there's nothing more to add
        if (!isBlankLine(line.length(), lastLineContent)) {
            this.quill.insertText(
                range.index + 1,
                '\n',
                { id: cuid() },
                QuillSources.USER
            )
        }
    }

    handleDragging() {
        this.handleNativeSelectionChange = debounce(
            this.handleNativeSelectionChange,
            50
        )
        document.addEventListener(
            'selectionchange',
            this.handleNativeSelectionChange
        )
        this.quill.container.addEventListener(
            'dblclick',
            this.handleDoubleClick
        )
        this.quill.container.addEventListener(
            'tripleclick',
            this.handleTripleClick
        )
        document.body.addEventListener('mousedown', this.handleMouseDown)
        document.body.addEventListener('mouseup', this.handleMouseUp)
    }

    handleDoubleClick = async () => {
        const range = this.quill.getSelection()
        if (!range) {
            // triple-clicking on a blot will not return a range
            return
        }

        const text = this.quill
            .getText(range.index, range.length)
            .replace(/\n/g, '')

        if (text.length === 0) {
            // if you double-click on a newline, don't accidentally select following block embeds
            this.quill.setSelection(range.index, 0)
        }
    }

    handleTripleClick = async () => {
        const range = this.quill.getSelection()
        if (!range) {
            // triple-clicking on a blot will not return a range
            return
        }
        await this.unhighlightEmbeds()
        // subtract 1 for the length of the newline, otherwise Safari still selects the next line
        await this.quill.setSelection(range.index, range.length - 1)
    }

    handleMouseDown = () => {
        this.mouseDownInterval = setTimeout(() => {
            this.mouseDown = true
        }, 100)
    }

    handleMouseUp = (event: MouseEvent) => {
        let keepFocus = false

        // If specified do not deselect from the element on click
        if (
            event.target instanceof HTMLElement &&
            event.target.dataset.keepFocus === 'true'
        ) {
            keepFocus = true
        }

        clearTimeout(this.mouseDownInterval)
        this.mouseDown = false

        this.handleEmbedDeselect(keepFocus)
    }

    handleEmbedDeselect(keepFocus: boolean) {
        if (document.activeElement === document.body && !keepFocus) {
            const state = store.getState()
            if (state.selection.index != null) {
                store.dispatch(clearSelection())
            }
        }
    }

    handleNativeSelectionChange = async () => {
        if (this.mouseDown) {
            const [range] = this.quill.selection.getRange()
            if (range != null) {
                await this.handleEmbedsSelection(range)
            }
        }
    }

    async unhighlightEmbeds() {
        if (
            this.highlightedEmbeds != null &&
            this.highlightedEmbeds.length > 0
        ) {
            const scroll: ScrollBlot = this.quill.scroll as ScrollBlot
            scroll.batch = true

            let triggersMutations = false
            this.highlightedEmbeds.forEach((embed) => {
                triggersMutations = embed.domNode.parentNode != null
                embed.unhighlight()
            })
            this.highlightedEmbeds = null

            if (triggersMutations) {
                await setImmediatePromise()
            }

            scroll.batch = false
        }
    }

    async handleEmbedsSelection(range: RangeStatic) {
        await this.unhighlightEmbeds()

        if (range.length > 0) {
            const scroll: ScrollBlot = this.quill.scroll as ScrollBlot
            scroll.batch = true

            const lines = this.quill.getLines(range.index, range.length)
            let triggersMutations = false

            const embedsReducer = (result: Embed[], currentLine: Embed) => {
                if (currentLine.isEmbed) {
                    triggersMutations = true
                    currentLine.highlight()
                    result.push(currentLine)
                }
                return result
            }
            this.highlightedEmbeds = lines.reduce(embedsReducer, [])

            if (triggersMutations) {
                await setImmediatePromise()
            }
            scroll.batch = false
        }
    }
}
