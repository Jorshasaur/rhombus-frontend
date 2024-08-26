import { debounce } from 'lodash'
import { connect, Dispatch } from 'react-redux'
import {
    clearMentionList,
    closePlusMenu,
    fetchAllThreads,
    fetchCurrentDocument,
    fetchFeatureFlags,
    fetchTeamMembers,
    fetchUser,
    formatSelection,
    keepAlive,
    openPlusMenu,
    setDocumentIsSubscribed,
    setDocumentUpdating,
    setElementCoordinates,
    setMembers,
    setPermissions,
    setTitle,
    setUpdatedAt,
    showBanner,
    unarchiveDocument,
    unsubscribeFromDocument
} from '../../../data/actions'
import { documentHistorySelectors } from '../../../data/documentHistory'
import { imagesSelectors } from '../../../data/images'
import { RootState } from '../../../data/reducers'
import {
    BannerColor,
    BannerPosition,
    BannerType
} from '../../../data/reducers/banner'
import { ElementCoordinates } from '../../../interfaces/elementCoordinates'
import { Member } from '../../../interfaces/member'
import { UnfollowMethod } from '../../../interfaces/unfollowMethod'
import { COMMENT_STATUSES } from '../../../constants/comments'
import Editor from './Editor'

const mapStateToProps = (state: RootState) => ({
    selection: state.selection,
    bold: state.selection.bold,
    blockquote: state.selection.blockquote,
    codeBlock: state.selection.codeBlock,
    header: state.selection.header,
    index: state.selection.index,
    italic: state.selection.italic,
    selectionLength: state.selection.selectionLength,
    selectionType: state.selection.selectionType,
    link: state.selection.link,
    list: state.selection.list,
    mentions: state.mentions,
    navigationHeight: state.elementCoordinates.navigation.bottom,
    strike: state.selection.strike,
    text: state.selection.text,
    underline: state.selection.underline,
    isFirstLine: state.selection.isFirstLine,
    currentDocument: state.currentDocument,
    user: state.user,
    title: state.title,
    updatedAt: state.updatedAt,
    missingDocument: state.missingDocument,
    permissions: state.permissions,
    showEmojiPicker: state.emojiPicker.showEmojiPicker,
    hasUnsavedComments:
        state.comments.threads.filter(
            (thread) =>
                thread.status && thread.status === COMMENT_STATUSES.POSTING
        ).length > 0,
    hasCommentError: state.comments.hasError,
    loggedIn: state.loggedIn,
    banner: state.banner,
    activeImageId: imagesSelectors.getActiveImageId(state),
    showPlusMenu: state.plusMenu.showPlusMenu,
    historyOpen: documentHistorySelectors.getDocumentHistoryDisplayState(state)
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({
    formatSelection: (format: string, value: boolean | string | number) =>
        dispatch(formatSelection(format, value)),
    setMembers: (members: Member[]) => dispatch(setMembers(members)),
    fetchTeamMembers: () => dispatch(fetchTeamMembers()),
    fetchAllThreads: () => dispatch(fetchAllThreads()),
    fetchFeatureFlags: async () => dispatch(await fetchFeatureFlags()),
    fetchCurrentDocument: (documentId: string) =>
        dispatch(fetchCurrentDocument(documentId)),
    fetchUser: () => dispatch(fetchUser()),
    clearMentionList: () => dispatch(clearMentionList()),
    setTitle: (title: string) => dispatch(setTitle(title)),
    setUpdatedAt: (updatedAt: Date) => dispatch(setUpdatedAt(updatedAt)),
    showBanner: (
        type: BannerType,
        color?: BannerColor,
        position?: BannerPosition
    ) => dispatch(showBanner(type, color, position)),
    unarchiveDocument: () => dispatch<any>(unarchiveDocument()),
    keepAlive: () => dispatch(keepAlive()),
    setDocumentUpdating: debounce(
        (isUpdating: boolean) => dispatch(setDocumentUpdating(isUpdating)),
        20
    ),
    setPermissions: (canEdit: boolean, canComment: boolean) =>
        dispatch(setPermissions(canEdit, canComment)),
    setDocumentIsSubscribed: (isSubscribed: boolean) =>
        dispatch(setDocumentIsSubscribed(isSubscribed)),
    unsubscribeFromDocument: (unfollowMethod: UnfollowMethod) =>
        dispatch<any>(unsubscribeFromDocument(unfollowMethod)),
    closePlusMenu: () => dispatch(closePlusMenu()),
    openPlusMenu: (top: number) => dispatch(openPlusMenu(top)),
    setElementCoordinates: (
        elementName: string,
        elementCoordinates: ElementCoordinates
    ) => dispatch(setElementCoordinates(elementName, elementCoordinates))
})

export default connect(
    mapStateToProps,
    mapDispatchToProps
    // @ts-ignore
)(Editor)
