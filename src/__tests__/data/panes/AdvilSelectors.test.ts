import uuid from 'uuid'
import Delta from 'quill-delta'
import {
    Pane,
    PaneElement,
    PaneText,
    PaneList
} from '../../../data/panes/Advil'
import {
    getListSelection,
    getElementIndex,
    getList,
    getListAt,
    getElementValueAtPath,
    getElement,
    getElementAt,
    getElementIdAt,
    getTextValueAt,
    getTextValue,
    getValueAtPath
} from '../../../data/panes/AdvilSelectors'
import {
    createText,
    createPane,
    createList
} from '../../../data/panes/AdvilOps'

describe('AdvilSelectors', () => {
    let pane: Pane
    let paneId: string
    let listId: string
    let textId: string
    let text: PaneText
    let list: PaneList

    beforeEach(() => {
        paneId = uuid()
        listId = uuid()
        textId = uuid()
        text = createText(new Delta().insert('Hello'), textId)
        list = createList(listId, [text])
        pane = createPane(paneId, [list])
    })

    describe('getListSelection', () => {
        it('should get list index and size', () => {
            expect(getListSelection(pane, listId)).toEqual({
                index: 0,
                size: 1
            })
        })

        it('should throw an error if a list doesnt exist', () => {
            const errorFunction = () => {
                getListSelection(pane, 'bad-list')
            }
            expect(errorFunction).toThrowError(
                'The requested list bad-list cannot be found.'
            )
        })
    })

    describe('getElementIndex', () => {
        it('should get element index', () => {
            const list = getList(pane, listId)
            expect(getElementIndex(list, textId)).toEqual(0)
        })

        it('should throw an error if a element doesnt exist', () => {
            const list = getList(pane, listId)

            const errorFunction = () => {
                getElementIndex(list, 'bad-element')
            }
            expect(errorFunction).toThrowError(
                'The requested element id(bad-element) cannot be found.'
            )
        })
    })

    describe('getElementValueAtPath', () => {
        it('returns element value at path', () => {
            const element = getElement(pane, listId, textId) as PaneElement
            expect(getElementValueAtPath(element, ['id'])).toEqual(textId)
        })
    })

    describe('getElementAt', () => {
        it('returns element at given index', () => {
            expect(getElementAt(pane, listId, 0)).toEqual(text)
        })
    })

    describe('getElement', () => {
        it('returns element by id', () => {
            expect(getElement(pane, listId, textId)).toEqual(text)
        })
    })

    describe('getListAt', () => {
        it('returns list at given index', () => {
            expect(getListAt(pane, 0)).toEqual(list)
        })
    })

    describe('getList', () => {
        it('returns list by id', () => {
            expect(getList(pane, listId)).toEqual(list)
        })
    })

    describe('getTextValueAt', () => {
        it('returns text value at given index', () => {
            expect(getTextValueAt(pane, listId, 0)).toEqual(text.value)
        })
    })

    describe('getTextValue', () => {
        it('returns text value by id', () => {
            expect(getTextValue(pane, listId, textId)).toEqual(text.value)
        })
    })

    describe('getElementIdAt', () => {
        it('returns element id at given index', () => {
            expect(getElementIdAt(pane, listId, 0)).toEqual(text.id)
        })
    })

    describe('getValueAtPath', () => {
        it('returns value at given path', () => {
            expect(
                getValueAtPath(pane, ['elements', 0, 'elements', 0, 'id'])
            ).toEqual(text.id)
        })
    })
})
