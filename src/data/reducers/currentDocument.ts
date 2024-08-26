import { AnyAction } from 'redux'
import { DocumentContents } from '../../interfaces/documentContents'
import { Member } from '../../interfaces/member'
import { TypeKeys } from '../ActionTypes'

export interface CurrentDocumentState {
    archivedAt?: Date
    createdAt: Date
    id: string
    isArchived: boolean
    ownerId: number
    teamId: string
    title: string
    updatedAt: Date
    members: Member[]
    contents: DocumentContents
    teamMembers: Member[]
    updating: boolean
    isSubscribed: boolean
}

export const initialState = {
    members: [],
    teamMembers: [],
    updating: false
}

export default function currentDocument(
    state: CurrentDocumentState | {} = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_CURRENT_DOCUMENT:
            const { document, contents, members, isSubscribed } = data
            return { ...state, ...document, contents, members, isSubscribed }
        case TypeKeys.SET_TEAM_MEMBERS:
            return { ...state, teamMembers: data.teamMembers }
        case TypeKeys.SET_MEMBERS:
            return { ...state, members: data.members }
        case TypeKeys.SET_DOCUMENT_UPDATING:
            return { ...state, updating: data.isUpdating }
        case TypeKeys.SET_DOCUMENT_IS_SUBSCRIBED:
            return { ...state, isSubscribed: data.isSubscribed }
        default:
            return state
    }
}
