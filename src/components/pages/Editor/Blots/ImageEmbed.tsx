import { Skeleton } from '@invisionapp/helios'
import theme from '@invisionapp/helios/css/theme'
import cx from 'classnames'
import { uniqueId } from 'lodash'
import PubSub from 'pubsub-js'
import * as React from 'react'
import {
    ConnectDragPreview,
    ConnectDragSource,
    DragSource,
    DragSourceConnector,
    DragSourceMonitor,
    DndProvider
} from 'react-dnd'
import ReactDndHTML5Backend from 'react-dnd-html5-backend'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { ThemeProvider } from 'styled-components'
import { Subscribe } from 'unstated'
import EmbedInteractionAnalytics from '../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import { IMAGE_EMBED_CLASS_NAME } from '../../../../constants/embeds'
import { DEFAULT_RATIO } from '../../../../constants/styles'
import {
    DOCUMENT_CHANGE_REPOSITION,
    DOCUMENT_CHANGE_UPDATE
} from '../../../../constants/topics'
import { getAuthor } from '../../../../data/authors/selectors'
import { imagesActionCreators } from '../../../../data/images'
import { RootState } from '../../../../data/reducers'
import store from '../../../../data/store'
import {
    getContainerWidth,
    getEmbedStyles
} from '../../../../helpers/EmbedHelper'
import { Asset } from '../../../../interfaces/asset'
import { BlotSize } from '../../../../interfaces/blotSize'
import {
    calculateAspectRatio,
    getImageScaleFactor
} from '../../../../lib/utils'
import LineDragItemType from '../LineDrag/LineDragItemType'
import LineDragSource from '../LineDrag/LineDragSource'
import blotsStyles from './Blots.module.css'
import styles from './ImageEmbed.module.css'
import ImageEmbedContainer from './ImageEmbedContainer'
import { Timestamp } from './Timestamp'
import Comment from '../../../../assets/images/icons/line-controls/comment.svg'

interface ImageEmbedWrapperProps {
    service: string
    uuid: string
    authorId: string
    embedData: any
    version: number
    createdAt: string
    container: HTMLElement
    insidePane: boolean
}

interface ImageEmbedProps {
    asset: Asset | undefined
    dataUrl?: string
    embedData?: ImageEmbedData
    uuid?: string
    index: number
    navigationHeight: number
    authorId: string
    createdAt?: string
    size?: BlotSize
    canEdit?: boolean
    container: HTMLElement
    hasOpenThread: boolean
    insidePane: boolean
    addComment: () => void

    // Injected by React DnD
    connectDragPreview?: ConnectDragPreview
    connectDragSource?: ConnectDragSource
}

interface ImageEmbedState {
    width: number
    height: number
    loaded?: boolean
    size?: BlotSize
    hideTimeStamp: boolean
    containerWidth: number
}

interface ImageEmbedData {
    width?: number
    height?: number
    url?: string
    threadIds?: string[]
}

function collect(connectDrag: DragSourceConnector, monitor: DragSourceMonitor) {
    return {
        connectDragSource: connectDrag.dragSource(),
        connectDragPreview: connectDrag.dragPreview()
    }
}

class ImageEmbedComponent extends React.Component<
    ImageEmbedProps,
    ImageEmbedState
