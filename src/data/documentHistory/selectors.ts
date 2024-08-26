import { RootState } from '../reducers'

function getDocumentHistoryDisplayState(state: RootState) {
    return state.documentHistory.showDocumentHistory
}

export { getDocumentHistoryDisplayState }
