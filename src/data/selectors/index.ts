import { RootState } from '../reducers'

export function isFirstLine(state: RootState) {
    return state.selection.isFirstLine
}

export default {
    isFirstLine
}
