import { Button } from '@invisionapp/helios'
import { Draw, Refresh } from '@invisionapp/helios/icons'
import cx from 'classnames'
import { noop, once, startCase } from 'lodash'
import React from 'react'
import { Subscribe } from 'unstated'
import {
    default as EmbedAnalytics,
    default as EmbedInteractionAnalytics
} from '../../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import FreehandPlaceholderImage from '../../../../../assets/images/embeds/freehand-placeholder.png'
import IconExpand from '../../../../../assets/images/icons/icon-expand.svg'
import store from '../../../../../data/store'
import { getEmbedSize } from '../../../../../helpers/EmbedHelper'
import {
    BlockEmbedProps,
    ResizableEmbed
} from '../../../../../interfaces/blockEmbed'
import { BlotSize } from '../../../../../interfaces/blotSize'
import { AnimatedEmbedWrapper } from '../AnimatedEmbedWrapper'
import styles from '../Blots.module.css'
import {
    createModalCloseHandler,
    createModalOpenHandler,
    createNewTabTracker
} from '../BlotUtils'
import { EmbedModal, EmbedModalProps } from '../EmbedModal'
import { PersistentBar } from '../PersistentBar'
import { ServiceErrorEmbed } from '../ServiceErrorEmbed/ServiceErrorEmbed'
import { Timestamp } from '../Timestamp'
import FreehandCanvas from './FreehandCanvas'
import FreehandEmbedContainer from './FreehandEmbedContainer'

interface FreehandEmbedProps extends BlockEmbedProps {
    container: HTMLElement
}

