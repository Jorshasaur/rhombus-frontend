import { Button } from '@invisionapp/helios'
import cx from 'classnames'
import { debounce, get } from 'lodash'
import * as React from 'react'
import { Subscribe } from 'unstated'
import URI from 'urijs'
import PrototypePlaceholderImage from '../../../../assets/images/embeds/prototype-placeholder.png'
import IconExpand from '../../../../assets/images/icons/icon-expand.svg'
import { getEmbedSize, getEmbedStyles } from '../../../../helpers/EmbedHelper'
import { BlockEmbedProps } from '../../../../interfaces/blockEmbed'
import { BlotSize } from '../../../../interfaces/blotSize'
import { calculateAspectRatio } from '../../../../lib/utils'
import { AnimatedEmbedWrapper } from './AnimatedEmbedWrapper'
import styles from './Blots.module.css'
import {
    createModalCloseHandler,
    createModalOpenHandler,
    createNewTabTracker
} from './BlotUtils'
import { EmbedModal, EmbedModalProps } from './EmbedModal'
import { PersistentBar } from './PersistentBar'
import PrototypeEmbedContainer from './PrototypeEmbedContainer'
import { ServiceErrorEmbed } from './ServiceErrorEmbed/ServiceErrorEmbed'
import { CROSS_TEAM_FAILURE } from './ServiceErrorEmbed/ServiceErrorMessages'
import { Timestamp } from './Timestamp'

interface State {
    resizing: boolean
}
interface Props extends BlockEmbedProps {
    container: HTMLElement
}
export default class PrototypeEmbed extends React.Component<Props, State> {
    state = {
        resizing: false
    }
    wrapperRef: HTMLDivElement | null

    componentDidMount() {
        window.addEventListener('resize', debounce(this._updateSize, 150))
    }

    componentDidUpdate(nextProps: Props) {
        if (this.props.size !== nextProps.size) {
            this._updateSize()
        }
    }

    componentWillUnmount() {
        window.removeEventListener('resize', debounce(this._updateSize, 150))
    }

    private trackOpenInNewTab = createNewTabTracker(this.props.service)

    getEmbedModalData = (): EmbedModalProps => ({
        onHide: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) =>
            this.handleModalClose(event),
        actionArea: (
            <a
                className={`${styles.newTabLink} styled-link`}
                data-testid="prototype-embed__new-tab"
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

    setWrapperRef = (element: HTMLDivElement) => {
        if (element) {
            this.wrapperRef = element
            this._updateSize()
        }
    }

    _updateSize = () => {
        this.setState({ resizing: true }, () => {
            setTimeout(() => this.setState({ resizing: false }), 100)
        })
    }

    _getMinHeight = (embed: PrototypeEmbedContainer) => {
        const { prototype, size } = embed.state

        const aspect = calculateAspectRatio(prototype.width, prototype.height)
        const container = this.props.container as HTMLElement
        return getEmbedStyles(aspect, container, size!).height
    }
    _getFullScreenUrl = () => {
        const uri = URI(this.props.originalLink!)
        return uri.setSearch('hideNavBar', 'true').toString()
    }
    _renderPrototypeIframe = (embed: PrototypeEmbedContainer) => {
        let minHeight = this._getMinHeight(embed)
        const { prototype } = embed.state
        if (minHeight > prototype.height) {
            minHeight = prototype.height
        }
        const fullScreenUrl = this._getFullScreenUrl()
        return (
            <React.Fragment>
                <div
                    style={{
                        minHeight
                    }}
                    className={styles.extendedInfo}>
                    {!this.state.resizing && <iframe src={fullScreenUrl} />}
                </div>
                <Button
                    data-testid="prototype-embed__play-button"
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
            </React.Fragment>
        )
    }

    _getMaxHeight = (embed: PrototypeEmbedContainer) => {
        const { prototype } = embed.state
        if (prototype) {
            const minHeight = this._getMinHeight(embed)
            if (minHeight > prototype.height) {
                return prototype.height
            }
        }
        return
    }
    _renderPlaceholder = () => {
        return (
            <div className={styles.extendedInfo}>
                <img className={styles.ratio} src={PrototypePlaceholderImage} />
                <div
                    className={`${styles.infoWrapper} ${styles.thumbnailEmbed}`}
                    style={{
                        backgroundImage: `url(${PrototypePlaceholderImage})`
                    }}
                />
                <div
                    id="open-popout-extended"
                    className={styles.infoCover}
                    onClick={this.handleModalOpen}
                />
            </div>
        )
    }

    _renderSmall = (embed: PrototypeEmbedContainer) => {
        const { prototype } = embed.state
        return (
            <PersistentBar
                service={this.props.service}
                onClick={this.handleModalOpen}
                originalLink={this.props.originalLink}
                name={get(prototype, 'name')}
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

    _renderFullSize = (embed: PrototypeEmbedContainer) => {
        const { prototype } = embed.state
        return (
            <React.Fragment>
                <div
                    className={cx(
                        styles.blockEmbedWrapper,
                        this.props.service,
                        this.props.uuid
                    )}
                    ref={this.setWrapperRef}>
                    {prototype
                        ? this._renderPrototypeIframe(embed)
                        : this._renderPlaceholder()}
                </div>
                <PersistentBar
                    service={this.props.service}
                    onClick={this.handleModalOpen}
                    originalLink={this.props.originalLink}
                    name={get(prototype, 'name')}
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
    getPrototypeSize = (
        prototype: PrototypeEmbedContainer['state']['prototype']
    ) => {
        if (prototype) {
            return {
                height: prototype.height,
                width: prototype.width
            }
        }
        return getEmbedSize(this, styles.extendedInfo)
    }
    render() {
        return (
            <Subscribe to={[PrototypeEmbedContainer]}>
                {(embed: PrototypeEmbedContainer) => {
                    if (embed.state.unviewable) {
                        return (
                            <ServiceErrorEmbed
                                service={embed.state.service}
                                originalLink={embed.state.originalLink!}
                                tooltipText={CROSS_TEAM_FAILURE}
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
                            maxHeight={this._getMaxHeight(embed)}
                            getEmbedSize={() =>
                                this.getPrototypeSize(embed.state.prototype)
                            }
                            hasOpenThread={embed.state.hasOpenThread || false}
                        />
                    )
                }}
            </Subscribe>
        )
    }
}
