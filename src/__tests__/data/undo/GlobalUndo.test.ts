import { GlobalUndo } from '../../../data/undo/GlobalUndo'
import OTUndo from '../../../data/undo/OTUndo'
import Delta from 'quill-delta'

function isEmptyOp(op: Delta) {
    return op.length() === 0
}

class UndoDocument {
    otUndo = new OTUndo<Delta>({ isEmptyOp })
    doc: Delta

    constructor(doc: Delta) {
        this.doc = doc
    }

    change(op: Delta) {
        const oldContents = this.doc
        this.doc = oldContents.compose(op)
        const inverseOp = op.invert(oldContents)
        this.otUndo.record(op, inverseOp)
    }

    undo() {
        const op = this.otUndo.undo()
        if (op) {
            this.doc = this.doc.compose(op)
            return true
        }
        return false
    }

    redo() {
        const op = this.otUndo.redo()
        if (op) {
            this.doc = this.doc.compose(op)
            return true
        }
        return false
    }

    onDidRecord(fn: () => void) {
        this.otUndo.onDidRecord(fn)
    }

    clear() {
        this.otUndo.clear()
    }

    cutoff() {
        this.otUndo.cutoff()
    }
}

describe('GlobalUndo', () => {
    let globalUndo: GlobalUndo
    let undoDocument: UndoDocument
    const undoDocumentId = 'document-1'
    let originalDoc: Delta
    let op: Delta

    beforeEach(() => {
        originalDoc = new Delta().insert('Hello!')
        op = new Delta()
            .retain(originalDoc.length() - 1)
            .delete(1)
            .insert(' world!')

        globalUndo = new GlobalUndo()

        undoDocument = new UndoDocument(originalDoc)
        globalUndo.register(undoDocumentId, undoDocument)
    })

    it('should record change', () => {
        expect(globalUndo.canUndo()).toBe(false)
        undoDocument.change(op)
        expect(globalUndo.canUndo()).toBe(true)
        expect(globalUndo.canRedo()).toBe(false)
    })

    it('should undo change', () => {
        undoDocument.change(op)
        globalUndo.undo()

        expect(undoDocument.doc).toEqual(originalDoc)
        expect(globalUndo.canUndo()).toBe(false)
        expect(globalUndo.canRedo()).toBe(true)
    })

    it('should redo change', () => {
        undoDocument.change(op)
        globalUndo.undo()
        globalUndo.redo()

        expect(undoDocument.doc).toEqual(originalDoc.compose(op))
        expect(globalUndo.canUndo()).toBe(true)
        expect(globalUndo.canRedo()).toBe(false)
    })

    it('should undo after redo operation', () => {
        undoDocument.change(op)
        globalUndo.undo()
        globalUndo.redo()
        globalUndo.undo()
        expect(undoDocument.doc).toEqual(originalDoc)
    })

    it('should handle multiple undo documents', () => {
        // register second document
        const originalDoc2 = new Delta().insert('Hello!')
        const op2 = new Delta()
            .retain(originalDoc.length() - 1)
            .delete(1)
            .insert(' world!')

        const undoDocument2 = new UndoDocument(originalDoc2)
        const undoDocument2Id = 'document-2'

        globalUndo.register(undoDocument2Id, undoDocument2)

        // document 1 change
        undoDocument.change(op)

        // document 2 change
        undoDocument2.change(op2)

        // undo document 2
        globalUndo.undo()
        expect(undoDocument2.doc).toEqual(originalDoc2)
        expect(undoDocument.doc).toEqual(originalDoc.compose(op))

        // undo document 1
        globalUndo.undo()
        expect(undoDocument.doc).toEqual(originalDoc)
    })
})
