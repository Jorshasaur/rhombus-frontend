import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export default function updatedAtReducer(
    state: Date | null = null,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_UPDATED_AT:
            return data.updatedAt
        case TypeKeys.SET_CURRENT_DOCUMENT:
            return new Date(data.document.updatedAt)
        default:
            return state
    }
}
