import { connect } from 'react-redux'
import { membersSelectors } from '../../../../../data/members'
import { RootState } from '../../../../../data/reducers'
import { Revision } from './Revision'

const mapStateToProps = (state: RootState) => ({
    documentOwnerId: state.currentDocument.ownerId,
    members: membersSelectors.getMembers(state)
})

export default connect(mapStateToProps)(Revision)
