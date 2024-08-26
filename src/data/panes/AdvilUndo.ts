import OTUndo from '../undo/OTUndo'
import Advil, { JSON1Wrapper } from './Advil'

function isEmptyOp(op: JSON1Wrapper) {
    return op.ops == null
}

export class AdvilUndo {
    private otUndo = new OTUndo<JSON1Wrapper>({ isEmptyOp })

    private advil: Advil

    constructor(advil: Advil) {
        this.advil = advil
    }

    record(op: JSON1Wrapper) {
        this.otUndo.record(op, op.invert())
    }

    transform(op: JSON1Wrapper) {
        this.otUndo.transform(op)
    }

    onDidRecord(fn: () => void) {
        this.otUndo.onDidRecord(fn)
    }

    canUndo() {
        return this.otUndo.canUndo()
    }

    canRedo() {
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

    private change(op: JSON1Wrapper) {
        this.advil.applyUndoOperation(op)
    }
}
