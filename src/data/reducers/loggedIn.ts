import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export default function loggedInReducer(
    state: boolean = true,
    action: AnyAction
) {
    const { type } = action
    switch (type) {
        case TypeKeys.USER_LOGGED_OUT:
            return false
        case TypeKeys.USER_LOGGED_IN:
            return true
        default:
            return state
    }
}
