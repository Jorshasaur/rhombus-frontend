import { connect, Dispatch } from 'react-redux'
import { withRouter } from 'react-router-dom'
import {
    archiveDocument,
    setElementCoordinates,
    subscribeToDocument,
    unsubscribeFromDocument
} from '../../../data/actions'
import { documentHistoryActionCreators } from '../../../data/documentHistory'
import { membersSelectors } from '../../../data/members'
import { RootState } from '../../../data/reducers'
import { BannerPosition } from '../../../data/reducers/banner'
import { ElementCoordinates } from '../../../interfaces/elementCoordinates'
import { UnfollowMethod } from '../../../interfaces/unfollowMethod'
import Navigation from './Navigation'

const mapStateToProps = (state: RootState) => ({
    banner: state.banner,
    members: membersSelectors.getMembersForNavigation(state),
    documentId: state.currentDocument.id,
    title: state.title,
    updatedAt: state.updatedAt,
    permissions: state.permissions,
    bannerOffset:
        state.banner.type != null &&
        state.banner.position === BannerPosition.Top,
    archivedDocument: state.archivedDocument,
    isArchived: state.currentDocument.isArchived,
    updating: state.currentDocument.updating,
    isSubscribed: state.currentDocument.isSubscribed,
    navigationHeight: state.elementCoordinates.navigation.bottom,
    canUseDocumentHistory: state.featureFlags.documentHistory,
    canUseTheme: state.featureFlags.darkMode
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({
    setElementCoordinates: (
        elementName: string,
        elementCoordinates: ElementCoordinates
    ) => dispatch(setElementCoordinates(elementName, elementCoordinates)),
    archiveDocument: (documentId: string) =>
        dispatch(archiveDocument(documentId)),
    subscribeToDocument: () => dispatch(subscribeToDocument()),
    unsubscribeFromDocument: (unfollowMethod: UnfollowMethod) =>
        dispatch<any>(unsubscribeFromDocument(unfollowMethod)),
    showDocumentHistory: () =>
        dispatch(documentHistoryActionCreators.showDocumentHistory())
})

export default withRouter(
    connect(mapStateToProps, mapDispatchToProps)(Navigation)
)
