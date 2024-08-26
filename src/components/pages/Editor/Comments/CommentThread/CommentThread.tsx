import cx from 'classnames'
import Delta, { DeltaStatic } from 'quill-delta'
import React from 'react'
import MentionAnalytics from '../../../../../analytics/AnalyticsBuilders/MentionAnalytics'
import { MentionsState } from '../../../../../data/reducers/mentions'
import { Comment as CommentInterface } from '../../../../../interfaces/comment'
import { keycodes } from '../../../../../interfaces/keycodes'
import { Member } from '../../../../../interfaces/member'
import resizeObserverService from '../../../../../services/ResizeObserverService'
import Quill from '../../../../quill/entries/Editor'
import QuillEvents from '../../../../quill/modules/QuillEvents'
import QuillSources from '../../../../quill/modules/QuillSources'
import MentionAvatar from '../../Mentions/MentionAvatar/MentionAvatar'
import MentionsList from '../../Mentions/MentionsList/MentionsList'
import mentionsListStyles from '../../Mentions/MentionsList/MentionsList.module.css'
import Comment from './Comment/Comment'
import styles from './CommentThread.module.css'
import insertMention from '../../../../quill/utils/insertMention'
import { COMMENT_MARKING_MODULE_NAME } from '../../../../../constants/quill-modules'

interface Props {
    threadId: string
    markId: string
    comments?: CommentInterface[]
    onMouseEnter: (threadId: string) => void
    onMouseLeave: (threadId: string) => void
    onClick: (markId: string) => void
    onCancel: (threadId: string, status: string) => void
    onPost: (threadId: string, textContent: DeltaStatic) => void
    onDeselect: (
        threadId: string,
        status: string,
        textContent?: DeltaStatic
    ) => void
    onFailure: (
        threadId: string,
        commentId: string,
        textContent: string
    ) => void
    onResolve: (threadId: string, markId: string) => void
    onThreadResize: (
        threadId: string,
        contentRect: DOMRect | ClientRect
    ) => void
    documentMembers: Member[]
    teamMembers: Member[]
    currentUser: Member
    highlighted: boolean
    focused: boolean
    status: string
    resolved: boolean
    top: number
    position?: 'static' | 'relative' | 'fixed' | 'absolute' | 'sticky'
    mentions: MentionsState
    collapsed?: boolean
}
interface State {
    mounted: boolean
    textContent?: DeltaStatic
    markResolved: boolean
    openSlowly: boolean
}
export default class CommentThread extends React.Component<Props, State> {
    public static defaultProps: Partial<Props> = {
        documentMembers: [],
        highlighted: false,
        position: 'relative'
    }
    commentQuillInstance: Quill
    wrapperRef: HTMLElement | null

    constructor(props: Props) {
        super(props)

        this.state = {
            mounted: false,
            markResolved: false,
            openSlowly: props.status === 'draft'
        }
    }
    componentDidMount() {
        if (this.commentQuillInstance) {
            // Subscribe to text change events on the comment threads Quill instance
            this.commentQuillInstance.on(
                QuillEvents.TEXT_CHANGE,
                this._handleTextChange
            )
            // Listen for clicks outside of the component
            document.addEventListener('mousedown', this._handleClickOutside)
        }
        this.setState({ mounted: true })
    }
    componentWillUnmount() {
        // Unsubscribe to text change events on the comment threads Quill instance
        this.commentQuillInstance.off(
            QuillEvents.TEXT_CHANGE,
            this._handleTextChange
        )
        // Unsubscribe on unmount
        document.removeEventListener('mousedown', this._handleClickOutside)
        if (this.wrapperRef) {
            resizeObserverService.unobserve(this.wrapperRef)
        }
    }
    componentDidUpdate(prevProps: Props, prevState: State) {
        if (
            prevProps.collapsed &&
            !this.props.collapsed &&
            this.props.focused
        ) {
            this.setState({ openSlowly: true })
        } else if (
            prevProps.focused !== this.props.focused &&
            !this.props.focused
        ) {
            this.setState({ openSlowly: false })
        }
    }

