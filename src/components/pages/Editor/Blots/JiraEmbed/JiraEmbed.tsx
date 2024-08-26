import * as React from 'react'
import { BlockEmbedProps } from '../../../../../interfaces/blockEmbed'
import styles from '../Blots.module.css'
import { Subscribe } from 'unstated'
import JiraEmbedContainer from './JiraEmbedContainer'
import { Timestamp } from '../Timestamp'
import { PersistentBar } from '../PersistentBar'
import { noop } from 'lodash'

export default class JiraEmbed extends React.Component<BlockEmbedProps> {
    render() {
        return (
            <Subscribe to={[JiraEmbedContainer]}>
                {(embed: JiraEmbedContainer) => {
                    const {
                        ticketNumber,
                        createdAt,
                        originalLink
                    } = embed.state

                    return (
                        <div
                            className={`
                            ${styles.blockEmbedWrapper}
                            ${styles[this.props.service]}
                            ${this.props.uuid}
                        `}>
                            <PersistentBar
                                service={this.props.service}
                                onClick={noop}
                                originalLink={originalLink}
                                name={ticketNumber}
                                hoverChildren={
                                    <a
                                        style={{ alignSelf: 'center' }}
                                        className={`styled-link ${styles.newTabLink} ${styles.persistentTimestamp}`}
                                        href={originalLink}
                                        target="_blank">
                                        Open in New Tab...
                                    </a>
                                }>
                                <Timestamp
                                    author={this.props.authorName}
                                    createdAt={createdAt}
                                />
                            </PersistentBar>
                        </div>
                    )
                }}
            </Subscribe>
        )
    }
}
