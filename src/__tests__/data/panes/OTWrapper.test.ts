import json1 from 'ot-json1'
import { JSON1Wrapper } from '../../../data/panes/Advil'

describe('JSON1Wrapper', () => {
    let doc: string[]
    beforeEach(() => {
        doc = []
    })

    it('should instantiate JSON1Wrapper', () => {
        const op = json1.insertOp([0], 'test1')
        const inverseOp = json1.removeOp([0])
        const wrapperOp = new JSON1Wrapper(op, inverseOp)
        expect(wrapperOp.ops).toEqual(op)
        expect(wrapperOp.inverse).toEqual(inverseOp)
    })

    it('should compose another operation', () => {
        const op1 = json1.insertOp([0], 'test1')
        const inverseOp1 = json1.removeOp([0])
        const wrapperOp1 = new JSON1Wrapper(op1, inverseOp1)

        const op2 = json1.insertOp([1], 'test2')
        const inverseOp2 = json1.removeOp([0])
        const wrapperOp2 = new JSON1Wrapper(op2, inverseOp2)

        const composedOp1 = wrapperOp1.compose(wrapperOp2)
        doc = json1.type.apply(doc, composedOp1.ops)
        let inversedDoc = json1.type.apply(doc, composedOp1.inverse)

        expect(doc).toEqual(['test1', 'test2'])
        expect(inversedDoc).toEqual([])

        const op3 = json1.moveOp([0], [1])
        const inverseOp3 = json1.moveOp([1], [0])
        const wrapperOp3 = new JSON1Wrapper(op3, inverseOp3)

        const op4 = json1.editOp([1], 'text-unicode', ['Hello!'])
        const inverseOp4 = json1.editOp([1], 'text-unicode', [{ d: 6 }])
        const wrapperOp4 = new JSON1Wrapper(op4, inverseOp4)

        const composedOp2 = wrapperOp3.compose(wrapperOp4)

        doc = json1.type.apply(doc, composedOp2.ops)
        inversedDoc = json1.type.apply(doc, composedOp2.inverse)

        expect(doc).toEqual(['test2', 'Hello!test1'])
        expect(inversedDoc).toEqual(['test1', 'test2'])

        inversedDoc = json1.type.apply(doc, composedOp1.inverse)
        expect(inversedDoc).toEqual([])

        const composedOp3 = composedOp1.compose(composedOp2)
        doc = json1.type.apply([], composedOp3.ops)
        inversedDoc = json1.type.apply(doc, composedOp3.inverse)
        expect(doc).toEqual(['test2', 'Hello!test1'])
        expect(inversedDoc).toEqual([])
    })

    it('should transform operation', () => {
        doc = ['test1', 'test2']

        const clientOp = json1.editOp([1], 'text-unicode', ['Hello!'])
        const inverseOp = json1.editOp([1], 'text-unicode', [{ d: 6 }])
        const wrapperClientOp = new JSON1Wrapper(clientOp, inverseOp)

        const serverOp = json1.insertOp([1], 'server')
        const wrapperServerOp = new JSON1Wrapper(serverOp)

        // apply client op
        doc = json1.type.apply(doc, wrapperClientOp.ops)

        // apply server op
        doc = json1.type.apply(doc, wrapperServerOp.ops)

        expect(doc).toEqual(['test1', 'server', 'Hello!test2'])

        // transform op
        const transformedOp = wrapperServerOp.transform(wrapperClientOp, true)

        // apply transformed inverse op
        doc = json1.type.apply(doc, transformedOp.inverse)

        expect(doc).toEqual(['test1', 'server', 'test2'])

        // apply transformed op
        doc = json1.type.apply(doc, transformedOp.ops)

        expect(doc).toEqual(['test1', 'server', 'Hello!test2'])
    })
})
