import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export default function titleReducer(state: string = '', action: AnyAction) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_TITLE:
            return data.title
        case TypeKeys.SET_CURRENT_DOCUMENT:
            return data.document.title || state
        default:
            return state
    }
}
