import React from 'react'
import DocumentMentionAvatar from '../DocumentMentionAvatar/DocumentMentionAvatar'
import { Member } from '../MentionsList/MentionsList'
import styles from '../Mention/Mention.module.css'

interface Props {
    documentName: string
    members: Member[]
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
                <span className={styles.mentionText}>
                    @{this.props.documentName}
                </span>
                {showHoverInfo && (
                    <div className={styles.mentionHover}>
                        <DocumentMentionAvatar members={this.props.members} />
                        <div className={styles.memberInfo}>
                            <span className={styles.memberInfoName}>
                                {this.props.documentName}
                            </span>
                            <span className={styles.memberInfoEmail}>
                                Everyone in this document
                            </span>
                        </div>
                    </div>
                )}
            </span>
        )
    }
}
