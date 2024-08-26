import React from 'react'
import MentionAvatar from '../MentionAvatar/MentionAvatar'
import { Member } from '../MentionsList/MentionsList'
import styles from './DocumentMentionAvatar.module.css'

interface Props {
    members: Member[]
}
interface State {}

export default class Mention extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)

        this.state = {}
    }

    render() {
        return (
            <div
                className={`${styles.documentMentionAvatar} ${
                    this.props.members.length > 1 ? styles.multipleMembers : ''
                }`}>
                {this.props.members.map(
                    (member, index: number) =>
                        index < 2 && (
                            <MentionAvatar
                                member={member}
                                width={this.props.members.length > 1 ? 24 : 32}
                                multiple={this.props.members.length > 1}
                            />
                        )
                )}
            </div>
        )
    }
}
