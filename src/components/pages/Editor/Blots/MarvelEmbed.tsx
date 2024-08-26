import * as React from 'react'
import { BlockEmbedProps } from '../../../../interfaces/blockEmbed'
import styles from './Blots.module.css'
import PrototypePlaceholderImage from '../../../../assets/images/embeds/prototype-placeholder.png'
import IconExpand from '../../../../assets/images/icons/icon-expand.svg'
import { Timestamp } from './Timestamp'
import { PersistentBar } from './PersistentBar'
import cx from 'classnames'
import { Button } from '@invisionapp/helios'
import { EmbedModalProps } from './EmbedModal'
import {
    createNewTabTracker,
    createModalOpenHandler,
    createModalCloseHandler
} from './BlotUtils'

export default class MarvelEmbed extends React.Component<BlockEmbedProps> {
    private trackOpenInNewTab = createNewTabTracker(this.props.service)

    getEmbedModalData = (): EmbedModalProps => ({
        onHide: this.handleModalClose,
        actionArea: (
            <a
                className={`${styles.newTabLink} styled-link`}
                data-testid="marvel-embed__new-tab"
                href={this.props.originalLink}
                onClick={this.trackOpenInNewTab}
                target="_blank">
                Open in New Tab...
            </a>
        ),
        children: (
            <iframe src={this.props.originalLink} id="marvel-modal__iframe" />
        )
    })

    handleModalOpen = createModalOpenHandler(this.getEmbedModalData)

    handleModalClose = createModalCloseHandler()

    _renderFullSize = () => {
        return (
            <React.Fragment>
                <div
                    className={`
                        ${styles.blockEmbedWrapper}
                        ${this.props.service}
                        ${this.props.uuid}
                    `}>
                    <div
                        className={styles.extendedInfo}
                        style={{ borderTop: 0 }}>
                        <img
                            className={styles.ratio}
                            src={PrototypePlaceholderImage}
                        />
                        <div
                            className={cx(
                                styles.infoWrapper,
                                styles.thumbnailEmbed
                            )}>
                            <iframe src={this.props.originalLink} />
                        </div>
                    </div>
                    <Button
                        data-testid="marvel-embed__expand-button"
                        data-allow-propagation="true"
                        order="primary"
                        className={styles.editButton}
                        // @ts-ignore
                        onMouseDown={(e: MouseEvent) => {
                            // Needed to prevent embed from being unselected while clicking button
                            e.preventDefault()
                        }}
                        // @ts-ignore
                        onClick={this.handleModalOpen}
                        style={{ padding: '1px 12px', borderRadius: '50%' }}>
                        <IconExpand
                            fill="white"
                            data-allow-propagation="true"
                            style={{ margin: 0 }}
                        />
                    </Button>
                </div>
                <PersistentBar
                    service={this.props.service}
                    onClick={this.handleModalOpen}
                    originalLink={this.props.originalLink}
                    name={this.props.title}
                    hoverChildren={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Timestamp
                                author={this.props.authorName}
                                className={styles.persistentTimestamp}
                                createdAt={this.props.createdAt}
                            />
                        </div>
                    }
                />
            </React.Fragment>
        )
    }

    render() {
        return this._renderFullSize()
    }
}
