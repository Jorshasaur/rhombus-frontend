import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import { types } from './types'

export const initialState = null

export default function activeEmbed(
    state: string | null = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.CLEAR_SELECTION:
            return initialState
        case TypeKeys.SELECTION_CHANGED:
            return data.activeEmbed
        case types.SET_ACTIVE_EMBED:
            return data
        default:
            return state
    }
}
