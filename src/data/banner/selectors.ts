import { RootState } from '../reducers'

export function getType(state: RootState) {
    return state.banner.type
}
