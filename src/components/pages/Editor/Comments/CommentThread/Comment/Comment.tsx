import More from '@invisionapp/helios/icons/More'
import cx from 'classnames'
import React from 'react'
import TimeAgo from 'react-timeago'
import { OutputSelector } from 'reselect'
import IconWarning from '../../../../../../assets/images/icons/icon-warning-red.svg'
import {
    makeGetCommentUserSelector,
    makeGetContentSelector
} from '../../../../../../data/comments/selectors'
import { Content } from '../../../../../../interfaces/content'
import { ContentType } from '../../../../../../interfaces/contentType'
import { Member } from '../../../../../../interfaces/member'
import { MENTIONS_DOC_REFERENCE } from '../../../../../../constants/mentions'
import { formatTime } from '../../../../../../lib/utils'
import DocumentMention from '../../../Mentions/DocumentMention/DocumentMention'
import Mention from '../../../Mentions/Mention/Mention'
import MentionAvatar from '../../../Mentions/MentionAvatar/MentionAvatar'
import styles from '../CommentThread.module.css'

export interface Props {
    focused: boolean
    highlighted: boolean
    commentLength: number
    commentText: string
    index: number
    userId: string
    updatedAt: Date
    teamMembers: Member[]
    documentMembers: Member[]
    threadId: string
    hasError?: boolean
    commentId: string
    onFailure: (
        threadId: string,
        commentId: string,
        textContent: string
    ) => void
    avatarOnly?: boolean
}

interface State {
    mountedComment: boolean
    shouldTruncate: boolean
}

const LINE_HEIGHT = 21 // pixels
const THRESHOLD_FOR_THREE_LINES = LINE_HEIGHT * 3 + 2

export default class Comment extends React.Component<Props, State> {
    commentEl: HTMLDivElement | null
    getCommentUser: OutputSelector<
        Props,
        Member | undefined,
        (userId: string, teamMembers: Member[]) => Member | undefined
    >
    getContent: OutputSelector<
        Props,
        Content[],
        (commentText: string, teamMembers: Member[]) => Content[]
    >
    state: State = {
        mountedComment: false,
        shouldTruncate: false
    }
    constructor(props: Props) {
        super(props)

        this.getCommentUser = makeGetCommentUserSelector()
        this.getContent = makeGetContentSelector()
    }
    truncateCheck() {
        setTimeout(() => {
            let height = 0
            if (this.commentEl) {
                height = this.commentEl.getBoundingClientRect().height
            }

            if (height === 0) {
                this.truncateCheck()
                return
            }

            this.setState({
                mountedComment: true,
                shouldTruncate: height > THRESHOLD_FOR_THREE_LINES
            })
        }, 10)
    }

    componentDidMount() {
        this.truncateCheck()
    }

    render() {
        const {
            focused,
            commentLength,
            index,
            highlighted,
            updatedAt,
            hasError,
            avatarOnly
        } = this.props
        const user = this.getCommentUser(this.props)
        const content = this.getContent(this.props)

        const isCollapsed =
            !focused &&
            commentLength > 2 &&
            index !== 0 &&
            index !== commentLength - 1

        const shouldTruncate = !this.props.focused && this.state.shouldTruncate

        return (
            <div>
                {/* If there are more than 2 comments, and the thread is collapsed,
                show a text prompt that displays how many comments are collapsed */}
                {isCollapsed && index === 1 && (
                    <div
                        className={cx(styles.additionalCommentText, {
                            [styles.avatarOnly]: avatarOnly
                        })}>
                        {commentLength - 2} more comment
                        {commentLength - 2 > 1 ? 's' : ''}
                    </div>
                )}
                {/* If there are only two comments, or the comment is first or last, or if the thread is focused display the comment */}
                {!isCollapsed && (
                    <div
                        className={cx(styles.comment, {
                            [styles.avatarOnly]: avatarOnly,
                            [styles.highlighted]: highlighted,
                            [styles.focused]: focused,
                            [styles.collapsedCommentLeader]:
                                !focused && commentLength > 1 && index === 0,
                            [styles.twoCommentLeader]: commentLength === 2,
                            [styles.commentError]: hasError
                        })}>
                        <div
                            className={cx(styles.avatarContainer, {
                                [styles.avatarOnly]: avatarOnly
                            })}>
                            {user && <MentionAvatar member={user} width={32} />}
                        </div>
                        <div className={`${styles.commentArea}`}>
                            <div className={styles.commentMeta}>
                                {user && (
                                    <div className={styles.commentName}>
                                        {user.name}
                                    </div>
                                )}
                                <div className={styles.commentTime}>
                                    <TimeAgo
                                        date={updatedAt}
                                        formatter={(
                                            value: number,
                                            unit: string,
                                            suffix: string,
                                            date: Date
                                        ) =>
                                            formatTime(
                                                value,
                                                unit,
                                                suffix,
                                                date
                                            )
                                        }
                                    />
                                </div>
                            </div>
                            <div
                                data-testid="comment__text"
                                className={cx(styles.commentText, {
                                    [styles.showText]:
                                        this.state.mountedComment &&
                                        !avatarOnly,
                                    [styles.truncate]: shouldTruncate
                                })}
                                ref={(commentEl) =>
                                    (this.commentEl = commentEl)
                                }>
                                {content && this._renderCommentContent(content)}
                                {shouldTruncate && (
                                    <div className={styles.ellipsesContainer}>
                                        <More
                                            category="utility"
                                            fill="text"
                                            // @ts-ignore
                                            size={18}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {hasError && content && (
                    <div
                        className={`
                        ${styles.comment}
                        `}>
                        <div
                            className={`
                            ${styles.avatarContainer}
                            ${styles.hasError}
                        `}>
                            <IconWarning />
                        </div>
                        <div className={`${styles.commentArea}`}>
                            <div
                                className={`
                            ${styles.commentText}
                            ${styles.errorText}
                            `}>
                                There was an error sending this comment.{' '}
                                <a
                                    id="post-new-comment"
                                    onClick={() => {
                                        this._onFailure()
                                    }}>
                                    Try Again
                                </a>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    private _onFailure = () => {
        const { onFailure, threadId, commentId, commentText } = this.props
        onFailure(threadId, commentId, commentText)
    }

    private _renderCommentContent(content: Content[]) {
        return content.map((item, index) => {
            if (item.type === ContentType.Mention) {
                const { user, token } = item
                return (
                    <Mention
                        key={index}
                        email={user ? user.email : ''}
                        name={user ? user.name : token}
                        avatarUrl={user ? user.avatarUrl : ''}
                        showHoverInfo={this.props.focused}
                    />
                )
            } else if (item.type === ContentType.DocumentMention) {
                return (
                    <DocumentMention
                        key={index}
                        documentName={MENTIONS_DOC_REFERENCE}
                        members={this.props.documentMembers}
                        showHoverInfo={this.props.focused}
                    />
                )
            } else if (item.type === ContentType.Text) {
                return <span key={index}>{item.text}</span>
            } else {
                return <br key={index} />
            }
        })
    }
}
