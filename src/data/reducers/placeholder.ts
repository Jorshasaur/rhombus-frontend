import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export interface PlaceholderState {
    showFirstLinePlaceholder: boolean
    showSecondLinePlaceholder: boolean
    firstLineHeight: number
}

export default function placeholderReducer(
    state: PlaceholderState | {} = {},
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.CHANGE_PLACEHOLDER:
            return {
                ...state,
                showFirstLinePlaceholder: data.showFirstLinePlaceholder,
                showSecondLinePlaceholder: data.showSecondLinePlaceholder,
                firstLineHeight: data.firstLineHeight
            }
        default:
            return state
    }
}
