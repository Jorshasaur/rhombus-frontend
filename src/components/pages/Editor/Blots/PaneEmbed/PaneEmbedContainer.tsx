import { connect, Dispatch } from 'react-redux'
import { RootState } from '../../../../../data/reducers'
import { PaneEmbed } from './PaneEmbed'

const mapStateToProps = (state: RootState) => ({
    activeEmbed: state.activeEmbed
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({})

export default connect(mapStateToProps, mapDispatchToProps)(PaneEmbed)
