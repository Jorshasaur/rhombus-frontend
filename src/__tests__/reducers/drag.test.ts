import drag, { initialState } from '../../data/reducers/drag'
import { TypeKeys } from '../../data/ActionTypes'

describe('drag reducer', () => {
    it('should return the initial state', () => {
        expect(
            drag(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })

    it('should set dragging', () => {
        const data = {
            dragging: true
        }

        expect(
            drag(undefined, {
                type: TypeKeys.SET_DRAGGING,
                data
            })
        ).toEqual(data)
    })
})
