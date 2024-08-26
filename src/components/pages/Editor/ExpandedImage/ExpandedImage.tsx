import cx from 'classnames'
import * as React from 'react'
import { clearInterval, setTimeout } from 'timers'
import {
    ActiveImageInfo,
    ImageCarouselData
} from '../../../../data/images/interfaces'
import { createImageToImageAnimation } from '../../../../helpers/ImageHelper'
import { keycodes } from '../../../../interfaces/keycodes'
import styles from './ExpandedImage.module.css'
import { ImageCarousel } from './ImageCarousel/ImageCarousel'

interface Props {
    activeImageId: string
    activeImageInfo: ActiveImageInfo
    nextImage: () => any
    previousImage: () => any
    imageCarousel: ImageCarouselData
    clearActiveImage: () => any
}

interface State {
    showHeader: boolean
    showBackground: boolean
    showCarousel: boolean
    mouseDown: boolean
}

const HEADER_TIMEOUT = 5000

export default class ExpandedImage extends React.Component<Props, State> {
    mouseMoveWatcher: NodeJS.Timer
    cancelImageIn: (() => void) | undefined
    constructor(props: Props) {
        super(props)
        this.state = {
            showHeader: false,
            showBackground: false,
            showCarousel: false,
            mouseDown: false
        }
        this.showCarousel = this.showCarousel.bind(this)
        this.onClose = this.onClose.bind(this)
        this.onKeyDown = this.onKeyDown.bind(this)
        this.nextImage = this.nextImage.bind(this)
        this.previousImage = this.previousImage.bind(this)
        this.showHeaderAndRemoveListener = this.showHeaderAndRemoveListener.bind(
            this
        )
    }

    componentDidMount() {
        this.setState({
            showBackground: true
        })

        this.showHeaderAndRemoveListener()
        document.addEventListener('keydown', this.onKeyDown)

        const startingImageSelector = `[data-image-id="${this.props.activeImageId}"] img`
        const endingImageSelector = '#active-image'
        this.cancelImageIn = createImageToImageAnimation(
            startingImageSelector,
            endingImageSelector,
            this.showCarousel
        )
    }

    showCarousel() {
        this.setState({
            showCarousel: true
        })
    }

    onClose() {
        this.setState({ showHeader: false }, () => {
            clearInterval(this.mouseMoveWatcher)

            document.removeEventListener(
                'mousemove',
                this.showHeaderAndRemoveListener
            )

            document.removeEventListener('keydown', this.onKeyDown)

            if (typeof this.cancelImageIn === 'function') {
                this.cancelImageIn()
            }

            this.setState({ showBackground: false, showCarousel: false })

            const startingImageSelector = '#active-image'
            const endingImageSelector = `[data-image-id="${this.props.activeImageId}"] img`
            createImageToImageAnimation(
                startingImageSelector,
                endingImageSelector,
                this.props.clearActiveImage
            )
        })
    }

    resetHideMetaCounter() {
        clearInterval(this.mouseMoveWatcher)
        this.mouseMoveWatcher = setTimeout(() => {
            if (this.state.showHeader) {
                this.hideHeaderAndListenForMouseMove()
            }
        }, HEADER_TIMEOUT)
    }

    hideHeaderAndListenForMouseMove() {
        this.setState({ showHeader: false })
        document.addEventListener(
            'mousemove',
            this.showHeaderAndRemoveListener,
            false
        )
    }

    showHeaderAndRemoveListener() {
        if (!this.state.mouseDown) {
            this.setState({ showHeader: true })
            this.resetHideMetaCounter()
            document.removeEventListener(
                'mousemove',
                this.showHeaderAndRemoveListener
            )
        }
    }

    onKeyDown(e: KeyboardEvent) {
        if (e.keyCode === keycodes.Escape) {
            e.stopImmediatePropagation()
            this.onClose()
        }
    }

    nextImage() {
        this.showHeaderAndRemoveListener()
        this.props.nextImage()
    }

    previousImage() {
        this.showHeaderAndRemoveListener()
        this.props.previousImage()
    }

    onZoom() {
        this.showHeaderAndRemoveListener()
    }

    onMouseDown(mouseDown: boolean) {
        this.setState({ mouseDown })
        if (mouseDown) {
            this.hideHeaderAndListenForMouseMove()
        } else {
            this.showHeaderAndRemoveListener()
        }
    }

    render() {
        const activeImageInfo = this.props.activeImageInfo || {
            fileName: '',
            createdAt: '',
            author: ''
        }
        return (
            <div className={styles.expandedImage}>
                <div
                    id="expandedBackground"
                    className={cx(styles.expandedImageBackground, {
                        [styles.expandedImageBackgroundShow]: this.state
                            .showBackground
                    })}
                    onClick={this.onClose}>
                    <div
                        className={styles.expandedImageBackgroundTopGradient}
                    />
                    <div
                        className={styles.expandedImageBackgroundBottomGradient}
                    />
                </div>
                <div className={styles.carousel}>
                    <ImageCarousel
                        activeImageInfo={activeImageInfo}
                        onClose={this.onClose}
                        imageCarousel={this.props.imageCarousel}
                        nextImage={this.nextImage}
                        previousImage={this.previousImage}
                        onKeyDown={this.showHeaderAndRemoveListener}
                        showArrows={this.state.showHeader}
                        showImages={this.state.showCarousel}
                        onZoom={() => {
                            this.onZoom()
                        }}
                        onMouseDown={(mouseDown) => {
                            this.onMouseDown(mouseDown)
                        }}
                    />
                </div>
            </div>
        )
    }
}
