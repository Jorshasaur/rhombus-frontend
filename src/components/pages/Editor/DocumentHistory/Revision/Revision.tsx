import { Text } from '@invisionapp/helios'
import cx from 'classnames'
import React from 'react'
import { Member } from '../../../../../interfaces/member'
import styles from './Revision.module.css'
interface Props {
    id: string
    users: number[]
    date: Date
    onClick: () => void
    members: Member[]
    isActive: boolean
    documentOwnerId: number
    isCurrent: boolean
}

export const DATE_STRING_FORMAT_OPTIONS = {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
}

export const TIME_STRING_FORMAT_OPTIONS = {
    hour: 'numeric',
    minute: 'numeric'
}

export function Revision(props: Props) {
    const revisionAuthors: string[] = []
    props.users.forEach((user) => {
        if (props.members) {
            const revisionUser = user || props.documentOwnerId
            const memberMatch = props.members.find(
                (member) => revisionUser === member.userId
            )
            if (memberMatch) {
                revisionAuthors.push(memberMatch.name)
            }
        }
    })
    return (
        <button
            className={cx(styles.revisionButton, {
                [styles.activeRevision]: props.isActive
            })}
            disabled={props.isActive}
            onClick={() => {
                props.onClick()
            }}>
            <Text
                order="subtitle"
                size="smaller"
                element="span"
                className={styles.revisionTitle}>
                {props.isCurrent && 'Current Version'}
                {!props.isCurrent &&
                    props.date.toLocaleDateString(
                        'en-US',
                        DATE_STRING_FORMAT_OPTIONS
                    )}
            </Text>
            {!props.isCurrent && (
                <Text
                    order="subtitle"
                    size="smaller"
                    element="span"
                    className={styles.revisionTime}>
                    {props.date.toLocaleTimeString(
                        'en-US',
                        TIME_STRING_FORMAT_OPTIONS
                    )}
                </Text>
            )}
            {revisionAuthors.length > 0 && (
                <Text
                    order="body"
                    size="smallest"
                    element="div"
                    className={styles.revisionAuthor}>
                    By {revisionAuthors.join(', ')}
                </Text>
            )}
        </button>
    )
}
