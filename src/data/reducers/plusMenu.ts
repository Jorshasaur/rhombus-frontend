import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

const initialState = {
    insertTop: 0,
    showPlusMenu: false
}

export interface PlusMenuState {
    insertTop: number
    showPlusMenu: boolean
}

export default function plusMenuReducer(
    state: PlusMenuState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.OPEN_PLUS_MENU:
            return {
                ...state,
                insertTop: data.insertTop,
                showPlusMenu: true
            }
        case TypeKeys.CLOSE_PLUS_MENU:
            return {
                ...state,
                showPlusMenu: false
            }
        default:
            return state
    }
}