    private clickMentionsMember = (member: Member) => {
        new MentionAnalytics().fromCommenting().track()
        insertMention(
            this.commentQuillInstance,
            this.props.mentions.initialIndex!,
            this.props.mentions.currentIndex!,
            'mention',
            member
        )
    }

    getMentionsType() {
        return `comments-${this.props.markId}`
    }

    render() {
        const {
            threadId,
            markId,
            documentMembers,
            teamMembers,
            comments,
            onMouseEnter,
            onMouseLeave,
            onClick,
            top,
            highlighted,
            focused,
            position,
            mentions,
            currentUser,
            collapsed
        } = this.props

        const { textContent, mounted, openSlowly } = this.state

        const textEntered = textContent && textContent.length() > 1
        return (
            <React.Fragment>
                {mentions.showMentionsList &&
                    mentions.type === this.getMentionsType() && (
                        <MentionsList
                            key={`mentions-${threadId}`}
                            top={mentions.top + 28}
                            left={mentions.left + 20}
                            onMemberClick={this.clickMentionsMember}
                            members={documentMembers}
                            searchResults={mentions.members}
                            searchTerm={mentions.mentionText}
                            selectedItem={mentions.selectedMemberIndex}
                        />
                    )}
                <div
                    data-focused={focused}
                    className={cx(styles.commentContainer, {
                        [styles.hasComments]: comments && comments.length > 0,
                        [styles.resolved]:
                            this.state.markResolved || this.props.resolved,
                        [styles.collapsed]: collapsed,
                        [styles.mounted]: mounted,
                        [styles.focused]: focused,
                        [styles.highlighted]: highlighted,
                        [styles.openSlowly]: openSlowly
                    })}
                    key={`thread-${markId}`}
                    id={`thread-${markId}`}
                    onClick={() => {
                        onClick(markId)
                    }}
                    onMouseEnter={() => {
                        onMouseEnter(markId)
                    }}
                    onMouseLeave={() => {
                        onMouseLeave(markId)
                    }}
                    style={{
                        position,
                        top
                    }}
                    ref={this._mountThread}>
                    <div
                        data-focused={
                            this.props.focused &&
                            comments &&
                            comments.length > 0
                        }
                        data-testid="comment-thread__resolve"
                        id="resolve-comment"
                        className={`
                        ${styles.resolve}
                        ${
                            this.props.focused &&
                            comments &&
                            comments.length > 0
                                ? styles.focused
                                : ''
                        }
                    `}
                        onClick={() => {
                            this._onResolve(threadId)
                        }}>
                        Resolve
                    </div>

                    {comments &&
                        comments.map((comment, index: number) => {
                            return (
                                <Comment
                                    key={comment.id}
                                    focused={focused}
                                    highlighted={highlighted}
                                    index={index}
                                    commentLength={comments.length}
                                    userId={comment.userId}
                                    teamMembers={teamMembers}
                                    documentMembers={documentMembers}
                                    commentText={comment.comment}
                                    updatedAt={comment.updatedAt}
                                    onFailure={this.props.onFailure}
                                    threadId={threadId}
                                    commentId={comment.id}
                                    hasError={comment.hasError}
                                    avatarOnly={collapsed}
                                />
                            )
                        })}
                    {/* New comment form */}
                    <div
                        data-testid="comment-thread__new"
                        className={`
                    ${styles.comment}
                    ${styles.newComment}
                    ${comments && comments.length ? styles.hasComments : ''}
                    ${textEntered ? styles.textEntered : ''}
                    `}>
                        {currentUser && (
                            <div
                                className={cx(styles.avatarContainer, {
                                    [styles.avatarOnly]: collapsed
                                })}>
                                <MentionAvatar
                                    member={currentUser}
                                    width={32}
                                />
                            </div>
                        )}
                        <div
                            className={`${styles.commentArea} ${
                                textEntered ? styles.textEntered : ''
                            }`}>
                            <div
                                data-testid="comment-thread__editor"
                                ref={this._mountQuill}
                                className={`${styles.commentEditor} ${
                                    textEntered ? styles.textEntered : ''
                                }`}
                            />
                            <div
                                className={`${styles.commentActions} ${
                                    textEntered ? styles.textEntered : ''
                                }`}>
                                <a
                                    id="post-new-comment"
                                    data-testid="comment-thread__post"
                                    onClick={this._onPost}>
                                    Post
                                </a>{' '}
                                •{' '}
                                <a
                                    data-testid="comment-thread__cancel"
                                    id="cancel-new-comment"
                                    onClick={this._onCancel}>
                                    Cancel
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }

    // On cancel delete the text from and blur the Quill editor, then call the passed 'onCancel' prop
    private _onCancel = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation()
        const { threadId, status, onCancel } = this.props
        this._clearQuill()
        onCancel(threadId, status)
    }

