import { connect, Dispatch } from 'react-redux'
import Placeholder from './Placeholder'
import { RootState } from '../../../../data/reducers'

const mapStateToProps = (state: RootState) => ({
    showFirstLinePlaceholder: state.placeholder.showFirstLinePlaceholder,
    showSecondLinePlaceholder: state.placeholder.showSecondLinePlaceholder,
    firstLineHeight: state.placeholder.firstLineHeight
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(Placeholder)
