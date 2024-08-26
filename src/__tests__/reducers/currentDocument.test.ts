import currentDocument, {
    initialState
} from '../../data/reducers/currentDocument'
import { TypeKeys } from '../../data/ActionTypes'

const documentState = {
    archivedAt: new Date('2015-03-25'),
    createdAt: new Date('2015-03-25'),
    id: 'documentId',
    isArchived: false,
    ownerId: 'ownerId',
    teamId: 'teamId',
    title: 'title',
    updatedAt: new Date('2015-03-25'),
    teamMembers: [],
    isSubscribed: true
}

const members = [
    {
        id: 123,
        userId: 546,
        teamId: 789,
        name: 'Pages User',
        email: 'pages.user@invisionapp.com',
        avatarId: 'pagesUserAvatar',
        avatarUrl: 'pagesUserAvatar.png',
        lastViewed: new Date('2015-03-25')
    }
]

describe('currentDocument reducer', () => {
    it('should return the initial state', () => {
        expect(
            currentDocument(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })

    it('should set the current document', () => {
        expect(
            currentDocument(documentState, {
                type: TypeKeys.SET_CURRENT_DOCUMENT,
                data: { document: documentState, isSubscribed: true }
            })
        ).toEqual(documentState)
    })
    it('should set the members for the document', () => {
        expect(
            currentDocument(documentState, {
                type: TypeKeys.SET_MEMBERS,
                data: {
                    members
                }
            })
        ).toEqual({
            ...documentState,
            members
        })
    })
    it('should set the team members for the document', () => {
        expect(
            currentDocument(documentState, {
                type: TypeKeys.SET_TEAM_MEMBERS,
                data: {
                    teamMembers: members
                }
            })
        ).toEqual({
            ...documentState,
            teamMembers: members
        })
    })
    it('should set the document as updating', () => {
        expect(
            currentDocument(documentState, {
                type: TypeKeys.SET_DOCUMENT_UPDATING,
                data: {
                    isUpdating: true
                }
            })
        ).toEqual({
            ...documentState,
            updating: true
        })
    })

    it('should set the document isSubscribed', () => {
        expect(
            currentDocument(documentState, {
                type: TypeKeys.SET_DOCUMENT_IS_SUBSCRIBED,
                data: {
                    isSubscribed: false
                }
            })
        ).toEqual({
            ...documentState,
            isSubscribed: false
        })
    })
})
