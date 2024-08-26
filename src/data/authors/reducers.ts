import { AnyAction } from 'redux'
import { types } from './types'
import { AuthorsState } from './interfaces'

export const initialState = {}

export default function authors(
    state: AuthorsState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case types.SET_AUTHORS:
            return { ...data }
        default:
            return state
    }
}
