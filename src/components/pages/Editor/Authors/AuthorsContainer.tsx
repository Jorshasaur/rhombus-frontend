import { connect } from 'react-redux'
import Authors from './Authors'
import { authorsSelectors } from '../../../../data/authors'
import { RootState } from '../../../../data/reducers'

const mapStateToProps = (state: RootState) => ({
    authors: authorsSelectors.getAuthors(state)
})

export default connect(mapStateToProps)(Authors)
