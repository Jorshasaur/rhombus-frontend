import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import { Permissions } from '../../interfaces/permissions'
export interface PermissionsState extends Permissions {
    loaded: boolean
    documentPermissions?: Permissions
}
export const initialState = {
    canEdit: false,
    canComment: false,
    loaded: false
}

export default function currentDocument(
    state: PermissionsState | {} = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_CURRENT_DOCUMENT:
            const { permissions } = data
            return {
                ...state,
                ...permissions,
                loaded: true,
                documentPermissions: permissions
            }
        case TypeKeys.SET_USER_CANNOT_VIEW:
            return {
                ...state,
                canEdit: false,
                canComment: false,
                loaded: true
            }
        case TypeKeys.SET_PERMISSIONS:
            return {
                ...state,
                canEdit: data.canEdit,
                canComment: data.canComment,
                loaded: true
            }
        default:
            return state
    }
}