> {
    clickId: string
    imageId: string

    constructor(props: ImageEmbedProps) {
        super(props)

        this.state = {
            width: 0,
            height: 0,
            loaded: false,
            size: BlotSize.Small,
            hideTimeStamp: false,
            containerWidth: 0
        }
        this.clickId = this.imageId = uniqueId('image_')
    }

    public componentDidMount() {
        const { connectDragPreview } = this.props
        if (connectDragPreview) {
            // Use empty image as a drag preview so browsers don't draw it
            // and we can draw whatever we want on the custom drag layer instead.
            connectDragPreview(getEmptyImage())
        }
        window.addEventListener('resize', this._setContainerWidth)
        this._setContainerWidth()
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this._setContainerWidth)
    }

    public componentWillReceiveProps(nextProps: ImageEmbedProps) {
        if (nextProps.size !== this.props.size) {
            this.setState({ hideTimeStamp: true })
        }
    }

    _setImageState = (img: HTMLImageElement, loaded?: boolean) => {
        const state = {
            width: img.naturalWidth,
            height: img.naturalHeight,
            hideTimeStamp: false,
            loaded
        }
        if (loaded != null) {
            state.loaded = true
        }

        this.setState(state)
    }

    _onLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        this._setImageState(e.target as HTMLImageElement, true)
        PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)
    }

    _onDataUrlLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        this._setImageState(e.target as HTMLImageElement)
    }
    _getCreatedAt = (): string | undefined => {
        const { createdAt, asset } = this.props
        let createdAtData

        // If embed has createdAt, use it, otherwise fall back to the asset's createdAt date
        if (createdAt) {
            createdAtData = createdAt
        } else if (asset && asset.createdAt) {
            createdAtData = asset.createdAt
        }
        return createdAtData
    }

    private _getAuthorName = (id: string) =>
        getAuthor(store.getState() as RootState, id)

    _onExpandImage = (e: any) => {
        e.preventDefault()
        e.stopPropagation()

        if (e.target && e.target.id) {
            new EmbedInteractionAnalytics().onExpanded().track()
            if (this.imageId) {
                store.dispatch(imagesActionCreators.expandImage(this.imageId))
            }
        }
    }

    _onImageTransitionEnd = (e: any) => {
        PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)
        PubSub.publish(DOCUMENT_CHANGE_REPOSITION, null)
        this.setState({ hideTimeStamp: false })
    }

    _setContainerWidth = () => {
        const container = this.props.container as HTMLDivElement
        const containerWidth = getContainerWidth(container)

        if (this.state.containerWidth !== containerWidth) {
            this.setState({ containerWidth })
        }
    }
    _getImageStyle = (
        width: number,
        ratio: number,
        imageScaleFactor: number
    ) => {
        const imageStyle: React.CSSProperties = {}
        const { size } = this.props
        const { containerWidth } = this.state
        if (size && size === BlotSize.Small) {
            width /= imageScaleFactor

            if (width >= this.state.containerWidth * 0.5) {
                imageStyle.width = containerWidth * 0.5
                imageStyle.height = containerWidth * 0.5 * ratio
            } else {
                imageStyle.width = width
                imageStyle.height = width * ratio
            }
        } else if (size) {
            const container = this.props.container as HTMLDivElement
            const embedStyles = getEmbedStyles(
                ratio,
                container,
                size,
                this.props.hasOpenThread
            )

            imageStyle.width = embedStyles.width
            imageStyle.left = embedStyles.left
            imageStyle.height = embedStyles.height
        }

        return imageStyle
    }

    _getStyle = (width: number, ratio: number, imageScaleFactor: number) => {
        const { containerWidth } = this.state
        const { size } = this.props
        const style: React.CSSProperties = {}
        if (size && size === BlotSize.Small) {
            width /= imageScaleFactor

            if (width >= this.state.containerWidth * 0.5) {
                style.width = '50%'
                style.height = containerWidth * 0.5 * ratio
            } else {
                style.width = width
                style.height = width * ratio
            }
        } else if (size) {
            const container = this.props.container as HTMLDivElement
            const embedStyles = getEmbedStyles(
                ratio,
                container,
                size,
                this.props.hasOpenThread
            )

            style.width = size === BlotSize.Medium ? '100%' : undefined
            style.height = embedStyles.height
        }
        return style
    }
    _getSkeleton = (
        ratio: number,
        imageStyle: React.CSSProperties,
        size?: BlotSize
    ) => {
        if (size && size === BlotSize.Large) {
            return (
                <div
                    style={{
                        ...imageStyle,
                        position: 'absolute'
                    }}>
                    <Skeleton ratio={ratio} />
                </div>
            )
        }
        return <Skeleton ratio={ratio} />
    }

    _renderTimestamp = (style: React.CSSProperties, createdAt?: string) => {
        if (this.state.hideTimeStamp || this.props.insidePane) {
            return null
        }
        const author = this._getAuthorName(this.props.authorId)
        return (
            <Timestamp
                author={author}
                createdAt={createdAt}
                width={style.width}
                style={{
                    width: style.width,
                    left: style.left
                }}
            />
        )
    }

    _renderCommentButton() {
        if (!this.props.insidePane) {
            return null
        }
        return (
            <button
                data-allow-propagation="true"
                data-testid="image-embed__comment"
                className={blotsStyles.comment}
                onMouseDown={this.props.addComment}>
                <Comment />
            </button>
        )
    }

    render() {
        const {
            asset,
            dataUrl,
            embedData,
            connectDragSource,
            createdAt,
            canEdit,
            size
        } = this.props
        let { width, height, loaded } = this.state
        let ratio = 0

        let imageScaleFactor = 1
        if (asset != null && asset.fileName != null) {
            imageScaleFactor = getImageScaleFactor(asset.fileName)
        }

        if (embedData != null && embedData.width! > 0) {
            ratio = calculateAspectRatio(embedData.width!, embedData.height!)
            width = embedData.width!
        } else if (width > 0) {
            ratio = calculateAspectRatio(width, height)
        }

        let imageComponent: JSX.Element | undefined

        const style = this._getStyle(width, ratio, imageScaleFactor)

        const imageStyle = this._getImageStyle(width, ratio, imageScaleFactor)

        // image loaded
        if (asset != null) {
            const createdAtData = this._getCreatedAt()
            // image from assets api
            if (loaded) {
                imageComponent = (
                    <div
                        className={styles.imageEmbedNodeWrapper}
                        style={{
                            height: style.height
                        }}>
                        <img
                            src={asset.url}
                            id={this.clickId}
                            data-filename={asset.fileName}
                            data-author-id={this.props.authorId}
                            data-size={size}
                            className={styles.imageEmbedNode}
                            onTransitionEnd={this._onImageTransitionEnd}
                            style={imageStyle}
                        />
                        {this._renderTimestamp(imageStyle, createdAtData)}
                        {this._renderCommentButton()}
                    </div>
                )
            } else if (dataUrl != null) {
                // downloading uploaded image
                imageComponent = (
                    <div
                        className={styles.uploadPlaceholder}
                        style={{
                            height: style.height
                        }}>
                        <img
                            className={styles.imageEmbedNode}
                            style={{ display: 'none' }}
                            src={asset.url}
                            onLoad={this._onLoad}
                        />
                        <img
                            src={dataUrl}
                            className={styles.imageEmbedNode}
                            style={{
                                ...imageStyle,
                                zIndex: 1
                            }}
                        />
                        {this._getSkeleton(ratio, imageStyle, size)}
                        {this._renderTimestamp(imageStyle, createdAtData)}
                    </div>
                )
            } else {
                // downloading image
                imageComponent = (
                    <div
                        className={styles.uploadPlaceholder}
                        style={{
                            height: style.height
                        }}>
                        <img
                            className={styles.imageEmbedNode}
                            style={{ display: 'none' }}
                            src={asset.url}
                            onLoad={this._onLoad}
                        />
                        {this._renderTimestamp(imageStyle, createdAtData)}
                        {this._getSkeleton(ratio, imageStyle, size)}
                    </div>
                )
            }
        } else if (dataUrl != null) {
            // uploading image data url
            imageComponent = (
                <div
                    className={styles.uploadPlaceholder}
                    style={{
                        height: style.height
                    }}>
                    <img
                        src={dataUrl}
                        className={styles.imageEmbedNode}
                        onLoad={this._onDataUrlLoad}
                        style={{
                            ...imageStyle,
                            zIndex: 1
                        }}
                    />
                    {this._renderTimestamp(imageStyle, createdAt)}
                    {this._getSkeleton(ratio, imageStyle, size)}
                </div>
            )
        } else if (embedData != null && embedData.url != null) {
            // image from external url
            if (loaded) {
                // image loaded
                imageComponent = (
                    <div
                        className={styles.imageEmbedNodeWrapper}
                        style={{
                            height: style.height
                        }}>
                        <img
                            src={embedData.url}
                            className={styles.imageEmbedNode}
                            id={this.clickId}
                            data-filename="Untitled"
                            data-author-id={this.props.authorId}
                            style={imageStyle}
                        />
                        {this._renderTimestamp(imageStyle, createdAt)}
                    </div>
                )
            } else {
                // downloading image
                imageComponent = (
                    <div
                        className={styles.uploadPlaceholder}
                        style={{
                            height: style.height
                        }}>
                        <img
                            className={styles.imageEmbedNode}
                            style={{ display: 'none' }}
                            src={embedData.url}
                            onLoad={this._onLoad}
                        />
                        {this._getSkeleton(ratio, imageStyle, size)}
                        {this._renderTimestamp(imageStyle, createdAt)}
                    </div>
                )
            }
        } else if (embedData != null && embedData.width != null) {
            imageComponent = (
                <div
                    className={styles.uploadPlaceholder}
                    style={{
                        height: style.height
                    }}>
                    {this._getSkeleton(ratio, imageStyle, size)}
                    {this._renderTimestamp(imageStyle, createdAt)}
                </div>
            )
        } else {
            imageComponent = this._getSkeleton(DEFAULT_RATIO, imageStyle)
            style.width = '100%'
        }

        const component = (
            <div
                className={cx(
                    IMAGE_EMBED_CLASS_NAME,
                    blotsStyles.image,
                    this.props.uuid,
                    styles.imageEmbedNodeContainer
                )}
                data-image-id={this.imageId}
                style={style}
                onTransitionEnd={this._onImageTransitionEnd}
                onClick={(e) => this._onExpandImage(e)}>
                {imageComponent}
            </div>
        )
        return canEdit
            ? connectDragSource!(component, { dropEffect: 'none' })
            : component
    }
}

