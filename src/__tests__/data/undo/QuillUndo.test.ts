import Delta from 'quill-delta'
import { EventEmitter2 } from 'eventemitter2'
import QuillUndo from '../../../data/undo/QuillUndo'
import QuillEvents from '../../../components/quill/modules/QuillEvents'
import QuillSources from '../../../components/quill/modules/QuillSources'
import OTUndo from '../../../data/undo/OTUndo'

OTUndo.defaultOptions.delay = 0

class QuillMock extends EventEmitter2 {
    updateContents = jest.fn()
    setSelection = jest.fn()
}

describe('QuillUndo', () => {
    let quill: QuillMock
    let quillUndo: QuillUndo
    let doc: Delta
    let composedDoc: Delta
    let op: Delta
    let inverseOp: Delta

    beforeEach(() => {
        quill = new QuillMock()
        quillUndo = new QuillUndo(quill)

        doc = new Delta([{ insert: 'Hello!' }])
        op = new Delta().retain(doc.length()).insert(' test')
        inverseOp = op.invert(doc)
        composedDoc = doc.compose(op)

        quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            op,
            doc,
            QuillSources.USER
        )
    })

    it('should record change', () => {
        expect(quillUndo.canUndo()).toBe(true)
        expect(quillUndo.canRedo()).toBe(false)
    })

    it('should undo operation', () => {
        quillUndo.undo()

        expect(quillUndo.canUndo()).toBe(false)
        expect(quillUndo.canRedo()).toBe(true)
        expect(quill.updateContents).toHaveBeenCalledWith(
            inverseOp,
            QuillSources.USER
        )
        expect(quill.setSelection).toHaveBeenCalledWith(doc.length())
    })

    it('should redo operation', () => {
        quillUndo.undo()
        quillUndo.redo()

        expect(quillUndo.canUndo()).toBe(true)
        expect(quillUndo.canRedo()).toBe(false)
        expect(quill.updateContents).toHaveBeenCalledWith(op, QuillSources.USER)
        expect(quill.setSelection).toHaveBeenCalledWith(composedDoc.length())
    })

    it('should transform undo stack with incoming change', () => {
        const serverOp = new Delta().retain(doc.length()).insert(' server')

        quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            serverOp,
            composedDoc,
            QuillSources.API
        )

        quillUndo.undo()

        const transformedInverseOp = serverOp.transform(inverseOp, true)

        expect(quill.updateContents).toHaveBeenCalledWith(
            transformedInverseOp,
            QuillSources.USER
        )
    })

    it('should apply keepAuthor', () => {
        const opWithAuthor = new Delta().insert('hello', { author: '5' })
        composedDoc = composedDoc.compose(opWithAuthor)

        const deleteOp = new Delta().retain(0).delete(5)

        quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            deleteOp,
            composedDoc,
            QuillSources.USER
        )

        quillUndo.undo()

        const inverseOpWithAuthor = deleteOp.invert(composedDoc)
        inverseOpWithAuthor.ops[0].attributes.keepAuthor = true

        expect(quill.updateContents).toHaveBeenCalledWith(
            inverseOpWithAuthor,
            QuillSources.USER
        )
    })
})
