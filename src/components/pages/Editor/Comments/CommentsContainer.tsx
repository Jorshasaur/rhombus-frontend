import { connect, Dispatch } from 'react-redux'
import { RootState } from '../../../../data/reducers'
import { membersSelectors } from '../../../../data/members'
import { clearMentionList } from '../../../../data/actions'
import {
    highlightCommentThread,
    unhighlightCommentThread,
    deselectCommentThread,
    resolveThread,
    postNewThread,
    postNewComment,
    retryNewComment,
    cancelNewCommentThread,
    retryNewThread
} from '../../../../data/comments/actions'
import Comments from './Comments'

const mapStateToProps = (state: RootState) => ({
    members: membersSelectors.getMembers(state),
    teamMembers: membersSelectors.getTeamMembers(state),
    currentUser: membersSelectors.getCurrentUser(state),
    isArchived: state.currentDocument.isArchived,
    comments: state.comments,
    selection: state.selection,
    elementCoordinates: state.elementCoordinates,
    mentions: state.mentions
})

const mapDispatchToProps = (dispatch: Dispatch<Function>) => ({
    highlightCommentThread: (markId: string) =>
        dispatch(highlightCommentThread(markId)),
    unhighlightCommentThread: () => dispatch(unhighlightCommentThread()),
    deselectCommentThread: () => dispatch(deselectCommentThread()),
    clearMentionList: () => dispatch(clearMentionList()),
    resolveThread: (threadId: string) => dispatch(resolveThread(threadId)),
    cancelNewCommentThread: (threadId: string) =>
        dispatch(cancelNewCommentThread(threadId)),
    postNewThread: (
        markId: string,
        text: string,
        source: string,
        userId: number,
        tempId: string
    ) => dispatch(postNewThread(markId, text, source, userId, tempId)),
    postNewComment: (
        threadId: string,
        markId: string,
        text: string,
        source: string,
        userId: number,
        tempId: string
    ) =>
        dispatch(
            postNewComment(threadId, markId, text, source, userId, tempId)
        ),
    retryNewThread: (markId: string, commentId: string, text: string) =>
        dispatch(retryNewThread(markId, commentId, text)),
    retryNewComment: (
        threadId: string,
        markId: string,
        commentId: string,
        text: string
    ) => dispatch(retryNewComment(threadId, markId, commentId, text))
})

export default connect(mapStateToProps, mapDispatchToProps)(Comments)
