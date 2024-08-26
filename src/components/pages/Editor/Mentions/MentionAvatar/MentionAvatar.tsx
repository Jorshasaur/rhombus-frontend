import React from 'react'
import { Member } from '../MentionsList/MentionsList'
import styles from './MentionAvatar.module.css'

interface Dimensions {
    cy?: number
    r?: number
    dx?: number
    cx?: number
    dy?: number
}
function getInitials(member: Partial<Member>) {
    var name = member.name

    // If no value was passed-in, return nothing.
    if (!name) {
        return ''
    }

    var nameParts = name.replace(/^\s+|\s+$/g, '').split(/\s+/)
    var namePartsCount = nameParts.length

    // If we have multiple parts, get the first and last (skip any middle names / initials).
    if (namePartsCount > 1) {
        return (
            nameParts[0].slice(0, 1) + nameParts[namePartsCount - 1].slice(0, 1)
        )
    }

    // If we only have one part, just get the first initial.
    return nameParts[0].slice(0, 1)
}
interface Props {
    member: Partial<Member>
    width: number
    multiple?: boolean
}
interface State {}

class CollaboratorAvatar extends React.Component<Props, State> {
    render() {
        const { member, width } = this.props

        const dimensions: Dimensions = {}
        dimensions.cy = width / 2
        dimensions.r = width / 2
        dimensions.dx = width / 2 - 2
        dimensions.cx = 18
        dimensions.dy = this.props.multiple ? 14 : 18

        return (
            <div
                className={styles.avatarContainer}
                style={{
                    backgroundColor: '#596376',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    borderRadius: this.props.width + 'px',
                    height: this.props.width + 'px',
                    width: this.props.width + 'px',
                    backgroundImage: `url(${member.avatarUrl})`
                }}>
                <svg
                    className={styles.root}
                    width={this.props.width}
                    height={this.props.width}
                    viewBox={`0 0 ${this.props.width} ${this.props.width}`}>
                    <g>
                        {!member.avatarUrl && (
                            <g>
                                <circle
                                    cx={this.props.width / 2}
                                    cy={this.props.width / 2}
                                    fill="#596376"
                                    r={dimensions.r}
                                />
                                <text
                                    className={styles.text}
                                    dx={dimensions.dx}
                                    dy={dimensions.dy}
                                    fill="#ffffff"
                                    textAnchor="middle">
                                    {getInitials(member).toUpperCase()}
                                </text>
                            </g>
                        )}
                    </g>
                </svg>
            </div>
        )
    }
}

export default CollaboratorAvatar
