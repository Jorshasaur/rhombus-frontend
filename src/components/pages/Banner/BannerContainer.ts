import { connect, Dispatch } from 'react-redux'
import Banner from './Banner'
import { RootState } from '../../../data/reducers'
import { hideBanner } from '../../../data/actions'

const mapStateToProps = (state: RootState) => ({
    banner: state.banner,
    navigationHeight: state.elementCoordinates.navigation.bottom
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({
    hideBanner: () => dispatch(hideBanner())
})

export default connect(mapStateToProps, mapDispatchToProps)(Banner)
