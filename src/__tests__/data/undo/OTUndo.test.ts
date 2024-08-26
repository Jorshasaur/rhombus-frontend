import Delta from 'quill-delta'
import OTUndo from '../../../data/undo/OTUndo'

function isEmptyOp(op: Delta) {
    return op.length() === 0
}

describe('OTUndo', () => {
    let otUndo: OTUndo<Delta>
    let doc: Delta
    let composedDoc: Delta
    let op: Delta
    let inverseOp: Delta

    beforeEach(() => {
        otUndo = new OTUndo({ delay: 0, isEmptyOp })
        doc = new Delta([{ insert: 'Hello!' }])
        op = new Delta().retain(doc.length()).insert(' test')
        composedDoc = doc.compose(op)
        inverseOp = op.invert(doc)
        otUndo.record(op, inverseOp)
    })

    it('should record operation', () => {
        expect(otUndo.canUndo()).toBe(true)
        expect(otUndo.canRedo()).toBe(false)
    })

    it('should undo operation', () => {
        const undoOp = otUndo.undo()
        expect(undoOp).toEqual(inverseOp)

        expect(otUndo.canUndo()).toBe(false)
        expect(otUndo.canRedo()).toBe(true)
    })

    it('should redo operation', () => {
        otUndo.undo()
        const redoOp = otUndo.redo()
        expect(redoOp).toEqual(op)
    })

    it('should undo after redo operation', () => {
        otUndo.undo()
        otUndo.redo()
        const undoOp = otUndo.undo()
        expect(undoOp).toEqual(inverseOp)
    })

    it('should clear undo stack', () => {
        expect(otUndo.canUndo()).toBe(true)
        otUndo.clear()
        expect(otUndo.canUndo()).toBe(false)
    })

    it('should ignore empty op', () => {
        otUndo.clear()
        otUndo.record(new Delta(), new Delta())
        expect(otUndo.canUndo()).toBe(false)
        expect(otUndo.canRedo()).toBe(false)
    })

    describe('transform undo and redo stacks', () => {
        it('transforms appended text', () => {
            const serverOp = new Delta()
                .retain(composedDoc.length())
                .insert(' server')

            // apply server op to composed doc
            composedDoc = composedDoc.compose(serverOp)

            expect(composedDoc).toEqual(
                new Delta([{ insert: 'Hello! test server' }])
            )

            // transform undo/redo stack
            otUndo.transform(serverOp)

            // undo
            const undoOp = otUndo.undo() as Delta

            composedDoc = composedDoc.compose(undoOp)

            expect(composedDoc).toEqual(
                new Delta([{ insert: 'Hello! server' }])
            )

            // redo
            const redoOp = otUndo.redo() as Delta

            composedDoc = composedDoc.compose(redoOp)

            expect(composedDoc).toEqual(
                new Delta([{ insert: 'Hello! test server' }])
            )
        })

        it('transforms edit at the middle of a text', () => {
            const serverOp = new Delta().retain(doc.length()).insert(' server')

            // apply server op to composed doc
            const transformedServerOp = op.transform(serverOp, false)
            composedDoc = composedDoc.compose(transformedServerOp)

            expect(composedDoc).toEqual(
                new Delta([{ insert: 'Hello! server test' }])
            )

            // transform undo/redo stack
            otUndo.transform(serverOp)

            // undo
            const undoOp = otUndo.undo() as Delta

            composedDoc = composedDoc.compose(undoOp)

            expect(composedDoc).toEqual(
                new Delta([{ insert: 'Hello! server' }])
            )

            // redo
            const redoOp = otUndo.redo() as Delta

            composedDoc = composedDoc.compose(redoOp)

            expect(composedDoc).toEqual(
                new Delta([{ insert: 'Hello! server test' }])
            )
        })

        it('transforms multiple operations', () => {
            otUndo.clear()
            composedDoc = new Delta([{ insert: 'b\n' }])

            // d
            const dOp = new Delta().retain(1).insert('d')
            otUndo.record(dOp, dOp.invert(composedDoc))
            composedDoc = composedDoc.compose(dOp)

            // a
            const aOp = new Delta().retain(0).insert('a')
            otUndo.record(aOp, aOp.invert(composedDoc))
            composedDoc = composedDoc.compose(aOp)

            // c from server
            const serverOp = new Delta().retain(2).insert('c')
            composedDoc = composedDoc.compose(serverOp)

            // transform undo/redo stack
            otUndo.transform(serverOp)

            expect(composedDoc).toEqual(new Delta([{ insert: 'abcd\n' }]))

            // undo
            composedDoc = composedDoc.compose(otUndo.undo() as Delta)
            expect(composedDoc).toEqual(new Delta([{ insert: 'bcd\n' }]))

            // undo
            composedDoc = composedDoc.compose(otUndo.undo() as Delta)
            expect(composedDoc).toEqual(new Delta([{ insert: 'bc\n' }]))

            // redo
            composedDoc = composedDoc.compose(otUndo.redo() as Delta)
            expect(composedDoc).toEqual(new Delta([{ insert: 'bcd\n' }]))

            // redo
            composedDoc = composedDoc.compose(otUndo.redo() as Delta)
            expect(composedDoc).toEqual(new Delta([{ insert: 'abcd\n' }]))
        })

        it('should ignore transformed empty op', () => {
            expect(otUndo.canUndo()).toBe(true)

            const serverOp = new Delta().retain(doc.length()).delete(5)
            composedDoc = composedDoc.compose(serverOp)

            expect(composedDoc).toEqual(new Delta([{ insert: 'Hello!' }]))

            // transform undo/redo stack
            otUndo.transform(serverOp)

            expect(otUndo.canUndo()).toBe(false)
        })
    })
})
