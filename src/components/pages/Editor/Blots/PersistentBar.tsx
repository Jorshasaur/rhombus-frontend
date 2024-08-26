import React from 'react'
import styles from './PersistentBar.module.css'
import { noop, startCase } from 'lodash'
import { BlockEmbedService } from '../../../../interfaces/blockEmbed'
import Freehand from '../../../../assets/images/embeds/freehand.svg'
import Prototype from '../../../../assets/images/embeds/prototype.svg'
import Video from '../../../../assets/images/embeds/video.svg'
import File from '../../../../assets/images/embeds/generic-file.svg'
import Jira from '../../../../assets/images/icons/third-party/jira.svg'
import cx from 'classnames'

interface Props {
    children?: React.ReactNode
    hoverChildren?: React.ReactNode
    onClick?: React.MouseEventHandler
    originalLink?: string
    service: BlockEmbedService
    name?: React.ReactNode
}

export class PersistentBar extends React.Component<Props> {
    renderThemedServiceIcon() {
        switch (this.props.service) {
            case 'invision':
                return (
                    <Prototype
                        width={18}
                        height={18}
                        fill="var(--color-persistent-bar-icon)"
                    />
                )
            case 'prototype':
                return (
                    <Prototype
                        width={18}
                        height={18}
                        fill="var(--color-persistent-bar-icon)"
                    />
                )
            case 'freehand':
                return (
                    <Freehand
                        width={18}
                        height={18}
                        fill="var(--color-persistent-bar-icon)"
                    />
                )
            case 'jira':
                return <Jira width={18} height={18} />
            case 'unknown':
                return (
                    <File
                        width={18}
                        height={18}
                        fill="var(--color-persistent-bar-icon)"
                    />
                )
            case 'video':
                return (
                    <Video
                        width={21}
                        height={18}
                        fill="var(--color-persistent-bar-icon)"
                    />
                )
            default:
                return null
        }
    }

    render() {
        const {
            children,
            hoverChildren,
            onClick = noop,
            service,
            name
        } = this.props
        return (
            <div
                data-persistent-bar
                data-allow-propagation="true"
                className={styles.persistentBar}
                onClick={onClick}>
                <a
                    data-allow-propagation="true"
                    className={`${styles.serviceIcon} ${styles[service]}`}>
                    {[
                        'invision',
                        'prototype',
                        'freehand',
                        'unknown',
                        'jira',
                        'video'
                    ].includes(service) && this.renderThemedServiceIcon()}
                </a>
                <div
                    data-testid="persistent-bar-title"
                    className={styles.textContent}>
                    <div className={styles.title}>
                        {name || startCase(service)}
                    </div>
                </div>
                <div
                    data-testid="persistent-bar__children"
                    className={cx(
                        styles.barChildren,
                        'persistent-bar__children',
                        {
                            'persistent-bar__children--always-visible': !hoverChildren
                        }
                    )}>
                    {children}
                </div>
                <div
                    data-testid="persistent-bar__hover-children"
                    onClick={(e) => e.stopPropagation()}
                    className={cx(styles.hoverChildren, {
                        'persistent-bar__hover-children': !!hoverChildren
                    })}>
                    {hoverChildren}
                </div>
            </div>
        )
    }
}
