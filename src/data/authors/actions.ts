import { Author } from '../../interfaces/author'

import { types } from './types'

export const setAuthors = (authors: Author[]) => ({
    type: types.SET_AUTHORS,
    data: {
        ...authors
    }
})
