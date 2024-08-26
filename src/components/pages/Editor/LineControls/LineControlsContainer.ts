import { connect } from 'react-redux'
import { elementCoordinatesSelectors } from '../../../../data/elementCoordinates'
import { RootState } from '../../../../data/reducers'
import LineControls from './LineControls'

const mapStateToProps = (state: RootState) => ({
    index: state.mouseover.index,
    id: state.mouseover.id,
    blotType: state.mouseover.blotType,
    blotName: state.mouseover.blotName,
    blotData: state.mouseover.blotData,
    top: state.mouseover.top,
    height: state.mouseover.height,
    navigationHeight: state.elementCoordinates.navigation.bottom,
    dragging: state.drag.dragging,
    canEdit: state.permissions.canEdit,
    canComment: state.permissions.canComment,
    containerWidth: elementCoordinatesSelectors.getContainerWidth(state),
    activeEmbed: state.activeEmbed
})

export default connect(mapStateToProps)(LineControls)
