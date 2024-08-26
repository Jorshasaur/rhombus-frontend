import { find, get } from 'lodash'
import { createSelector } from 'reselect'
import { RootState } from '../reducers'

const authorsSelector = (state: RootState) => state.authors
const membersSelector = (state: RootState) => state.currentDocument.members

export const getAuthors = createSelector(
    authorsSelector,
    membersSelector,
    (authors, members) =>
        Object.keys(authors).map((key) => {
            const memberMatch = find(members, (member) => {
                return member.userId === +authors[key].authorId
            })
            const author = authors[key]
            return {
                ...memberMatch,
                lineHeight: author.lineHeight,
                top: author.top,
                textLength: author.textLength,
                authorId: author.authorId
            }
        })
)

export const getAuthor = (state: RootState, id: string) => {
    const author = find(membersSelector(state), { userId: Number(id) })

    return get(author, 'name', '')
}
