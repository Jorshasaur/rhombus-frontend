import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import { User } from '../../interfaces/user'

export interface UserState extends User {}

export const initialState = {}

export default function userReducer(
    state: UserState | {} = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_USER:
            return { ...state, ...data.user }
        default:
            return state
    }
}
