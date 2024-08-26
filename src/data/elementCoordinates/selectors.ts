import { RootState } from '../reducers'
import { GUTTER_WIDTH, DOCUMENT_WELL_PADDING } from '../../constants/styles'

export function getNavigationHeight(state: RootState) {
    return state.elementCoordinates.navigation.bottom
}

export function getContainerWidth(state: RootState) {
    return (
        state.elementCoordinates.editor.width / 2 -
        GUTTER_WIDTH -
        DOCUMENT_WELL_PADDING * 2
    )
}
