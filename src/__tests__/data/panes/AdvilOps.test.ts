import uuid from 'uuid'
import Delta, { DeltaStatic } from 'quill-delta'
import json1 from 'ot-json1'
import {
    getTextOps,
    createPane,
    addElementToList,
    createText,
    editText,
    getTextEdits,
    addList,
    addElementToListsAtPosition,
    Op,
    moveListsElements
} from '../../../data/panes/AdvilOps'
import {
    Pane,
    PaneElementType,
    PaneList,
    PaneElement
} from '../../../data/panes/Advil'

function getElementsIds(pane: Pane) {
    const elements = pane.elements as PaneList[]
    return elements.map((list) => {
        const listElements = list.elements as PaneElement[]
        return [listElements.map((element) => element.id)]
    })
}

describe('AdvilOps', () => {
    let pane: Pane
    let listId: string

    function applyAdvilOp(advilOp: Op) {
        const [op] = advilOp
        pane = json1.type.apply(pane, op)
    }

    function applyJSONOp(op: json1.JSONOp) {
        pane = json1.type.apply(pane, op)
    }

    beforeEach(() => {
        pane = createPane()
        listId = uuid()
        const [op] = addList(pane, [], 0, listId)
        applyJSONOp(op)
    })

    describe('getTextEdits', () => {
        let textId: string
        let createDelta: DeltaStatic
        let createOp: json1.JSONOp
        let editDelta: DeltaStatic
        let editOp: json1.JSONOp

        beforeEach(() => {
            textId = uuid()
            createDelta = new Delta().insert('Hello')
            ;[createOp] = addElementToList(
                pane,
                listId,
                createText(createDelta, textId)
            )
            applyJSONOp(createOp)

            editDelta = new Delta()
                .retain(createDelta.length())
                .insert(' world!')
            ;[editOp] = editText(pane, listId, textId, editDelta)
            applyJSONOp(createOp)
        })

        it('should return text edit from pane text edit op', () => {
            expect(getTextEdits(pane, editOp)).toEqual([
                { id: textId, delta: editDelta }
            ])
        })

        it('should not return text edit from create text op', () => {
            expect(getTextEdits(pane, createOp)).toEqual([])
        })

        it('should not return text edit from create + edit text op', () => {
            const composedOp = json1.type.compose(createOp, editOp)
            expect(getTextEdits(pane, composedOp)).toEqual([])
        })
    })

    describe('getTextOps', () => {
        let textId: string
        let delta: DeltaStatic
        let op: json1.JSONOp

        beforeEach(() => {
            textId = uuid()
            delta = new Delta().insert('Hello')
            ;[op] = addElementToList(pane, listId, createText(delta, textId))
            applyJSONOp(op)
        })

        it('should get insert text op for new pane text', () => {
            const callbackSpy = jest.fn()
            getTextOps(op, callbackSpy)
            expect(callbackSpy).toHaveBeenCalledWith(
                ['elements', 0, 'elements', 0],
                {
                    i: {
                        id: textId,
                        type: PaneElementType.TEXT,
                        value: delta
                    }
                }
            )
        })

        it('should get edit text op for pane text edit', () => {
            const editDelta = new Delta()
                .retain(delta.length())
                .insert(' world!')
            const [op2] = editText(pane, listId, textId, editDelta)

            const callbackSpy = jest.fn()

            getTextOps(op2, callbackSpy)
            expect(callbackSpy).toHaveBeenCalledWith(
                ['elements', 0, 'elements', 0, 'value'],
                {
                    e: editDelta,
                    et: 'rich-text'
                }
            )
        })

        it('should get ops from composed op', () => {
            const editDelta = new Delta()
                .retain(delta.length())
                .insert(' world!')
            const [op2] = editText(pane, listId, textId, editDelta)
            applyJSONOp(op2)

            const callbackSpy = jest.fn()

            let composedOp = json1.type.compose(op, op2)

            getTextOps(composedOp, callbackSpy)
            expect(callbackSpy).toHaveBeenNthCalledWith(
                1,
                ['elements', 0, 'elements', 0],
                {
                    i: {
                        id: textId,
                        type: PaneElementType.TEXT,
                        value: delta
                    }
                }
            )
            expect(callbackSpy).toHaveBeenNthCalledWith(
                2,
                ['elements', 0, 'elements', 0, 'value'],
                {
                    e: editDelta,
                    et: 'rich-text'
                }
            )

            const [op3] = addList(pane)
            composedOp = json1.type.compose(composedOp, op3)

            getTextOps(composedOp, callbackSpy)

            expect(callbackSpy).toHaveBeenNthCalledWith(
                3,
                ['elements', 0, 'elements', 0],
                {
                    i: {
                        id: textId,
                        type: PaneElementType.TEXT,
                        value: delta
                    }
                }
            )
            expect(callbackSpy).toHaveBeenNthCalledWith(
                4,
                ['elements', 0, 'elements', 0, 'value'],
                {
                    e: editDelta,
                    et: 'rich-text'
                }
            )
        })
    })

    describe('moveListsElements', () => {
        it('should move lists elements', () => {
            const list2Id = uuid()
            const list3Id = uuid()
            const listIds = [listId, list2Id, list3Id]
            let index = 0
            applyAdvilOp(addList(pane, [], 0, list2Id))
            applyAdvilOp(addList(pane, [], 0, list3Id))
            for (let i = 0; i < 3; ++i) {
                applyAdvilOp(
                    addElementToListsAtPosition(pane, listIds, 0, () => {
                        index += 1
                        return createText(new Delta(), `${index}`)
                    })
                )
            }

            const initialState = [
                [['9', '6', '3']],
                [['8', '5', '2']],
                [['7', '4', '1']]
            ]

            const moved0to2State = [
                [['6', '3', '9']],
                [['5', '2', '8']],
                [['4', '1', '7']]
            ]

            const moved2to1State = [
                [['9', '3', '6']],
                [['8', '2', '5']],
                [['7', '1', '4']]
            ]

            const moved2to0State = [
                [['6', '9', '3']],
                [['5', '8', '2']],
                [['4', '7', '1']]
            ]

            expect(getElementsIds(pane)).toEqual(initialState)

            const [moveOp, moveInverseOp] = moveListsElements(pane, 0, 2)

            applyJSONOp(moveOp)

            expect(getElementsIds(pane)).toEqual(moved0to2State)

            applyJSONOp(moveInverseOp)

            expect(getElementsIds(pane)).toEqual(initialState)

            applyAdvilOp(moveListsElements(pane, 2, 1))

            expect(getElementsIds(pane)).toEqual(moved2to1State)

            applyAdvilOp(moveListsElements(pane, 2, 0))

            expect(getElementsIds(pane)).toEqual(moved2to0State)
        })
    })
})
