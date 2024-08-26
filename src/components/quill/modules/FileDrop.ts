import { Blot } from 'parchment/dist/src/blot/abstract/blot'
import Quill from 'quill/core'
import { beginDragging, endDragging } from '../../../data/actions'
import store from '../../../data/store'
import { FILE_CREATE_METHOD } from '../../../helpers/EmbedHelper'
import {
    attachDragEvent,
    DragEventData
} from '../../pages/Editor/LineDrag/LineDragUtils'
import { getBlotOffset } from '../utils'
import FileBlotCreater from './FileBlotCreator'
import getFileEmbedOptions from './FileEmbedOptions'
import { BLOCK_EMBED_BLOT_NAME } from '../../../constants/embeds'
import { getEditorId } from '../getEditorId'
import { getEditor } from '../../../QuillRegistry'

const Parchment = Quill.import('parchment')

function isFileDnd(dataTransfer: DataTransfer) {
    return Array.from(dataTransfer.types).indexOf('Files') > -1
}

export default class FileDropModule {
    dragging = false
    dragEventData: DragEventData
    dragEndTimeout: any

    constructor(private quill: Quill, enabled: boolean) {
        if (enabled) {
            document.addEventListener('drop', this.handleDrop)
            document.addEventListener('dragenter', this.dragEnter, true)
            document.addEventListener('dragleave', this.dragLeave, true)
        }
    }

    getEmbedOptions = (file: File) => {
        return getFileEmbedOptions(file, this.quill)
    }

    beginDrag() {
        this.dragging = true

        // hide cursor
        this.quill.root.classList.add('hide-cursor')

        // set dragging to redux
        store.dispatch(beginDragging())

        // attach drag event
        const state = store.getState()
        const navigationHeight = state.elementCoordinates.navigation.bottom
        this.dragEventData = attachDragEvent(this.quill, navigationHeight, true)
    }

    endDrag() {
        this.dragging = false

        // show cursor
        this.quill.root.classList.remove('hide-cursor')

        // set end dragging to redux
        store.dispatch(endDragging())

        const { handler, dragOver } = this.dragEventData

        // remove dragover event listener
        document.removeEventListener('dragover', handler, true)

        // remove dragover class
        dragOver.end = true

        if (dragOver.element != null) {
            dragOver.element.classList.remove('dragover')
        }
    }

    dragEnter = (e: DragEvent) => {
        if (!this.dragging) {
            if (e.dataTransfer != null && isFileDnd(e.dataTransfer)) {
                this.beginDrag()
            }
        } else {
            clearTimeout(this.dragEndTimeout)
        }
    }

    dragLeave = () => {
        if (this.dragging) {
            this.dragEndTimeout = setTimeout(() => {
                this.endDrag()
            }, 1000)
        }
    }

    handleDrop = async (e: DragEvent) => {
        if (e.dataTransfer == null) {
            return
        }

        if (isFileDnd(e.dataTransfer)) {
            e.preventDefault()
            e.stopPropagation()

            this.endDrag()

            const dragOver = this.dragEventData.dragOver.element
            if (dragOver == null) {
                return
            }
            const blot: Blot = Parchment.find(dragOver)
            const editorId = getEditorId(blot)
            if (!editorId) {
                return
            }
            const editor = getEditor(editorId)
            if (!editor) {
                return
            }

            const offset = getBlotOffset(editor, blot)
            const index = offset + blot.length()

            const { files } = e.dataTransfer
            if (files != null) {
                await FileBlotCreater.createBlotFromFiles(
                    Array.from(files),
                    editor,
                    BLOCK_EMBED_BLOT_NAME,
                    {
                        getEmbedOptions: this.getEmbedOptions,
                        index
                    },
                    FILE_CREATE_METHOD.fileDrop
                )
            }
        }
    }
}
