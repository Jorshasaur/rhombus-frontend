import { connect, Dispatch } from 'react-redux'
import FloatingToolbar from './FloatingToolbar'
import { RootState } from '../../../../data/reducers'
import { elementCoordinatesSelectors } from '../../../../data/elementCoordinates'
const mapStateToProps = (state: RootState) => ({
    selection: state.selection,
    navigationHeight: elementCoordinatesSelectors.getNavigationHeight(state)
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(FloatingToolbar)
