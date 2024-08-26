import { RootState } from '../reducers'

export function getSelectedIndex(state: RootState) {
    return state.selection.index
}
