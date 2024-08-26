import { RootState } from '../reducers'

export function getIsArchived(state: RootState) {
    return state.currentDocument.isArchived
}
