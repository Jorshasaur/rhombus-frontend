import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export interface FeatureFlags {
    darkMode: boolean
    documentHistory: boolean
    nightly: boolean
    panes: boolean
}

export const initialState = {
    darkMode: false,
    documentHistory: false,
    nightly: false,
    panes: false
}

export default function featureFlags(
    state: FeatureFlags = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_FEATURE_FLAGS:
            return data
        default:
            return state
    }
}
