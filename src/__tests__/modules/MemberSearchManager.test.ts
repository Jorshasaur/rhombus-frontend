import MemberSearchManager from '../../components/pages/Editor/MemberSearchManager'
import store from '../../data/store'
import { members } from '../mockData/members'
import { teamMembers } from '../mockData/teamMembers'

beforeEach(() => {
    store.subscribe = jest.fn()
    store.getState = jest.fn(() => {
        return {
            currentDocument: {
                members,
                teamMembers
            }
        }
    })
})
describe('MemberSearchManager', () => {
    it('should initialize with state', () => {
        const memberSearchManager = new MemberSearchManager()
        expect(memberSearchManager.docMembers).toEqual(members)
        expect(memberSearchManager.teamMembers).toEqual(teamMembers)
    })
    it('should search', () => {
        const memberSearchManager = new MemberSearchManager()
        const searchResult = memberSearchManager.search('User')
        expect(searchResult).toHaveLength(4)
    })
    it('should find nothing on an invalid search', () => {
        const memberSearchManager = new MemberSearchManager()
        const searchResult = memberSearchManager.search('Elton John')
        expect(searchResult).toHaveLength(0)
    })
    it('should handle member updates', () => {
        store.getState = jest.fn(() => {
            return {
                currentDocument: {
                    members: [],
                    teamMembers: []
                }
            }
        })
        const memberSearchManager = new MemberSearchManager()
        memberSearchManager.handleMemberUpdate()
        expect(memberSearchManager.docMembers).toEqual([])
        expect(memberSearchManager.teamMembers).toEqual([])
    })
})
