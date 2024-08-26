import { RootState } from '../reducers'

export function getDocumentPermissions(state: RootState) {
    return state.permissions.documentPermissions
}
