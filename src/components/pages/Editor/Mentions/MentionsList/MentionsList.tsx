import React from 'react'
import styles from './MentionsList.module.css'
import MentionAvatar from '../MentionAvatar/MentionAvatar'
import cx from 'classnames'

export interface Member {
    email: string
    name: string
    avatarUrl: string
    id: string | number
}
interface Props {
    left?: number
    members: Member[]
    searchResults: Member[]
    searchTerm?: string
    onMemberClick: (member: Member) => void
    selectedItem?: number
    top?: number
}
interface State {
    left: number
}

const MAXIMUM_LIST_LENGTH = 2

export default class MentionsList extends React.Component<Props, State> {
    public static defaultProps: Partial<Props> = {
        searchTerm: ''
    }

    _ref: HTMLDivElement | null

    constructor(props: Props) {
        super(props)

        this.state = {
            left: props.left || 0
        }
    }

    componentDidUpdate(prevProps: Props) {
        if (this.props.left && prevProps.left !== this.props.left) {
            this._updateLeft(this.props.left)
        }
    }

    componentDidMount() {
        this._updateLeft(this.state.left)
    }

    _updateLeft(newLeft: number) {
        if (this._ref != null) {
            const bounds = this._ref.getBoundingClientRect()
            const windowWidth = window.innerWidth - 20
            const newRight = bounds.right - this.state.left + newLeft
            if (newRight > windowWidth) {
                const offset = newRight - windowWidth
                this.setState({ left: newLeft - offset })
            } else {
                this.setState({ left: newLeft })
            }
        }
    }

    _setRef = (ref: HTMLDivElement | null) => {
        this._ref = ref
    }

    render() {
        const { members, selectedItem, searchTerm } = this.props

        return (
            <div
                ref={this._setRef}
                data-testid="mentions-list"
                className={cx(styles.mentionsList, {
                    [styles.itemSelected]: typeof selectedItem === 'number',
                    empty: members.length === 0
                })}
                style={{
                    left: this.state.left + 'px',
                    top: (this.props.top || 0) + 'px'
                }}>
                <div className={styles.mentionsListPrompt}>
                    @mention someone to share this doc
                </div>
                <div
                    data-testid="mentions-list__member-list"
                    className={styles.memberListContainer}>
                    {this.props.searchResults.map(
                        (member: Member, index: number) =>
                            index <= MAXIMUM_LIST_LENGTH && (
                                <div
                                    className={`
                                ${styles.mentionsListMember}
                                ${
                                    selectedItem === index
                                        ? styles.mentionsListMemberSelected
                                        : ''
                                }
                            `}
                                    onClick={() =>
                                        this._handleMemberClick(member)
                                    }
                                    key={index}>
                                    <MentionAvatar member={member} width={32} />
                                    <div
                                        className={
                                            styles.mentionsListMemberInfo
                                        }>
                                        <span
                                            className={
                                                styles.mentionsListMemberInfoName
                                            }>
                                            {this._formatText(
                                                member.name,
                                                searchTerm
                                            )}
                                        </span>
                                        <span
                                            className={
                                                styles.mentionsListMemberInfoEmail
                                            }>
                                            {this._formatText(
                                                member.email,
                                                searchTerm
                                            )}
                                        </span>
                                    </div>
                                </div>
                            )
                    )}
                </div>
            </div>
        )
    }

    private _formatText = (text: string, searchTerm = '') => {
        const index = text
            ? text.toLowerCase().indexOf(searchTerm.toLowerCase())
            : -1
        if (index >= 0) {
            return [
                text.substring(0, index),
                <span className={styles.highlightedText} key={index}>
                    {text.substring(index, index + searchTerm.length)}
                </span>,
                text.substring(index + searchTerm.length)
            ]
        }
        return text
    }
    private _handleMemberClick(member: Member) {
        this.props.onMemberClick(member)
    }
}
