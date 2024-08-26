import { debounce, find } from 'lodash'
import PubSub from 'pubsub-js'
import { DeltaStatic } from 'quill-delta'
import React from 'react'
import { AnyAction } from 'redux'
import { v4 as uuid } from 'uuid'
import { COMMENT_STATUSES } from '../../../../constants/comments'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../constants/topics'
import { CommentsState } from '../../../../data/comments/reducers'
import { ElementCoordinatesState } from '../../../../data/reducers/elementCoordinates'
import { MentionsState } from '../../../../data/reducers/mentions'
import { SelectionState } from '../../../../data/reducers/selection'
import { Member } from '../../../../interfaces/member'
import { GlobalCommentMarkingModule } from '../../../quill/modules/CommentMarking'
import { getTextAndMentions } from '../../../quill/utils'
import styles from './Comments.module.css'
import CommentThread from './CommentThread/CommentThread'
import { SortedThread, sortThreads } from './SortThreads'

export interface Props {
    highlightCommentThread: (markId: string) => AnyAction
    unhighlightCommentThread: () => AnyAction
    deselectCommentThread: () => AnyAction
    clearMentionList: () => AnyAction
    cancelNewCommentThread: (threadId: string) => any
    postNewThread: (
        markId: string,
        text: string,
        source: string,
        userId: number,
        tempId: string
    ) => Promise<void>
    postNewComment: (
        threadId: string,
        markId: string,
        text: string,
        source: string,
        userId: number,
        tempId: string
    ) => Promise<void>
    retryNewComment: (
        threadId: string,
        markId: string,
        commentId: string,
        text: string
    ) => Promise<void>
    retryNewThread: (
        markId: string,
        commentId: string,
        text: string
    ) => Promise<void>
    resolveThread: (threadId: string) => any
    comments: CommentsState
    members: Member[]
    teamMembers: Member[]
    currentUser: Member
    elementCoordinates: ElementCoordinatesState
    selection: SelectionState
    isArchived: boolean
    mentions: MentionsState
}

interface State {
    currentUser?: Member
    sortedThreads: SortedThread[]
}

export default class Comments extends React.Component<Props, State> {
    token: string

    constructor(props: Props) {
        super(props)

        this.state = {
            sortedThreads: []
        }
    }

    componentDidMount() {
        // Wait for the window to stop resizing and recalculate thread position
        window.addEventListener('resize', debounce(this._sortThreads, 150))
        this.token = PubSub.subscribe(
            DOCUMENT_CHANGE_REPOSITION,
            this._sortThreads
        )
    }
    componentWillUnmount() {
        window.removeEventListener('resize', debounce(this._sortThreads, 150))
        PubSub.unsubscribe(this.token)
    }
    componentDidUpdate(prevProps: Props) {
        const { comments, selection } = this.props
        // If selection or comment threads updates, resort the threads
        if (
            comments.threads !== prevProps.comments.threads ||
            prevProps.selection !== selection
        ) {
            this._sortThreads()
        }
    }

    render() {
        const {
            currentUser,
            comments,
            members,
            teamMembers,
            mentions,
            isArchived
        } = this.props
        if (isArchived) {
            return <div className={styles.comments} data-testid="comments" />
        }
        const { sortedThreads } = this.state
        return (
            <div className={styles.comments} data-testid="comments">
                {sortedThreads.map((thread) => (
                    <CommentThread
                        key={thread.id}
                        threadId={thread.id}
                        markId={thread.markId}
                        collapsed={thread.collapsed}
                        comments={thread.comments}
                        highlighted={
                            comments.highlightedCommentMarkId === thread.markId
                        }
                        focused={
                            comments.selectedCommentMarkId === thread.markId
                        }
                        currentUser={currentUser}
                        onMouseEnter={this._onThreadMouseEnter}
                        onMouseLeave={this._onThreadMouseLeave}
                        onClick={this._onThreadSelect}
                        onCancel={this._cancelComment}
                        onPost={this._createComment}
                        onFailure={this._retryComment}
                        onDeselect={this._onThreadDeselect}
                        onResolve={this._onResolve}
                        documentMembers={members}
                        teamMembers={teamMembers}
                        status={thread.status}
                        resolved={thread.resolved}
                        onThreadResize={this._onThreadResize}
                        top={thread.top}
                        position="absolute"
                        mentions={mentions}
                    />
                ))}
            </div>
        )
    }

