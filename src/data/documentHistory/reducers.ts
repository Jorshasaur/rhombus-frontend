import { AnyAction, combineReducers } from 'redux'
import { DocumentHistoryState } from './interfaces'
import { types } from './types'

export const initialState: DocumentHistoryState = {
    showDocumentHistory: false
}

function showDocumentHistory(
    state: DocumentHistoryState['showDocumentHistory'] = initialState.showDocumentHistory,
    action: AnyAction
): boolean {
    const { type } = action
    switch (type) {
        case types.SHOW_DOCUMENT_HISTORY:
            return true
        case types.HIDE_DOCUMENT_HISTORY:
            return false
        default:
            return state
    }
}

export default combineReducers<DocumentHistoryState>({
    showDocumentHistory
})
