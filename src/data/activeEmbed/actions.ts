import { types } from './types'

export const setActiveEmbed = (id: string | null) => ({
    type: types.SET_ACTIVE_EMBED,
    data: id
})