interface FreehandState {
    editMode: boolean
}
export default class FreehandEmbed
    extends React.Component<FreehandEmbedProps, FreehandState>
    implements ResizableEmbed {
    freehandCanvas: FreehandCanvas

    state = {
        editMode: false
    }

    private trackOpenInNewTab = createNewTabTracker(this.props.service)

    private trackAccessRequests = () => {
        const { userId, teamId } = store.getState().user
        new EmbedAnalytics()
            .onAccessRequested()
            .withProperties({
                subType: 'EmbedType.isFreehand',
                userId,
                teamId
            })
            .track()
    }

    private trackZoom() {
        new EmbedInteractionAnalytics().onZoomed().track()
    }

    private trackPan() {
        new EmbedInteractionAnalytics().onPanned().track()
    }

    getEmbedModalData = (): EmbedModalProps => ({
        onHide: this.handleModalClose,
        actionArea: (
            <a
                className={`${styles.newTabLink} styled-link`}
                data-testid="freehand-embed__new-tab"
                href={this.props.originalLink}
                onClick={this.trackOpenInNewTab}
                target="_blank">
                Open in New Tab...
            </a>
        ),
        children: (
            <iframe
                src={this.props.originalLink + '?embed=rhombus'}
                id="freehand-modal__iframe"
                onLoad={this.handleIframeLoad}
            />
        )
    })

    handleModalOpen = createModalOpenHandler(this.getEmbedModalData)

    handleModalClose = createModalCloseHandler()

    private handleIframeLoad = () => {
        const iframe = document.querySelector<HTMLIFrameElement>(
            '#freehand-modal__iframe'
        )
        if (iframe) {
            iframe.focus()
        }
    }

    private handleCreatedFreehand = once((freehand: FreehandEmbedContainer) => {
        if (!freehand.state.originalLink) return

        if (
            freehand.getEmbedData().openInEditMode === 'true' &&
            Number(freehand.state.authorId) === store.getState().user.userId
        ) {
            if (store.getState().featureFlags.nightly) {
                this.setState({
                    editMode: true
                })
                freehand.setSize(BlotSize.Large)
                return
            }

            setTimeout(() => {
                this.handleModalOpen({
                    stopPropagation: noop,
                    preventDefault: noop
                } as React.MouseEvent<HTMLElement>)

                freehand.setEmbedDataValue('openInEditMode', 'false')
            }, 1000)
        }
    })

    private onShrinkGrow = () => {
        if (this.freehandCanvas) {
            this.freehandCanvas.updateSize(true)
        }
    }

    _renderSmall = (thumbnail: FreehandEmbedContainer) => {
        return (
            <PersistentBar
                service={this.props.service}
                onClick={this.handleModalOpen}
                originalLink={this.props.originalLink}
                name={thumbnail.state.name}
                hoverChildren={
                    <a
                        style={{ alignSelf: 'center' }}
                        className={`styled-link ${styles.newTabLink} ${styles.persistentTimestamp}`}
                        href={this.props.originalLink}
                        onClick={this.trackOpenInNewTab}
                        target="_blank">
                        Open in New Tab...
                    </a>
                }>
                <Timestamp
                    author={this.props.authorName}
                    updatedAt={thumbnail.state.updatedAt}
                    className={styles.persistentTimestamp}
                />
            </PersistentBar>
        )
    }

    renderEditButton = () => {
        const { nightly } = store.getState().featureFlags

        if (!nightly) {
            return (
                <Button
                    data-testid="freehand-embed__open-button"
                    data-allow-propagation="true"
                    order="primary"
                    className={styles.editButton}
                    // @ts-ignore
                    onMouseDown={(e: MouseEvent) => {
                        // Needed to prevent embed from being unselected while clicking button
                        e.preventDefault()
                    }}
                    // @ts-ignore
                    onClick={this.handleModalOpen}>
                    <span data-allow-propagation="true">Edit</span>
                </Button>
            )
        }

        if (this.state.editMode) {
            return (
                <Button
                    data-testid="freehand-embed__exit-edit-button"
                    data-allow-propagation="true"
                    order="primary"
                    className={styles.editButton}
                    // @ts-ignore
                    onMouseDown={(e: MouseEvent) => {
                        // Needed to prevent embed from being unselected while clicking button
                        e.preventDefault()
                    }}
                    // @ts-ignore
                    onClick={() => this.setState({ editMode: false })}
                    style={{
                        padding: '1px 5px 5px 11px',
                        borderRadius: '50%'
                    }}>
                    <Refresh fill="white" size={24}>
                        I am a Icon component
                    </Refresh>
                </Button>
            )
        } else {
            return (
                <div className={styles.editButtonContainer}>
                    <Button
                        data-testid="freehand-embed__open-button"
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
                    <Button
                        data-testid="freehand-embed__edit-button"
                        data-allow-propagation="true"
                        order="primary"
                        className={styles.editButton}
                        // @ts-ignore
                        onMouseDown={(e: MouseEvent) => {
                            // Needed to prevent embed from being unselected while clicking button
                            e.preventDefault()
                        }}
                        // @ts-ignore
                        onClick={() => this.setState({ editMode: true })}
                        style={{
                            padding: '1px 5px 5px 11px',
                            borderRadius: '50%'
                        }}>
                        <Draw fill="white" size={24}></Draw>
                    </Button>
                </div>
            )
        }
    }

    _renderFullSize = (freehand: FreehandEmbedContainer, width?: number) => {
        const ratioStyle: React.CSSProperties = {
            transition: 'opacity 0.5s ease-out'
        }
        if (freehand.state.size === BlotSize.Large && width) {
            ratioStyle.height = width / 2
        }

        if (freehand.state.content) {
            ratioStyle.opacity = 0
        }

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
                            style={ratioStyle}
                            src={FreehandPlaceholderImage}
                        />
                        <div
                            className={cx(
                                styles.infoWrapper,
                                styles.thumbnailEmbed
                            )}>
                            {this.state.editMode && (
                                <iframe src={freehand.state.originalLink} />
                            )}
                            {!this.state.editMode && freehand.state.content && (
                                <FreehandCanvas
                                    freehand={freehand}
                                    id={this.props.uuid}
                                    content={freehand.state.content}
                                    onPan={this.trackPan}
                                    onZoom={this.trackZoom}
                                    assets={freehand.state.assets}
                                    ref={(freehandCanvas: FreehandCanvas) => {
                                        this.freehandCanvas = freehandCanvas
                                    }}
                                />
                            )}
                        </div>
                    </div>
                    {this.renderEditButton()}
                </div>
                <PersistentBar
                    service={this.props.service}
                    onClick={this.handleModalOpen}
                    originalLink={this.props.originalLink}
                    name={freehand.state.name || startCase(this.props.service)}
                    hoverChildren={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Timestamp
                                author={this.props.authorName}
                                className={styles.persistentTimestamp}
                                createdAt={this.props.createdAt}
                                updatedAt={freehand.state.updatedAt}
                            />
                        </div>
                    }
                />
            </React.Fragment>
        )
    }

    render() {
        return (
            <Subscribe to={[FreehandEmbedContainer]}>
                {(freehand: FreehandEmbedContainer) => {
                    if (freehand.state.unviewable) {
                        return (
                            <div onClick={this.trackAccessRequests}>
                                <ServiceErrorEmbed
                                    service={freehand.state.service}
                                    originalLink={freehand.state.originalLink!}
                                    tooltipText={
                                        freehand.state.unviewableReason
                                    }
                                />
                            </div>
                        )
                    }

                    this.handleCreatedFreehand(freehand)

                    return (
                        <AnimatedEmbedWrapper
                            renderSmall={() => this._renderSmall(freehand)}
                            renderFullSize={(width) =>
                                this._renderFullSize(freehand, width)
                            }
                            size={freehand.state.size || BlotSize.Medium}
                            container={this.props.container}
                            popoutOpen={EmbedModal.isShown()}
                            getEmbedSize={() =>
                                getEmbedSize(this, styles.extendedInfo)
                            }
                            hasOpenThread={
                                freehand.state.hasOpenThread || false
                            }
                            onTransitionEnd={this.onShrinkGrow}
                        />
                    )
                }}
            </Subscribe>
        )
    }
}
