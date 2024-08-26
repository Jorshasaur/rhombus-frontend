import NavigateLeft from '@invisionapp/helios/icons/NavigateLeft'
import NavigateRight from '@invisionapp/helios/icons/NavigateRight'
import cx from 'classnames'
import React, {
    TransitionEvent,
    useCallback,
    useEffect,
    useRef,
    useState
} from 'react'
import EmbedInteractionAnalytics from '../../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import {
    ActiveImageInfo,
    ImageCarouselData
} from '../../../../../data/images/interfaces'
import { useEventListener } from '../../../../../hooks/useEventListener'
import { getImageSize } from '../../../../../lib/utils'
import ExpandedImageHeader from '../ExpandedImageHeader/ExpandedImageHeader'
import { useKeyboardEvents } from './hooks/events/useKeyboardEvents'
import { useMouseEvents } from './hooks/events/useMouseEvents'
import { usePanzoomEvents } from './hooks/events/usePanzoomEvents'
import { useFullSizeScale } from './hooks/useFullSizeScale'
import { usePanzoom } from './hooks/usePanZoom'
import { usePositioningData } from './hooks/usePositioningData'
import { useZoom } from './hooks/useZoom'
import styles from './ImageCarousel.module.css'
import {
    DEFAULT_X_POSITION,
    DEFAULT_Y_POSITION,
    DIRECTION,
    ImageSizeObject,
    INITIAL_CURRENT_SCALE,
    MARGIN,
    MAX_SCALE_MULTIPLIER,
    PanObject,
    PANZOOM_OPTIONS,
    ZOOM_STEP_DOWN,
    ZOOM_STEP_UP
} from './ImageCarouselConstants'
import { ZoomControl } from './ZoomControl/ZoomControl'

interface Props {
    imageCarousel: ImageCarouselData
    onMouseDown: (mouseDown: boolean) => void
    nextImage: () => void
    previousImage: () => void
    onKeyDown: () => void
    onZoom: () => void
    showArrows: boolean
    showImages: boolean
    onClose: () => void
    activeImageInfo: ActiveImageInfo
}

