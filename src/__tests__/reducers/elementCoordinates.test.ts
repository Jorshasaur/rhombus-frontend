import elementCoordinates, {
    initialState
} from '../../data/reducers/elementCoordinates'
import { TypeKeys } from '../../data/ActionTypes'

const newElementCoordinates = {
    bottom: 1,
    height: 2,
    left: 3,
    right: 4,
    top: 5,
    width: 6,
    x: 7,
    y: 8
}

describe('currentDocument reducer', () => {
    it('should return the initial state', () => {
        expect(
            elementCoordinates(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })
    it("should set an element's coordinates", () => {
        expect(
            elementCoordinates(undefined, {
                type: TypeKeys.SET_ELEMENT_COORDINATES,
                data: {
                    elementName: 'test',
                    elementCoordinates: newElementCoordinates
                }
            })
        ).toEqual({
            ...initialState,
            test: newElementCoordinates
        })
    })
})
