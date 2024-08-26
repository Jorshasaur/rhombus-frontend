import { connect } from 'react-redux'
import { documentHistoryActionCreators } from '../../../../data/documentHistory'
import { DocumentHistory } from './DocumentHistory'

const mapStateToProps = () => ({})

const mapDispatchToProps = {
    hideDocumentHistory: documentHistoryActionCreators.hideDocumentHistory
}

export default connect(mapStateToProps, mapDispatchToProps)(DocumentHistory)
