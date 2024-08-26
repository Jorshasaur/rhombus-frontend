import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export default function archivedDocumentReducer(
    state: boolean = false,
    action: AnyAction
) {
    const { type } = action
    switch (type) {
        case TypeKeys.SET_ARCHIVED_DOCUMENT:
            return true
        default:
            return state
    }
}
