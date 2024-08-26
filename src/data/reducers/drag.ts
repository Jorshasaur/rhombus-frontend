import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export interface DragState {
    dragging: boolean
}

export const initialState = {
    dragging: false
}

export default function drag(
    state: DragState | {} = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_DRAGGING:
            return { dragging: data.dragging }
        default:
            return state
    }
}
