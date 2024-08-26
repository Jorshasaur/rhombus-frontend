import { RootState } from '../reducers'
import { SelectionType } from '../../interfaces/selectionType'

export function getIndex(state: RootState) {
    return state.mouseover.index
}

export function getType(state: RootState) {
    return state.mouseover.blotType
}

export function isEmbed(state: RootState) {
    return state.mouseover.blotType === SelectionType.Embed
}
