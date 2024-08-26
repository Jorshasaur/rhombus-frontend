import permissions, { initialState } from '../../data/reducers/permissions'
import { TypeKeys } from '../../data/ActionTypes'

const permissionsData = {
    canEdit: true,
    canComment: false
}

describe('Permissions reducer', () => {
    it('should return the initial state', () => {
        expect(
            permissions(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })

    it('should set the document permissions', () => {
        expect(
            permissions(initialState, {
                type: TypeKeys.SET_CURRENT_DOCUMENT,
                data: { permissions: permissionsData }
            })
        ).toEqual({
            ...permissionsData,
            loaded: true,
            documentPermissions: permissionsData
        })
    })

    it('should set permissions', () => {
        expect(
            permissions(initialState, {
                type: TypeKeys.SET_PERMISSIONS,
                data: { canEdit: false, canComment: true }
            })
        ).toEqual({
            canEdit: false,
            canComment: true,
            loaded: true
        })
    })
})
