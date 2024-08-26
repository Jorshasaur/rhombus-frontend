import Fuse from 'fuse.js'
import { find, uniqBy } from 'lodash'
import store from '../../../data/store'
import { Member } from '../../../interfaces/member'
import { Match } from '../../../interfaces/match'

interface SearchResult {
    item: Member
    score: number
    matches: Match
}

export default class MemberSearchManager {
    docMembers: Member[]
    teamMembers: Member[]
    index: Fuse
    constructor() {
        const state = store.getState()
        this.teamMembers = state.currentDocument.teamMembers
        this.docMembers = state.currentDocument.members
        this.updateMembersIndex(this.teamMembers)
        store.subscribe(this.handleMemberUpdate)
    }
    public search = (searchTerm: string) => {
        if (!searchTerm.length) {
            return uniqBy(this.docMembers.concat(this.teamMembers), 'userId')
        }
        return this.index
            .search(searchTerm)
            .map((result: SearchResult) => {
                const docMemberMatch = find(
                    this.docMembers,
                    (docMember: Member) => {
                        return docMember.id === result.item.id
                    }
                )
                const score = docMemberMatch ? result.score * 2 : result.score
                return { ...result.item, score, matches: result.matches }
            })
            .sort((a, b) => {
                return a.score - b.score
            })
    }
    handleMemberUpdate = () => {
        const state = store.getState()
        if (this.teamMembers !== state.currentDocument.teamMembers) {
            this.teamMembers = state.currentDocument.teamMembers
            this.updateMembersIndex(this.teamMembers)
        }
        if (this.docMembers !== state.currentDocument.members) {
            this.docMembers = state.currentDocument.members
        }
    }
    updateMembersIndex = (teamMembers: Member[]) => {
        const options = {
            includeScore: true,
            includeMatches: true,
            threshold: 0.4,
            location: 0,
            distance: 100,
            maxPatternLength: 32,
            minMatchCharLength: 1,
            keys: ['name', 'email']
        }
        this.index = new Fuse(teamMembers, options)
    }
}
