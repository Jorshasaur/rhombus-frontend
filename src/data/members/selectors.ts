import { RootState } from '../reducers'
import { find } from 'lodash'
import { createSelector } from 'reselect'
import { Member } from '../../interfaces/member'
import { NavigationMember } from './interfaces'

export const getMembers = (state: RootState): Member[] =>
    state.currentDocument.members

const defaultTeamMembers: Member[] = []

export const getTeamMembers = (state: RootState): Member[] =>
    state.currentDocument.teamMembers || defaultTeamMembers

const getStateUser = (state: RootState) => state.user

export const getUserId = (state: RootState) => state.user.userId

export const getCurrentUser = createSelector(
    getStateUser,
    getMembers,
    (user, documentMembers) =>
        user ? find(documentMembers, { userId: user.userId }) : null
)
const defaultDocumentMembers: NavigationMember[] = []

export const getMembersForNavigation = createSelector(
    getMembers,
    (documentMembers) =>
        documentMembers
            ? documentMembers.map((member: Member, index: number) => ({
                  avatarURL: member.avatarUrl,
                  id: member.userId,
                  index,
                  name: member.name,
                  useAvatarURL: !member.isDefaultAvatar
              }))
            : defaultDocumentMembers
)
