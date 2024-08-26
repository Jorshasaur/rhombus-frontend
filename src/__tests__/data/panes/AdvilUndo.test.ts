import uuid from 'uuid'
import Delta from 'quill-delta'
import Advil, {
    PaneViewType,
    PaneElementType,
    JSON1Wrapper
} from '../../../data/panes/Advil'
import * as AdvilOps from '../../../data/panes/AdvilOps'
import { getTextValue } from '../../../data/panes/AdvilSelectors'
import { AdvilUndo } from '../../../data/panes/AdvilUndo'

describe('AdvilUndo', () => {
    let advilUndo: AdvilUndo
    let advil: Advil
    let paneId: string
    let listId: string
    let textId: string

    beforeEach(() => {
        Advil.prototype.sendOperation = jest.fn()
        paneId = uuid()
        listId = uuid()
        textId = uuid()
        advil = new Advil(paneId)
        advil.initialize({
            id: paneId,
            viewType: PaneViewType.TABLE,
            elements: [
                {
                    id: listId,
                    elements: [
                        {
                            id: textId,
                            type: PaneElementType.TEXT,
                            value: new Delta().insert('Hello')
                        }
                    ]
                }
            ]
        })
        advilUndo = advil.history
    })

    it('should record change', () => {
        expect(advilUndo.canUndo()).toBe(false)
        advil.editText(listId, textId, new Delta().retain(5).insert(' world!'))
        expect(advilUndo.canUndo()).toBe(true)
        expect(advilUndo.canRedo()).toBe(false)
    })

    it('should undo change', () => {
        const originalPane = advil.pane

        advil.editText(listId, textId, new Delta().retain(5).insert(' world!'))
        advilUndo.undo()

        expect(advil.pane).toEqual(originalPane)
        expect(advilUndo.canUndo()).toBe(false)
        expect(advilUndo.canRedo()).toBe(true)
    })

    it('should redo change', () => {
        advil.editText(listId, textId, new Delta().retain(5).insert(' world!'))
        const changedPane = advil.pane

        advilUndo.undo()
        advilUndo.redo()

        expect(advil.pane).toEqual(changedPane)
        expect(advilUndo.canUndo()).toBe(true)
        expect(advilUndo.canRedo()).toBe(false)
    })

    it('should transform undo stack with incoming change', () => {
        advil.editText(listId, textId, new Delta().retain(5).insert(' world!'))
        const concurrentServerOp = AdvilOps.editText(
            advil.pane,
            listId,
            textId,
            new Delta().retain(5).insert(' server!')
        )
        advil.applyOperation(new JSON1Wrapper(...concurrentServerOp))

        advilUndo.undo()

        expect(getTextValue(advil.pane, listId, textId)).toEqual(
            new Delta().insert('Hello server!')
        )

        advilUndo.redo()

        expect(getTextValue(advil.pane, listId, textId)).toEqual(
            new Delta().insert('Hello server! world!')
        )
    })
})
