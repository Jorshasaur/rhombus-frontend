import mouseover from '../../data/reducers/mouseover'
import { TypeKeys } from '../../data/ActionTypes'
import { SelectionType } from '../../interfaces/selectionType'

describe('mouseover reducer', () => {
    it('should return the initial state', () => {
        expect(
            mouseover(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual({})
    })

    it('should set mouseover', () => {
        const data = {
            index: 1,
            blotName: 'block',
            blotType: SelectionType.Text,
            top: 10,
            height: 10
        }

        expect(
            mouseover(undefined, {
                type: TypeKeys.SET_MOUSEOVER,
                data
            })
        ).toEqual(data)
    })

    it('should set index', () => {
        const state = {
            index: 1,
            blotName: 'block',
            blotType: SelectionType.Text,
            top: 10,
            height: 10
        }

        const newIndex = 10

        expect(
            mouseover(state, {
                type: TypeKeys.SET_MOUSEOVER_INDEX,
                data: {
                    index: newIndex
                }
            })
        ).toEqual(Object.assign({}, state, { index: newIndex }))
    })

    it('should hide banner', () => {
        expect(
            mouseover(undefined, {
                type: TypeKeys.RESET_MOUSEOVER,
                data: {}
            })
        ).toEqual({})
    })
})
