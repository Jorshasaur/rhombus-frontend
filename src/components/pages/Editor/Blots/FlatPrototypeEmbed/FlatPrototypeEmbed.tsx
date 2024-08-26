import * as React from 'react'
import { Subscribe } from 'unstated'
import cx from 'classnames'
import { get } from 'lodash'
import { BlotSize } from '../../../../../interfaces/blotSize'
import { AnimatedEmbedWrapper } from '../AnimatedEmbedWrapper'
import { BlockEmbedProps } from '../../../../../interfaces/blockEmbed'
import styles from '../Blots.module.css'
import { Button } from '@invisionapp/helios'
import { getLargeEmbedWidth } from '../../../../../helpers/EmbedHelper'
import FlatPrototypeEmbedContainer, {
    defaultFlatPrototype
} from './FlatPrototypeEmbedContainer'
import { PersistentBar } from '../PersistentBar'
import { Timestamp } from '../Timestamp'
import { ServiceErrorEmbed } from '../ServiceErrorEmbed/ServiceErrorEmbed'
import { GENERIC_FAILURE } from '../ServiceErrorEmbed/ServiceErrorMessages'

import {
    DEFAULT_RATIO,
    PERSISTENT_BAR_HEIGHT
} from '../../../../../constants/styles'
import { EmbedModal, EmbedModalProps } from '../EmbedModal'
import {
    createModalOpenHandler,
    createModalCloseHandler,
    createNewTabTracker
} from '../BlotUtils'

const INVERTED_DEFAULT_RATIO = 16 / 9

interface FlatPrototypeEmbedProps extends BlockEmbedProps {
    container: HTMLElement
}

export default class FlatPrototypeEmbed extends React.Component<
    FlatPrototypeEmbedProps
