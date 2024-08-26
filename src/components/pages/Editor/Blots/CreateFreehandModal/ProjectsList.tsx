import { useSmoothScrollingList } from './hooks/useSmoothScrollingList'
import React, { useRef } from 'react'
import { FreehandDocumentSuccess } from '../../../../../data/services/FreehandResponseTypes'
import { formatTime } from '../../../../../lib/utils'
import TimeAgo from 'react-timeago'
import styles from './ProjectsList.module.css'
import { Text } from '@invisionapp/helios'
import placeholder from '../../../../../assets/images/embeds/freehand-placeholder.png'
import cx from 'classnames'
import Add from '../../../../../assets/images/icons/line-controls/icon-plus.svg'

interface Props {
    projects: FreehandDocumentSuccess[]
    selectedProject: number
    filter: string
    onAdd: (url: string) => void
    onCreateNew: () => void
}
export const ProjectsList: React.FunctionComponent<Props> = ({
    projects,
    selectedProject,
    filter,
    onAdd,
    onCreateNew
}) => {
    const list = useRef<HTMLUListElement>(null)

    useSmoothScrollingList(list, projects, selectedProject)

    const listIsOverflowing = projects.length > 3

    return (
        <div
            className={
                filter.length > 0 ? styles.containerVisible : styles.container
            }>
            <ul className={styles.list} ref={list} data-testid="projects-list">
                {projects.map((p, i) => (
                    <li
                        className={cx(styles.listItem, {
                            [styles.listItemSelected]: i === selectedProject
                        })}
                        onClick={() => onAdd(p.path)}>
                        <img
                            className={cx(styles.thumb, {
                                [styles.thumbPlaceholder]: !p.thumbnailUrl
                            })}
                            src={p.thumbnailUrl ?? placeholder}
                            alt={p.name + ' thumbnail'}
                        />
                        <div className={styles.copy}>
                            <Text order="body" className={styles.name}>
                                {p.name}
                            </Text>{' '}
                            <Text order="body" className={styles.timestamp}>
                                {p.updatedAt ? 'Updated ' : 'Added '}
                                <TimeAgo
                                    date={
                                        p.updatedAt ? p.updatedAt : p.createdAt
                                    }
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
                                            date,
                                            'just now'
                                        )
                                    }
                                />
                            </Text>
                        </div>
                    </li>
                ))}
            </ul>
            <div
                className={styles.listShadow}
                style={{ opacity: listIsOverflowing ? 1 : 0 }}
            />
            <div className={styles.createNewContainer}>
                <div
                    className={
                        selectedProject === projects.length
                            ? styles.createNewSelected
                            : styles.createNew
                    }
                    onClick={onCreateNew}>
                    <div className={styles.plusIconContainer}>
                        <Add
                            fill="white"
                            width={16}
                            height={16}
                            viewBox="0 0 12 12"
                            className={styles.plusIcon}
                        />
                    </div>
                    <div className={styles.copy}>
                        <Text order="body" className={styles.name}>
                            Create new Freehand
                        </Text>{' '}
                        <Text order="body" className={styles.timestamp}>
                            "{filter}"
                        </Text>
                    </div>
                </div>
            </div>
        </div>
    )
}
