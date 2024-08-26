import Quill from '../../components/quill/entries/Editor'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import QuillSources from '../../components/quill/modules/QuillSources'
import Delta, { DeltaStatic, DeltaOperation } from 'quill-delta'
import { Sources } from 'quill'
import Parchment from 'parchment'
import OTUndo from './OTUndo'

function isEmptyOp(op: Delta) {
    return op.length() === 0
}

export default class QuillUndo {
    private quill: Quill
    private ignoreChange = false
    private otUndo = new OTUndo<DeltaStatic>({ isEmptyOp })

    constructor(quill: Quill) {
        this.quill = quill
        this.quill.on(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
    }

    handleEditorChange = (
        eventName: string,
        delta: DeltaStatic,
        oldContents: DeltaStatic,
        source: Sources
    ) => {
        if (eventName !== QuillEvents.TEXT_CHANGE || this.ignoreChange) return
        if (!delta.ops || delta.ops!.length === 0) return

        if (source === QuillSources.USER) {
            const inverseOp = new Delta(delta.ops).invert(oldContents)
            this.otUndo.record(delta, inverseOp)
        } else {
            this.otUndo.transform(delta)
        }
    }

    onDidRecord(fn: () => void) {
        this.otUndo.onDidRecord(fn)
    }

    canUndo(): boolean {
        return this.otUndo.canUndo()
    }

    canRedo(): boolean {
        return this.otUndo.canRedo()
    }

    undo() {
        const op = this.otUndo.undo()
        if (op) {
            this.change(op)
            return true
        }
        return false
    }

    redo() {
        const op = this.otUndo.redo()
        if (op) {
            this.change(op)
            return true
        }
        return false
    }

    clear() {
        this.otUndo.clear()
    }

    cutoff() {
        this.otUndo.cutoff()
    }

    private change(op: DeltaStatic) {
        this.ignoreChange = true

        // If delta has insert ops with an author, apply keepAuthor to those ops.
        // Otherwise, return the delta/op.
        const changeOp = op
        keepAuthor(changeOp)

        this.quill.updateContents(changeOp, QuillSources.USER)
        this.ignoreChange = false
        const index = getLastChangeIndex(op)
        this.quill.setSelection(index)
    }
}

function endsWithNewlineChange(delta: DeltaStatic) {
    const lastOp = delta.ops![delta.ops!.length - 1]
    if (lastOp == null) return false
    if (lastOp.insert != null) {
        return typeof lastOp.insert === 'string' && lastOp.insert.endsWith('\n')
    }
    if (lastOp.attributes != null) {
        return Object.keys(lastOp.attributes).some(function(attr) {
            return Parchment.query(attr, Parchment.Scope.BLOCK) != null
        })
    }
    return false
}

export function getLastChangeIndex(delta: DeltaStatic) {
    const deleteLength = delta.reduce(function(length, op) {
        length += op.delete || 0
        return length
    }, 0)
    let changeIndex = delta.length() - deleteLength
    if (endsWithNewlineChange(delta)) {
        changeIndex -= 1
    }
    return changeIndex
}

export function keepAuthor(op: DeltaStatic) {
    if (!op.ops) {
        return
    }
    op.ops = op.ops.map((op: DeltaOperation) => {
        if (op.insert && op.attributes && op.attributes.author) {
            op.attributes.keepAuthor = true
        }
        return op
    })
}