> {
    embed: FlatPrototypeEmbedContainer

    private trackOpenInNewTab = createNewTabTracker(this.props.service)

    getEmbedModalData = (): EmbedModalProps => ({
        onHide: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) =>
            this.handleModalClose(event),
        actionArea: (
            <a
                className={`${styles.newTabLink} styled-link`}
                data-testid="flat-prototype-embed__new-tab"
                href={this.props.originalLink}
                onClick={this.trackOpenInNewTab}
                target="_blank">
                Open in New Tab...
            </a>
        ),
        children: <iframe src={this.props.originalLink} />
    })

    handleModalOpen = createModalOpenHandler(this.getEmbedModalData)

    handleModalClose = createModalCloseHandler()

    private _prototypeIsSmallerThanEmbed = (
        defaultSize: { width: number; height: number },
        imageDimensions: FlatPrototypeEmbedContainer['state']['imageDimensions'],
        prototype: FlatPrototypeEmbedContainer['state']['prototype']
    ) => {
        if (prototype.isMobile) {
            const mobileAspect = prototype.width / prototype.height
            const width = defaultSize.height * mobileAspect

            return (
                defaultSize.height > prototype.height || width > prototype.width
            )
        }
        return (
            defaultSize.height > imageDimensions.height ||
            defaultSize.width > imageDimensions.width
        )
    }

    private _getDefaultEmbedSize = (size?: BlotSize) => {
        const width =
            size && size === BlotSize.Large
                ? getLargeEmbedWidth()
                : this.props.container.clientWidth
        const height = width * DEFAULT_RATIO

        return { width, height }
    }

    private _shouldUsePrototypeAspectRatio = (
        imageDimensions: FlatPrototypeEmbedContainer['state']['imageDimensions'],
        prototype: FlatPrototypeEmbedContainer['state']['prototype']
    ) => {
        return (
            imageDimensions &&
            imageDimensions.aspect <= 1 &&
            prototype &&
            !prototype.isMobile
        )
    }

    private _getEmbedSize = (embed: FlatPrototypeEmbedContainer) => {
        const { prototype, imageDimensions, size } = embed.state
        const defaultSize = this._getDefaultEmbedSize(size)
        // Initialize the default height
        const embedSize = {
            height:
                size && size === BlotSize.Medium
                    ? defaultSize.height + PERSISTENT_BAR_HEIGHT
                    : defaultSize.height,
            width: defaultSize.width
        }

        // If the aspect ratio for an embed is less than 1:1 (Square) shrink down to the embed's aspect ratio
        if (
            this._shouldUsePrototypeAspectRatio(imageDimensions, prototype) &&
            !this._prototypeIsSmallerThanEmbed(
                defaultSize,
                imageDimensions,
                prototype
            )
        ) {
            embedSize.height =
                defaultSize.width *
                (imageDimensions.height / imageDimensions.width)
        }

        // If the height makes an embed with a smaller image taller than the default, use that height
        if (
            imageDimensions &&
            prototype &&
            this._prototypeIsSmallerThanEmbed(
                defaultSize,
                imageDimensions,
                prototype
            )
        ) {
            const sizeObject = prototype.isMobile ? prototype : imageDimensions
            if (sizeObject.height > defaultSize.height) {
                embedSize.height = sizeObject.height
                if (size && size === BlotSize.Medium) {
                    embedSize.height = embedSize.height + PERSISTENT_BAR_HEIGHT
                }
            }
        }

        return embedSize
    }

    private _renderPrototype = (embed: FlatPrototypeEmbedContainer) => {
        const { prototype, imageDimensions, size } = embed.state
        let ratio = INVERTED_DEFAULT_RATIO
        let minHeight = 0
        const defaultSize = this._getDefaultEmbedSize(size)
        let thumbnailEmbedWidth = '100%'
        let thumbnailEmbedHeight = 'auto'
        let thumbnailSmallerThanEmbed = false

        if (this._shouldUsePrototypeAspectRatio(imageDimensions, prototype)) {
            ratio = imageDimensions.width / imageDimensions.height
        } else if (prototype.isMobile) {
            // Use the aspect ratio of the mobile prototype, and fit it to the embed
            const mobileAspect = prototype.width / prototype.height
            const width = defaultSize.height * mobileAspect
            thumbnailSmallerThanEmbed = true

            thumbnailEmbedHeight = `${defaultSize.height}px`
            thumbnailEmbedWidth = `${width}px`
        }

        // If the prototype is smaller than the embed, center it in the embed
        if (
            this._prototypeIsSmallerThanEmbed(
                defaultSize,
                imageDimensions,
                prototype
            )
        ) {
            const sizeObject = prototype.isMobile ? prototype : imageDimensions

            thumbnailSmallerThanEmbed = true

            minHeight = defaultSize.height
            thumbnailEmbedHeight = `${sizeObject.height}px`
            thumbnailEmbedWidth = `${sizeObject.width}px`
        }

        const thumbnailEmbedStyle = {
            ['--aspect-ratio']: ratio,
            backgroundImage: `url(${prototype.thumbnail})`,
            height: thumbnailEmbedHeight,
            width: thumbnailEmbedWidth
        }

        return (
            <React.Fragment>
                <div
                    className={cx(
                        styles.extendedInfo,
                        styles.flatPrototypeExtendedInfo
                    )}
                    data-testid="flat-prototype-embed__extended-info"
                    style={{ minHeight }}>
                    <div
                        className={cx(styles.thumbnailEmbed, {
                            [styles.smallerThumbnailEmbed]: thumbnailSmallerThanEmbed
                        })}
                        data-testid="flat-prototype-embed__thumbnail-embed"
                        style={thumbnailEmbedStyle}
                    />
                    <div
                        id="open-popout-extended"
                        className={styles.infoCover}
                        onClick={(e) => {
                            this.handleModalOpen(e)
                        }}
                    />
                </div>
                <Button
                    data-testid="flat-prototype-embed__play-button"
                    order="primary"
                    className={styles.editButton}
                    // @ts-ignore
                    onMouseDown={(e: MouseEvent) => {
                        // Needed to prevent embed from being unselected while clicking button
                        e.preventDefault()
                    }}
                    // @ts-ignore
                    onClick={this.handleModalOpen}>
                    <span data-allow-propagation="true">Play</span>
                </Button>
            </React.Fragment>
        )
    }
    private _renderPlaceholder = () => {
        return (
            <React.Fragment>
                <div className={styles.extendedInfo}>
                    <img
                        className={styles.ratio}
                        src={defaultFlatPrototype.thumbnail}
                    />
                    <div
                        data-testid="flat-prototype-embed__thumbnail-placeholder"
                        className={`${styles.infoWrapper} ${styles.thumbnailEmbed}`}
                        style={{
                            backgroundImage: `url(${defaultFlatPrototype.thumbnail})`
                        }}
                    />
                    <div
                        id="open-popout-extended"
                        className={styles.infoCover}
                        onClick={(e) => {
                            this.handleModalOpen(e)
                        }}
                    />
                </div>
                <Button
                    data-testid="flat-prototype-embed__play-button"
                    order="primary"
                    className={styles.editButton}
                    // @ts-ignore
                    onMouseDown={(e: MouseEvent) => {
                        // Needed to prevent embed from being unselected while clicking button
                        e.preventDefault()
                    }}
                    // @ts-ignore
                    onClick={this.handleModalOpen}>
                    <span data-allow-propagation="true">Play</span>
                </Button>
            </React.Fragment>
        )
    }
    protected _renderSmall = (embed: FlatPrototypeEmbedContainer) => {
        const { prototype } = embed.state
        return (
            <PersistentBar
                service={this.props.service}
                onClick={this.handleModalOpen}
                originalLink={this.props.originalLink}
                name={get(prototype, 'name', 'Prototype')}
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
                    className={styles.persistentTimestamp}
                    createdAt={this.props.createdAt}
                    updatedAt={get(prototype, 'updatedAt')}
                />
            </PersistentBar>
        )
    }
    protected _renderFullSize = (embed: FlatPrototypeEmbedContainer) => {
        const { prototype } = embed.state
        return (
            <React.Fragment>
                <div
                    className={cx(
                        styles.blockEmbedWrapper,
                        this.props.service,
                        this.props.uuid
                    )}>
                    {prototype
                        ? this._renderPrototype(embed)
                        : this._renderPlaceholder()}
                </div>
                <PersistentBar
                    service={this.props.service}
                    onClick={this.handleModalOpen}
                    originalLink={this.props.originalLink}
                    name={get(prototype, 'name', 'Prototype')}
                    hoverChildren={
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Timestamp
                                author={this.props.authorName}
                                className={styles.persistentTimestamp}
                                createdAt={this.props.createdAt}
                                updatedAt={get(prototype, 'updatedAt')}
                            />
                        </div>
                    }
                />
            </React.Fragment>
        )
    }

    render() {
        return (
            <Subscribe to={[FlatPrototypeEmbedContainer]}>
                {(embed: FlatPrototypeEmbedContainer) => {
                    if (this.embed == null) {
                        this.embed = embed
                        EmbedModal.update({
                            children: (
                                <iframe
                                    src={
                                        embed.state.url ||
                                        this.props.originalLink
                                    }
                                />
                            )
                        })
                    }

                    if (embed.state.unviewable) {
                        return (
                            <ServiceErrorEmbed
                                service={embed.state.service}
                                name="Prototype"
                                originalLink={embed.state.originalLink!}
                                tooltipText={
                                    embed.state.unviewableReason ||
                                    GENERIC_FAILURE
                                }
                            />
                        )
                    }
                    return (
                        <AnimatedEmbedWrapper
                            renderSmall={() => this._renderSmall(embed)}
                            renderFullSize={() => this._renderFullSize(embed)}
                            size={embed.state.size || BlotSize.Medium}
                            container={this.props.container}
                            popoutOpen={EmbedModal.isShown()}
                            getEmbedSize={() => {
                                return this._getEmbedSize(embed)
                            }}
                            hasOpenThread={embed.state.hasOpenThread || false}
                        />
                    )
                }}
            </Subscribe>
        )
    }
}
