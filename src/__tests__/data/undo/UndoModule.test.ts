import UndoModule from '../../../data/undo/UndoModule'
const Quill: any = jest.genMockFromModule('quill/core')

describe('UndoModule', () => {
    let undoModule: UndoModule

    beforeEach(() => {
        Quill.keyboard = {
            addBinding: jest.fn()
        }

        undoModule = new UndoModule(Quill)
    })

    it('should register keyboard bindings', () => {
        expect(Quill.keyboard.addBinding).toBeCalledWith(
            { key: 'Z', shortKey: true },
            expect.any(Function)
        )
        expect(Quill.keyboard.addBinding).toBeCalledWith(
            { key: 'Z', shortKey: true, shiftKey: true },
            expect.any(Function)
        )
    })
})
