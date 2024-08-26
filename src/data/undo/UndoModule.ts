import Quill from '../../components/quill/entries/Editor'
import GlobalUndo from './GlobalUndo'

interface UndoModuleOptions {
    documentId?: string
    ignoreClear?: boolean
}

export default class UndoModule {
    private quill: Quill
    private documentId?: string
    private ignoreClear: boolean

    constructor(quill: Quill, options: UndoModuleOptions = {}) {
        this.quill = quill

        if (options.documentId) {
            this.documentId = options.documentId
        }

        if (options.ignoreClear) {
            this.ignoreClear = options.ignoreClear === true
        }

        this.quill.keyboard.addBinding({ key: 'Z', shortKey: true }, this.undo)
        this.quill.keyboard.addBinding(
            { key: 'Z', shortKey: true, shiftKey: true },
            this.redo
        )
        if (/Win/i.test(navigator.platform)) {
            this.quill.keyboard.addBinding(
                { key: 'Y', shortKey: true },
                this.redo
            )
        }
    }

    cutoff() {
        if (this.documentId) {
            GlobalUndo.cutoff(this.documentId)
        }
    }

    clear() {
        if (this.ignoreClear) {
            return
        }

        if (this.documentId) {
            GlobalUndo.clear(this.documentId)
        }
    }

    undo = () => {
        GlobalUndo.undo()
    }

    redo = () => {
        GlobalUndo.redo()
    }
}
