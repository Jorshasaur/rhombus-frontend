import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import { ElementCoordinates } from '../../interfaces/elementCoordinates'
export interface ElementCoordinatesState {
    [key: string]: ElementCoordinates
}

const defaultElementCoordinates = {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0
}

export const initialState = {
    editor: {
        ...defaultElementCoordinates
    },
    navigation: {
        ...defaultElementCoordinates
    }
}

export default function elementCoordinates(
    state: ElementCoordinatesState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_ELEMENT_COORDINATES:
            return {
                ...state,
                [data.elementName]: { ...data.elementCoordinates }
            }
        default:
            return state
    }
}