    // On post delete the text from and blur the Quill editor, then call the passed 'onPost' prop
    private _onPost = () => {
        const { threadId, onPost } = this.props
        const { textContent } = this.state
        this._clearQuill()
        onPost(threadId, textContent!)
    }

    private _clearQuill = () => {
        if (this.commentQuillInstance) {
            this.commentQuillInstance.setContents(
                new Delta(),
                QuillSources.USER
            )
            this.commentQuillInstance.blur()
        }
    }
    private _mountThread = (el: HTMLDivElement) => {
        if (el) {
            this.wrapperRef = el
            resizeObserverService.observe(el, this._handleThreadResize)
        }
    }
    // Create a new Quill instance for the new comment form
    private _mountQuill = (el: HTMLDivElement) => {
        const bindings = {
            postComment: {
                key: keycodes.Enter,
                shortKey: true,
                handler: this._onPost
            }
        }

        if (el) {
            const quillOptions = {
                placeholder: 'Leave a comment',
                modules: {
                    keyboard: {
                        mentions: true,
                        mentionsType: this.getMentionsType(),
                        commentBindings: bindings,
                        commentMode: true
                    },
                    toolbar: false,
                    authorship: {
                        enabled: false
                    },
                    clipboard: {
                        formats: [],
                        enabled: false
                    },
                    emoji: false,
                    'emoji-picker-manager': false,
                    'file-paste': false,
                    'file-drop': false,
                    'mentions-manager': {
                        type: this.getMentionsType()
                    },
                    'selection-manager': {
                        enabled: false
                    },
                    'authors-manager': false,
                    placeholder: { enabled: false },
                    [COMMENT_MARKING_MODULE_NAME]: false,
                    'mouseover-manager': false
                }
            }
            this.commentQuillInstance = new Quill(el, quillOptions)
            setImmediate(() => {
                this.commentQuillInstance.focus()
            })
        }
    }
    // Update the state when the Quill text area changes
    private _handleTextChange = () => {
        const textContent = this.commentQuillInstance.getContents()
        this.setState({ textContent })
    }
    // Deselect the thread when clicking outside of the component
    private _handleClickOutside = (event: MouseEvent) => {
        if (
            this.wrapperRef && // @todo
            event.target &&
            !this.wrapperRef.contains(event.target as HTMLElement) &&
            this.props.focused &&
            !this._isInCommentContainer(event.target as HTMLElement)
        ) {
            this.props.onDeselect(
                this.props.threadId,
                this.props.status,
                this.state.textContent
            )
        }
    }

    // Hide the thread and call the prop to resolve
    private _onResolve = (threadId: string) => {
        const { status, onCancel, markId } = this.props
        this._clearQuill()
        onCancel(threadId, status)
        this.setState({ markResolved: true })
        this.props.onResolve(threadId, markId)
    }

    private _handleThreadResize = () => {
        const { threadId, onThreadResize } = this.props
        onThreadResize(threadId, this.wrapperRef!.getBoundingClientRect())
    }
    private _isInCommentContainer(child: HTMLElement) {
        if (
            child.classList &&
            child.classList.length &&
            (child.classList.contains(styles.commentContainer) ||
                child.classList.contains(mentionsListStyles.mentionsList))
        ) {
            return true
        }
        let node = child.parentNode as HTMLElement
        while (node) {
            if (
                node.classList &&
                node.classList.length &&
                (node.classList.contains(styles.commentContainer) ||
                    node.classList.contains(mentionsListStyles.mentionsList))
            ) {
                return true
            }
            node = node.parentNode as HTMLElement
        }
        return false
    }
}