export function ImageCarousel(props: Props) {
    const middleImageElement = useRef<HTMLImageElement>(null)
    const leftImageElement = useRef<HTMLImageElement>(null)
    const rightImageElement = useRef<HTMLImageElement>(null)
    const middleEl = useRef<HTMLDivElement>(null)
    const panzoomWrapper = useRef<HTMLDivElement>(null)
    const mousePosition = useRef<PanObject | null>(null)
    const mouseDownPosition = useRef<PanObject | null>(null)

    const [leftImageSize, setLeftImageSize] = useState<ImageSizeObject>({})
    const [middleImageSize, setMiddleImageSize] = useState<ImageSizeObject>({})
    const [rightImageSize, setRightImageSize] = useState<ImageSizeObject>({})
    const [currentScale, setCurrentScale] = useState<number>(
        INITIAL_CURRENT_SCALE
    )
    const [direction, setDirection] = useState(DIRECTION.NONE)

    const { imageCarousel } = props
    const { left, middle, right } = imageCarousel

    const goingRight = direction === DIRECTION.RIGHT
    const goingLeft = direction === DIRECTION.LEFT

    // Custom Hooks
    const panzoomHandler = usePanzoom(
        panzoomWrapper,
        PANZOOM_OPTIONS,
        middleImageSize
    )
    const { panzoom, updatePanZoom } = panzoomHandler

    const fullSizeScale = useFullSizeScale(middleImageSize, middleImageElement)
    const getPositioningData = usePositioningData(
        panzoom,
        middleImageElement,
        middleImageSize
    )

    const zoomHandler = useZoom(
        panzoomHandler,
        middleImageSize,
        middleImageElement
    )
    const { zoom, resetZoom, zoomToFit } = zoomHandler

    // Create and register event listeners
    const { handleClick, handlePointerMove, handleWheel } = useMouseEvents(
        panzoomHandler,
        zoomHandler,
        middleImageElement,
        mouseDownPosition,
        mousePosition,
        middleImageSize
    )

    const handleKeyDown = useKeyboardEvents(
        panzoom,
        zoomHandler,
        setDirection,
        props.onKeyDown
    )

    const { handlePanZoomZoom, handlePanZoomStart } = usePanzoomEvents(
        panzoomHandler,
        middleImageElement,
        setCurrentScale,
        middleImageSize
    )
    useEventListener(document, 'keydown', handleKeyDown)
    useEventListener(document, 'wheel', handleWheel)
    useEventListener(panzoomWrapper.current, 'panzoomzoom', handlePanZoomZoom)
    useEventListener(panzoomWrapper.current, 'panzoomstart', handlePanZoomStart)

    // Set scale size on image load
    const handleImageLoad = useCallback(
        (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
            const { scaledImageWidth } = getPositioningData()
            const loadedImage = event.target as HTMLImageElement
            const fullWidth = parseInt(
                loadedImage.getAttribute('width') || `${scaledImageWidth}`
            )
            const newScale = (scaledImageWidth / fullWidth) * 100

            if (currentScale !== newScale) {
                setCurrentScale(newScale)
            }
        },
        [currentScale, setCurrentScale, getPositioningData]
    )

    const animationDone = (event: TransitionEvent<HTMLDivElement>) => {
        if (direction === DIRECTION.RIGHT) {
            props.previousImage()
        } else if (direction === DIRECTION.LEFT) {
            props.nextImage()
        }

        // If switching to a new image, center it
        if (event.propertyName !== 'transform') {
            updatePanZoom(DEFAULT_X_POSITION, DEFAULT_Y_POSITION)
        }

        setDirection(DIRECTION.NONE)
    }

    // Disable overflow behavior when the detail view is shown
    useEffect(() => {
        document.body.classList.add(styles.showImages)
        return () => {
            document.body.classList.remove(styles.showImages)
        }
    }, [])

    // Update the upward limit the Panzoom scale on image change
    useEffect(() => {
        panzoom.current?.setOptions({
            maxScale: fullSizeScale * MAX_SCALE_MULTIPLIER
        })
    }, [middleImageSize.width, direction, currentScale, fullSizeScale, panzoom])

    // Set image sizes in state
    useEffect(() => {
        setLeftImageSize(getImageSize(left))
    }, [left])
    useEffect(() => {
        setMiddleImageSize(getImageSize(middle))
    }, [middle])
    useEffect(() => {
        setRightImageSize(getImageSize(right))
    }, [right])

    return (
        <div
            className={styles.ImageCarousel}
            style={{ '--margin': `${MARGIN * 2}px` } as any}>
            <div
                className={cx(styles.header, {
                    [styles.showHeader]: props.showArrows
                })}>
                <ExpandedImageHeader
                    fileName={props.activeImageInfo.fileName}
                    createdAt={props.activeImageInfo.createdAt}
                    author={props.activeImageInfo.author}
                    onClose={props.onClose}
                />
            </div>
            <div
                className={cx(styles.imagesContainer, {
                    [styles.showImages]: props.showImages
                })}>
                <div
                    className={cx(styles.container, {
                        [styles.left]: !goingRight,
                        [styles.middle]: goingRight,
                        [styles.moving]: goingRight
                    })}>
                    <img
                        src={left.url}
                        ref={leftImageElement}
                        width={leftImageSize.width}
                    />
                </div>
                <div
                    ref={middleEl}
                    onTransitionEnd={animationDone}
                    className={cx(styles.container, {
                        [styles.left]: goingLeft,
                        [styles.middle]: !goingRight && !goingLeft,
                        [styles.right]: goingRight,
                        [styles.moving]: goingRight || goingLeft
                    })}>
                    <div
                        id="panzoom-wrapper"
                        ref={panzoomWrapper}
                        className={styles.panzoomWrapper}>
                        <img
                            id="active-image"
                            data-testid="active-image"
                            draggable={false}
                            ref={middleImageElement}
                            src={middle.url}
                            width={middleImageSize.width}
                            onLoad={handleImageLoad}
                            onClick={handleClick}
                            onPointerMove={handlePointerMove}
                            onPointerDown={(event) => {
                                mousePosition.current = {
                                    x: event.clientX,
                                    y: event.clientY
                                }
                                props.onMouseDown(true)
                                mouseDownPosition.current = {
                                    x: event.clientX,
                                    y: event.clientY
                                }
                            }}
                            onPointerUp={() => {
                                props.onMouseDown(false)
                            }}
                        />
                    </div>
                </div>
                <div
                    className={cx(styles.container, {
                        [styles.right]: !goingLeft,
                        [styles.middle]: goingLeft,
                        [styles.moving]: goingLeft
                    })}>
                    <img
                        src={right.url}
                        ref={rightImageElement}
                        width={rightImageSize.width}
                    />
                </div>
            </div>

            <button
                className={cx(styles.imageNavigationButton, styles.back, {
                    [styles.showArrows]: props.showArrows
                })}
                data-testid="image-carousel__navigate-back"
                onClick={(
                    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                    e.stopPropagation()
                    resetZoom()
                    setDirection(DIRECTION.RIGHT)
                    new EmbedInteractionAnalytics()
                        .onPaginated()
                        .clickLeft()
                        .track()
                }}>
                <NavigateLeft category="directional" fill="white" size={36} />
            </button>
            <button
                className={cx(styles.imageNavigationButton, styles.forward, {
                    [styles.showArrows]: props.showArrows
                })}
                data-testid="image-carousel__navigate-forward"
                onClick={(
                    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
                ) => {
                    e.stopPropagation()
                    resetZoom()
                    setDirection(DIRECTION.LEFT)
                    new EmbedInteractionAnalytics()
                        .onPaginated()
                        .clickRight()
                        .track()
                }}>
                <NavigateRight category="directional" fill="white" size={36} />
            </button>

            <ZoomControl
                zoomIn={() => {
                    props.onZoom()
                    if (panzoom.current) {
                        const scale = panzoom.current.getScale()
                        zoom(scale, scale * ZOOM_STEP_UP - scale, true)
                    }
                }}
                zoomOut={() => {
                    props.onZoom()
                    if (panzoom.current) {
                        const scale = panzoom.current.getScale()
                        zoom(scale, scale * ZOOM_STEP_DOWN - scale, true)
                    }
                }}
                clickCenter={() => {
                    props.onZoom()
                    zoomToFit()
                }}
                scale={currentScale}
                showZoomControl={props.showArrows}
            />
        </div>
    )
}
