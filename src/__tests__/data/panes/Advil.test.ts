import json1 from 'ot-json1'
import Delta from 'quill-delta'
import { v4 as uuid } from 'uuid'
import Advil, {
    AdvilEvents,
    IPaneElement,
    JSON1Wrapper,
    Pane,
    PaneElement,
    PaneElementType,
    PaneImage,
    PaneList,
    PaneSelect,
    PaneText,
    PaneViewType
} from '../../../data/panes/Advil'
import * as AdvilOps from '../../../data/panes/AdvilOps'
import {
    getElementAt,
    getList,
    getListSelection
} from '../../../data/panes/AdvilSelectors'

jest.mock('../../../helpers/LogHelper', () => {
    return {
        log: jest.fn()
    }
})

describe('Advil', () => {
    let paneId = ''
    let advil: Advil

    beforeEach(() => {
        Advil.prototype.sendOperation = jest.fn()
        paneId = uuid()
        advil = new Advil(paneId)
        advil.initialize({
            id: paneId,
            viewType: PaneViewType.TABLE,
            elements: []
        })
    })

    describe('OT Tests', () => {
        it('should apply a transform with conflicts correctly', () => {
            const firstOperation = new JSON1Wrapper(
                json1.replaceOp(['name'], 'Captain America', 'Thanos')
            )
            const secondOperation = new JSON1Wrapper(
                json1.replaceOp(['name'], 'Captain America', 'Captain Planet')
            )

            const mergeLeft = firstOperation.transform(secondOperation)
            expect(mergeLeft).toEqual({
                ops: ['name', { i: 'Captain Planet', r: true }]
            })

            const mergeRight = firstOperation.transform(secondOperation, false)
            expect(mergeRight).toEqual({ ops: null })

            const mergeFlip = secondOperation.transform(firstOperation)
            expect(mergeFlip).toEqual({
                ops: ['name', { i: 'Thanos', r: true }]
            })

            const mergeRightFlip = secondOperation.transform(
                firstOperation,
                false
            )
            expect(mergeRightFlip).toEqual({ ops: null })
        })
        it('should apply a transform correctly', () => {
            const firstOperation = new JSON1Wrapper(
                json1.replaceOp(
                    ['bottom-tier-avenger'],
                    'Hawkeye',
                    'Anybody Else'
                )
            )
            const secondOperation = new JSON1Wrapper(
                json1.replaceOp(['name'], 'Captain America', 'Thanos')
            )
            const merged = firstOperation.transform(secondOperation, false)
            expect(merged.ops).toEqual(['name', { i: 'Thanos', r: true }])

            const mergeReversed = secondOperation.transform(
                firstOperation,
                false
            )
            expect(mergeReversed.ops).toEqual([
                'bottom-tier-avenger',
                { i: 'Anybody Else', r: true }
            ])
        })
    })

    describe('Lists', () => {
        it('should create a new list correctly', () => {
            advil.createList()
            expect(advil.pane.elements.length).toEqual(1)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    { i: { elements: [], id: expect.any(String) } }
                ]
            })
        })
        it('should create a new list correctly if there are existing lists', () => {
            advil.createList([], 0, 'first-list')
            advil.createList()
            expect(advil.pane.elements.length).toEqual(2)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    1,
                    { i: { elements: [], id: expect.any(String) } }
                ]
            })
        })
        it('should create a new list in the correct position', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            advil.createList([], 0, 'third-list')
            expect(advil.pane.elements.length).toEqual(3)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: ['elements', 0, { i: { elements: [], id: 'third-list' } }]
            })
            expect(advil.pane.elements[0]).toEqual({
                id: 'third-list',
                elements: []
            })
        })
        it('should insert an item into the correct list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            advil.createList([], 2, 'third-list')
            const element = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            advil.addElementToList('second-list', element)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(1)
        })
        it('should insert an item into the correct list at the correct position', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const select1 = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            const select2 = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            const image = {
                type: PaneElementType.IMAGE,
                value: {
                    height: 10,
                    id: '12345',
                    width: 10
                }
            } as PaneImage
            advil.addElementToList('second-list', select1)
            advil.addElementToList('second-list', select2)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(2)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as IPaneElement).type
            ).toEqual(PaneElementType.SELECT)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[1] as IPaneElement).type
            ).toEqual(PaneElementType.SELECT)
            advil.addElementToListAtPosition('second-list', 1, image)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(3)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as IPaneElement).type
            ).toEqual(PaneElementType.SELECT)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[1] as IPaneElement).type
            ).toEqual(PaneElementType.IMAGE)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[2] as IPaneElement).type
            ).toEqual(PaneElementType.SELECT)
        })
        it('should throw an error if a list doesnt exist', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            advil.createList([], 2, 'third-list')
            const errorFunction = () => {
                getListSelection(advil.pane, 'bad-list')
            }
            expect(errorFunction).toThrowError(
                'The requested list bad-list cannot be found.'
            )
        })
        it('should remove a list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            advil.createList([], 2, 'third-list')
            const element = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            advil.addElementToList('second-list', element)
            expect(advil.pane.elements.length).toEqual(3)
            advil.removeList('second-list')
            expect(advil.pane.elements.length).toEqual(2)
        })
        it('should remove an element from a list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            advil.createList([], 2, 'third-list')
            const element = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            advil.addElementToList('second-list', element)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(1)
            advil.removeElementFromList('second-list', 0)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(0)
        })
        it('should move an element in a list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const select = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            const image = {
                type: PaneElementType.IMAGE,
                value: {}
            } as PaneImage
            advil.addElementToList('second-list', select)
            advil.addElementToList('second-list', image)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(2)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).type
            ).toEqual(PaneElementType.SELECT)
            advil.moveElementInList('second-list', 0, 1)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).type
            ).toEqual(PaneElementType.IMAGE)
        })
        it('should move an element from one list to another', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const select = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            const image = {
                type: PaneElementType.IMAGE,
                value: {}
            } as PaneImage
            advil.addElementToList('second-list', select)
            advil.addElementToList('first-list', image)
            expect(
                (advil.pane.elements[0] as PaneList).elements.length
            ).toEqual(1)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(1)
            advil.moveElementThroughLists('first-list', 0, 'second-list', 0)
            expect(
                (advil.pane.elements[0] as PaneList).elements.length
            ).toEqual(0)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(2)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).type
            ).toEqual(PaneElementType.IMAGE)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[1] as PaneElement).type
            ).toEqual(PaneElementType.SELECT)
        })
        it('should move a list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            advil.createList([], 2, 'third-list')
            expect((advil.pane.elements[0] as PaneList).id).toEqual(
                'first-list'
            )
            advil.moveList('second-list', 0)
            expect((advil.pane.elements[0] as PaneList).id).toEqual(
                'second-list'
            )
        })
        it('should replace an element in a list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const select = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            const image = {
                type: PaneElementType.IMAGE,
                value: {}
            } as PaneImage
            advil.addElementToList('second-list', select)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(1)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).type
            ).toEqual(PaneElementType.SELECT)
            advil.replaceElementAt('second-list', 0, image)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).type
            ).toEqual(PaneElementType.IMAGE)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    1,
                    'elements',
                    0,
                    {
                        r: true,
                        i: { type: 'image', value: {} }
                    }
                ]
            })
        })
        it('should replace an element property in a list', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const select = {
                type: PaneElementType.SELECT,
                value: 'false'
            } as PaneSelect
            advil.addElementToList('second-list', select)
            expect(
                (advil.pane.elements[1] as PaneList).elements.length
            ).toEqual(1)
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).value
            ).toEqual('false')
            advil.replaceElementPropertyAt('second-list', 0, ['value'], 'true')
            expect(
                ((advil.pane.elements[1] as PaneList)
                    .elements[0] as PaneElement).value
            ).toEqual('true')
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    1,
                    'elements',
                    0,
                    'value',
                    { i: 'true', r: true }
                ]
            })
        })
    })
    describe('Incoming and Outgoing Operations', () => {
        it('should receive and apply an operation correctly', () => {
            const op = [
                'elements',
                {
                    i: [
                        {
                            type: 'image',
                            value: { height: 999, id: '1234', width: 989 }
                        }
                    ],
                    r: ['elements']
                }
            ]
            const wrapper = new JSON1Wrapper(op)
            advil.applyOperation(wrapper)
            expect(advil.pane.elements.length).toEqual(1)
            expect(advil.pane.elements[0]).toEqual({
                type: 'image',
                value: {
                    height: 999,
                    id: '1234',
                    width: 989
                }
            })
        })
        it('should send an operation correctly', () => {
            advil.createList()
            expect(advil.sendOperation).toHaveBeenCalledTimes(1)
        })
    })
    describe('Images', () => {
        it('should create the correct op for adding an image', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 100, 200)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    'elements',
                    0,
                    {
                        i: {
                            type: 'image',
                            id: expect.any(String),
                            value: {
                                height: 100,
                                id: expect.any(String),
                                width: 200
                            }
                        }
                    }
                ]
            })
        })
        it('should insert an image correctly', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 100, 200)
            expect(advil.pane).toEqual({
                id: paneId,
                viewType: PaneViewType.TABLE,
                elements: [
                    {
                        id: 'first-list',
                        elements: [
                            {
                                type: 'image',
                                id: expect.any(String),
                                value: {
                                    height: 100,
                                    id: expect.any(String),
                                    width: 200
                                }
                            }
                        ]
                    }
                ]
            })
        })
        it('should insert an image correctly with other images added already', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 100, 200)
            advil.addImage('first-list', 500, 500)
            expect(advil.pane).toEqual({
                id: paneId,
                viewType: PaneViewType.TABLE,
                elements: [
                    {
                        id: 'first-list',
                        elements: [
                            {
                                type: 'image',
                                id: expect.any(String),
                                value: {
                                    height: 100,
                                    id: expect.any(String),
                                    width: 200
                                }
                            },
                            {
                                type: 'image',
                                id: expect.any(String),
                                value: {
                                    height: 500,
                                    id: expect.any(String),
                                    width: 500
                                }
                            }
                        ]
                    }
                ]
            })
        })
        it('should remove an image correctly', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 100, 200)
            advil.addImage('first-list', 500, 500)
            expect(
                (advil.pane.elements[0] as PaneList).elements.length
            ).toEqual(2)
            advil.removeElementFromList('first-list', 1)
            expect(
                (advil.pane.elements[0] as PaneList).elements.length
            ).toEqual(1)
            expect(advil.pane).toEqual({
                id: paneId,
                viewType: PaneViewType.TABLE,
                elements: [
                    {
                        id: 'first-list',
                        elements: [
                            {
                                type: 'image',
                                id: expect.any(String),
                                value: {
                                    height: 100,
                                    id: expect.any(String),
                                    width: 200
                                }
                            }
                        ]
                    }
                ]
            })
        })
        it('should replace an existing image correctly', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 100, 200)
            advil.addImage('first-list', 500, 500)
            const newImage = {
                type: PaneElementType.IMAGE,
                value: {
                    height: 10,
                    id: '12345',
                    width: 10
                }
            } as PaneImage
            advil.replaceElementAt('first-list', 0, newImage)
            expect(
                (advil.pane.elements[0] as PaneList).elements.length
            ).toEqual(2)
            expect(
                ((advil.pane.elements[0] as PaneList).elements[0] as PaneImage)
                    .value.height
            ).toEqual(10)
            expect(
                ((advil.pane.elements[0] as PaneList).elements[0] as PaneImage)
                    .value.width
            ).toEqual(10)
            expect(
                ((advil.pane.elements[0] as PaneList).elements[0] as PaneImage)
                    .value.id
            ).toEqual('12345')
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    'elements',
                    0,
                    {
                        i: {
                            type: 'image',
                            value: { height: 10, id: '12345', width: 10 }
                        },
                        r: true
                    }
                ]
            })
        })
        it('should replace an existing image property correctly', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 100, 200)
            advil.addImage('first-list', 500, 500)
            advil.replaceElementPropertyAt(
                'first-list',
                1,
                ['value', 'width'],
                555
            )
            expect(
                (advil.pane.elements[0] as PaneList).elements.length
            ).toEqual(2)
            expect(
                ((advil.pane.elements[0] as PaneList).elements[1] as PaneImage)
                    .value.height
            ).toEqual(500)
            expect(
                ((advil.pane.elements[0] as PaneList).elements[1] as PaneImage)
                    .value.width
            ).toEqual(555)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    'elements',
                    1,
                    'value',
                    'width',
                    {
                        i: 555,
                        r: true
                    }
                ]
            })
        })
    })
    describe('Text', () => {
        it('should create the correct op for adding new text', () => {
            advil.createList([], 0, 'first-list')
            advil.addText('first-list', new Delta([{ insert: 'hello world' }]))
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    'elements',
                    0,
                    {
                        i: {
                            type: 'text',
                            id: expect.any(String),
                            value: { ops: [{ insert: 'hello world' }] }
                        }
                    }
                ]
            })
        })
        it('should create the correct state for adding text to existing text', () => {
            advil.createList([], 0, 'first-list')
            const textElement = AdvilOps.createText(
                new Delta([
                    { insert: 'Gandalf' },
                    { insert: ' the ' },
                    { insert: 'Grey' }
                ])
            )
            advil.addElementToList('first-list', textElement)
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    'elements',
                    0,
                    {
                        i: {
                            type: 'text',
                            id: expect.any(String),
                            value: {
                                ops: [
                                    { insert: 'Gandalf' },
                                    { insert: ' the ' },
                                    { insert: 'Grey' }
                                ]
                            }
                        }
                    }
                ]
            })
            advil.editText(
                'first-list',
                textElement.id,
                new Delta()
                    .retain(12)
                    .delete(4)
                    .insert('White')
            )
            expect(advil.sendOperation).toHaveBeenCalledWith({
                inverse: expect.anything(),
                ops: [
                    'elements',
                    0,
                    'elements',
                    0,
                    'value',
                    {
                        e: {
                            ops: [
                                { retain: 12 },
                                { insert: 'White' },
                                { delete: 4 }
                            ]
                        },
                        et: 'rich-text'
                    }
                ]
            })
            expect(
                ((advil.pane.elements[0] as PaneList).elements[0] as PaneText)
                    .value
            ).toEqual({
                ops: [{ insert: 'Gandalf' }, { insert: ' the White' }]
            })
        })
        it('should output a delta from json1', () => {
            advil.createList([], 0, 'first-list')
            const textElement = AdvilOps.createText(
                new Delta([{ insert: 'Gandalf the Grey' }])
            )

            advil.addElementToList('first-list', textElement)
            advil.editText(
                'first-list',
                textElement.id,
                new Delta()
                    .retain(12)
                    .delete(4)
                    .insert('White')
            )
            expect(
                ((advil.pane.elements[0] as PaneList).elements[0] as PaneText)
                    .value
            ).toEqual({
                ops: [
                    {
                        insert: 'Gandalf the White'
                    }
                ]
            })
        })
        it('should merge incoming deltas correctly', () => {
            const deltaOp = new Delta()
                .retain(12)
                .delete(4)
                .insert('White')
            const op = [
                'elements',
                0,
                'elements',
                0,
                'value',
                { et: 'rich-text', e: deltaOp }
            ]
            const wrapper = new JSON1Wrapper(op)
            advil.createList([], 0, 'first-list')
            advil.addText(
                'first-list',
                new Delta([{ insert: 'Gandalf the Grey' }])
            )
            advil.applyOperation(wrapper)
            expect(
                ((advil.pane.elements[0] as PaneList).elements[0] as PaneText)
                    .value
            ).toEqual({
                ops: [
                    {
                        insert: 'Gandalf the White'
                    }
                ]
            })
        })
    })
    describe('Reverts', () => {
        it('should create an inverse for createList', () => {
            const [op, inverseOp] = AdvilOps.addList(
                advil.pane,
                [],
                0,
                'first-list'
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(advil.pane.elements).toHaveLength(1)
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(undo.elements).toHaveLength(0)
        })

        it('should create an invert for removeList', () => {
            advil.createList([], 0, 'first-list')
            advil.addImage('first-list', 300, 300)
            const pane = {
                elements: [
                    {
                        elements: [
                            {
                                type: 'image',
                                id: expect.any(String),
                                value: {
                                    height: 300,
                                    id: expect.any(String),
                                    width: 300
                                }
                            }
                        ],
                        id: 'first-list'
                    }
                ],
                id: expect.any(String),
                viewType: 'table'
            }
            expect(advil.pane).toEqual(pane)
            const [op, inverseOp] = AdvilOps.removeList(
                advil.pane,
                'first-list'
            )
            advil.pane = json1.type.apply(advil.pane, op)

            expect(advil.pane).toEqual({
                elements: [],
                id: expect.any(String),
                viewType: 'table'
            })
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(undo).toEqual(pane)
        })

        it('should create an invert for moveList', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const pane = {
                elements: [
                    {
                        elements: [],
                        id: 'first-list'
                    },
                    {
                        elements: [],
                        id: 'second-list'
                    }
                ],
                id: expect.any(String),
                viewType: 'table'
            }
            expect(advil.pane).toEqual(pane)
            const [op, inverseOp] = AdvilOps.moveList(
                advil.pane,
                'first-list',
                1
            )
            advil.pane = json1.type.apply(advil.pane, op)

            expect(advil.pane.elements).toEqual([
                {
                    elements: [],
                    id: 'second-list'
                },
                {
                    elements: [],
                    id: 'first-list'
                }
            ])
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(undo).toEqual(pane)
        })

        it('should create an invert for addElementToListAtPosition', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const image = {
                type: PaneElementType.IMAGE,
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneElement
            const [op, inverseOp] = AdvilOps.addElementToListAtPosition(
                advil.pane,
                'first-list',
                0,
                image
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(image)
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getList(undo, 'first-list').elements).toHaveLength(0)
        })

        it('should create an invert for addElementToList', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const image = {
                type: PaneElementType.IMAGE,
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneElement
            const [op, inverseOp] = AdvilOps.addElementToList(
                advil.pane,
                'first-list',
                image
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(image)
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getList(undo, 'first-list').elements).toHaveLength(0)
        })

        it('should create an invert for removeElementFromList', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const image = {
                type: PaneElementType.IMAGE,
                id: 'image-id',
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneElement
            advil.addElementToList('first-list', image)
            expect((advil.pane.elements[0] as PaneList).elements[0]).toEqual(
                image
            )
            const [op, inverseOp] = AdvilOps.removeElementFromList(
                advil.pane,
                'first-list',
                0
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getList(advil.pane, 'first-list').elements).toHaveLength(0)

            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getList(undo, 'first-list').elements).toHaveLength(1)
            expect(getElementAt(undo, 'first-list', 0)).toEqual(image)
        })

        it('should create an invert for moveElementThroughLists', () => {
            advil.createList([], 0, 'first-list')
            advil.createList([], 1, 'second-list')
            const image = {
                type: PaneElementType.IMAGE,
                id: 'image-id',
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneElement
            advil.addElementToList('first-list', image)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(image)

            const [op, inverseOp] = AdvilOps.moveElementThroughLists(
                advil.pane,
                'first-list',
                0,
                'second-list',
                0
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'second-list', 0)).toEqual(image)

            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getElementAt(undo, 'first-list', 0)).toEqual(image)
            expect(getList(undo, 'second-list').elements).toHaveLength(0)
        })

        it('should create an invert for moveElementInList', () => {
            advil.createList([], 0, 'first-list')
            const image = {
                type: PaneElementType.IMAGE,
                id: 'image-id',
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneElement
            advil.addElementToList('first-list', image)
            advil.addText('first-list', new Delta().insert('Hello World'))
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(image)
            const [op, inverseOp] = AdvilOps.moveElementThroughLists(
                advil.pane,
                'first-list',
                0,
                'first-list',
                1
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'first-list', 1)).toEqual(image)

            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getElementAt(undo, 'first-list', 0)).toEqual(image)
        })

        it('should create an invert for replaceElementAt', () => {
            advil.createList([], 0, 'first-list')
            const image = {
                type: PaneElementType.IMAGE,
                id: 'image-id',
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneElement
            const text = {
                value: new Delta().insert('Hello world'),
                type: PaneElementType.TEXT
            } as PaneElement
            advil.addElementToList('first-list', image)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(image)
            const [op, inverseOp] = AdvilOps.replaceElementAt(
                advil.pane,
                'first-list',
                0,
                text
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(text)

            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getElementAt(undo, 'first-list', 0)).toEqual(image)
        })

        it('should create an invert for replaceElementPropertyAt', () => {
            advil.createList([], 0, 'first-list')
            const image = {
                type: PaneElementType.IMAGE,
                id: expect.any(String),
                value: {
                    width: 333,
                    height: 555,
                    id: uuid()
                }
            } as PaneImage
            advil.addElementToList('first-list', image)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual(image)
            const [op, inverseOp] = AdvilOps.replaceElementPropertyAt(
                advil.pane,
                'first-list',
                0,
                ['value', 'width'],
                900
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual({
                type: PaneElementType.IMAGE,
                id: expect.any(String),
                value: {
                    width: 900,
                    height: 555,
                    id: image.value.id
                }
            })

            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getElementAt(undo, 'first-list', 0)).toEqual(image)
        })

        it('should create an invert for addImage', () => {
            advil.createList([], 0, 'first-list')
            const [op, inverseOp] = AdvilOps.addImage(
                advil.pane,
                'first-list',
                999,
                999
            )
            advil.pane = json1.type.apply(advil.pane, op)

            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual({
                type: PaneElementType.IMAGE,
                id: expect.any(String),
                value: {
                    width: 999,
                    height: 999,
                    id: expect.any(String)
                }
            })
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getList(undo, 'first-list').elements).toHaveLength(0)
        })

        it('should create an invert for addText', () => {
            advil.createList([], 0, 'first-list')
            const [op, inverseOp] = AdvilOps.addText(
                advil.pane,
                'first-list',
                new Delta().insert('hello world!')
            )
            advil.pane = json1.type.apply(advil.pane, op)

            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual({
                type: PaneElementType.TEXT,
                id: expect.any(String),
                value: new Delta({ ops: [{ insert: 'hello world!' }] })
            })
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getList(undo, 'first-list').elements).toHaveLength(0)
        })

        it('should create an invert for editText', () => {
            advil.createList([], 0, 'first-list')
            const textElement = AdvilOps.createText(
                new Delta().insert('Hello world!')
            )
            advil.addElementToList('first-list', textElement)
            const [op, inverseOp] = AdvilOps.editText(
                advil.pane,
                'first-list',
                textElement.id,
                new Delta().insert('This is a test!  ')
            )
            advil.pane = json1.type.apply(advil.pane, op)
            expect(getElementAt(advil.pane, 'first-list', 0)).toEqual({
                type: PaneElementType.TEXT,
                id: expect.any(String),
                value: new Delta({
                    ops: [{ insert: 'This is a test!  Hello world!' }]
                })
            })
            const undo = json1.type.apply(advil.pane, inverseOp) as Pane
            expect(getElementAt(undo, 'first-list', 0)).toEqual({
                type: PaneElementType.TEXT,
                id: expect.any(String),
                value: new Delta({ ops: [{ insert: 'Hello world!' }] })
            })
        })

        it('should remove listeners on disconnect', () => {
            let hasEvent = false
            advil.on(AdvilEvents.UPDATE, () => {
                hasEvent = true
            })
            const wrapper = new JSON1Wrapper([
                'elements',
                0,
                { i: { id: 'first-list', elements: [] } }
            ])
            advil.applyOperation(wrapper)
            expect(hasEvent).toBeTruthy()
            hasEvent = false
            advil.disconnect()
            advil.applyOperation(wrapper)
            expect(hasEvent).toBeFalsy()
        })
    })
})