const ImageEmbed = DragSource<ImageEmbedProps>(
    LineDragItemType,
    LineDragSource,
    collect
)(ImageEmbedComponent)

export default class ImageEmbedWrapper extends React.Component<
    ImageEmbedWrapperProps
> {
    render() {
        return (
            <Subscribe to={[ImageEmbedContainer]}>
                {(embed: ImageEmbedContainer) => {
                    const { asset, embedData } = embed.state
                    return (
                        <ThemeProvider theme={theme}>
                            <DndProvider backend={ReactDndHTML5Backend}>
                                <ImageEmbed
                                    asset={asset}
                                    dataUrl={embed.state.dataUrl}
                                    embedData={embedData}
                                    uuid={this.props.uuid}
                                    index={embed.state.index}
                                    navigationHeight={
                                        embed.state.navigationHeight
                                    }
                                    authorId={embed.state.authorId}
                                    createdAt={embed.state.createdAt}
                                    size={embed.state.size}
                                    canEdit={embed.state.canEdit}
                                    container={this.props.container}
                                    hasOpenThread={
                                        embed.state.hasOpenThread || false
                                    }
                                    insidePane={this.props.insidePane}
                                    addComment={embed.addComment}
                                />
                            </DndProvider>
                        </ThemeProvider>
                    )
                }}
            </Subscribe>
        )
    }
}
