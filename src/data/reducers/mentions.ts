import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import { Member } from '../../interfaces/member'

export interface MentionsState {
    initialIndex?: number
    currentIndex?: number
    left: number
    selectedMemberIndex?: number
    showMentionsList: boolean
    type?: string
    editorId?: string
    top: number
    mentionText?: string
    members: Member[]
}

export const initialState = {
    left: 0,
    members: [],
    showMentionsList: false,
    top: 0
}

export default function mentions(
    state: MentionsState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.CLEAR_MENTION_LIST:
            return initialState
        case TypeKeys.SET_MENTION_MEMBERS:
            return { ...state, members: data.members }
        case TypeKeys.SET_MENTION_LIST:
            return { ...state, ...data }
        case TypeKeys.SET_SELECTED_MEMBER_INDEX:
            return { ...state, selectedMemberIndex: data.selectedMemberIndex }
        default:
            return state
    }
}
