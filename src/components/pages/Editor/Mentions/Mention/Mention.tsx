import React from 'react'
import styles from './Mention.module.css'
import MentionAvatar from '../MentionAvatar/MentionAvatar'

interface Props {
    email: string
    avatarUrl: string
    name: string
    showHoverInfo?: boolean
}
interface State {}

export default class Mention extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {}
    }

    render() {
        const showHoverInfo =
            this.props.showHoverInfo === undefined
                ? true
                : this.props.showHoverInfo
        return (
            <span className={styles.mention}>
                <span className={styles.mentionText}>@{this.props.name}</span>
                {showHoverInfo && (
                    <div className={styles.mentionHover}>
                        <MentionAvatar
                            member={{
                                name: this.props.name,
                                avatarUrl: this.props.avatarUrl
                            }}
                            width={32}
                        />
                        <div className={styles.memberInfo}>
                            {this.props.name && (
                                <span className={styles.memberInfoName}>
                                    {this.props.name}
                                </span>
                            )}
                            {this.props.email && (
                                <span className={styles.memberInfoEmail}>
                                    {this.props.email}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </span>
        )
    }
}
