import authors from '../../data/authors'
import { initialState } from '../../data/authors/reducers'
import { types } from '../../data/authors/types'

const newAuthors = {
    0: {
        authorId: '1',
        textLength: 1,
        top: 1
    },
    1: {
        authorId: '2',
        textLength: 2,
        top: 2
    }
}

const authorsArray = [
    {
        authorId: '1',
        textLength: 1,
        top: 1
    },
    {
        authorId: '2',
        textLength: 2,
        top: 2
    }
]

describe('authors reducer', () => {
    it('should return the initial state', () => {
        expect(
            authors(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })
    it('should set a documents authors', () => {
        expect(
            authors(undefined, {
                type: types.SET_AUTHORS,
                data: {
                    ...authorsArray
                }
            })
        ).toEqual({
            ...newAuthors
        })
    })
})