    // On clicking a thread, select and highlight that threads CommentMarks in the editor
    private _onThreadSelect = (markId: string) => {
        GlobalCommentMarkingModule.select(markId)
    }

    // Deselect a thread when clicking outside of it
    private _onThreadDeselect = (
        threadId: string,
        status: string,
        textContent?: DeltaStatic
    ) => {
        const { threads } = this.props.comments
        const thread = find(threads, { id: threadId })

        if (
            thread &&
            status === COMMENT_STATUSES.DRAFT &&
            (textContent == null || textContent.length() < 2)
        ) {
            this._cancelNewComment(threadId)
        } else {
            this._deselectThread()
        }
    }

    private _deselectThread() {
        const {
            deselectCommentThread,
            unhighlightCommentThread,
            clearMentionList
        } = this.props
        unhighlightCommentThread()
        deselectCommentThread()
        clearMentionList()
        GlobalCommentMarkingModule.clear()
    }

    // On hovering a thread, highlight that threads CommentMarks in the editor
    private _onThreadMouseEnter = (markId: string) => {
        this.props.highlightCommentThread(markId)
        GlobalCommentMarkingModule.highlight(markId)
    }

    // On unhovering a thread, unhighlight that threads CommentMarks in the editor
    private _onThreadMouseLeave = (markId: string) => {
        const { comments, unhighlightCommentThread } = this.props

        // If the thread is currently selected, leave it highlighted
        if (comments.selectedCommentMarkId !== markId) {
            unhighlightCommentThread()
            GlobalCommentMarkingModule.unhighlight(markId)
        }
    }

    private _createComment = (threadId: string, contents: DeltaStatic) => {
        const { userId } = this.props.currentUser
        const { text, source } = getTextAndMentions(contents)
        const { comments, postNewComment, postNewThread } = this.props
        const commentToPost = find(comments.threads, { id: threadId })

        if (commentToPost) {
            if (commentToPost.status === COMMENT_STATUSES.DRAFT) {
                postNewThread(
                    commentToPost.markId,
                    text,
                    source,
                    userId,
                    uuid()
                )
            } else {
                postNewComment(
                    threadId,
                    commentToPost.markId,
                    text,
                    source,
                    userId,
                    uuid()
                )
            }
        }
    }

    private _retryComment = (
        threadId: string,
        commentId: string,
        text: string
    ) => {
        const { comments, retryNewComment, retryNewThread } = this.props
        const commentToPost = find(comments.threads, { id: threadId })
        if (commentToPost) {
            const errorComments = commentToPost.comments.filter(
                (comment) => comment.hasError
            )
            const isNewThread =
                errorComments.length === commentToPost.comments.length
            if (isNewThread) {
                retryNewThread(commentToPost.markId, commentId, text)
            } else {
                retryNewComment(threadId, commentToPost.markId, commentId, text)
            }
        }
    }
    private _cancelNewComment = (threadId: string) => {
        GlobalCommentMarkingModule.remove(threadId)
        this.props.cancelNewCommentThread(threadId)
    }
    // Cancel creating a comment
    private _cancelComment = (threadId: string) => {
        const { threads } = this.props.comments
        const commentToCancel = find(threads, { id: threadId })
        if (commentToCancel) {
            if (commentToCancel.status) {
                switch (commentToCancel.status) {
                    // If the comment status is draft (unsent), it will be unhighlighted and removed from the state
                    case COMMENT_STATUSES.DRAFT:
                        this._cancelNewComment(threadId)
                        break
                    default:
                        break
                }
            } else {
                this._deselectThread()
            }
        }
    }

    private _onResolve = async (threadId: string, markId: string) => {
        await this.props.resolveThread(threadId)
        this.props.unhighlightCommentThread()
        this.props.deselectCommentThread()
        GlobalCommentMarkingModule.remove(markId)
    }

    private _onThreadResize = () => {
        this._sortThreads()
    }

    private _sortThreads = () => {
        const sortedThreads = sortThreads(this.props)
        this.setState({ sortedThreads })
    }
}
