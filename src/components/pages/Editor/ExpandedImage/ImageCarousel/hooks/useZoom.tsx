import { MutableRefObject, useCallback } from 'react'
import {
    DEFAULT_X_POSITION,
    DEFAULT_Y_POSITION,
    ImageSizeObject,
    IMAGE_TRANSITION_TIME,
    KEYBOARD_ZOOM_TRANSITION_TIME,
    MAX_SCALE_MULTIPLIER
} from '../ImageCarouselConstants'
import { useConstrainPan } from './useConstrainPan'
import { useFullSizeScale } from './useFullSizeScale'
import { useInitialScale } from './useInitialScale'
import { usePanzoom } from './usePanZoom'
import { usePositioningData } from './usePositioningData'

export type Zoom = (
    scale: number,
    changeAmount: number,
    animate?: boolean
) => void
export type ResetZoom = () => void
export type ZoomToFullSize = () => void
export type ZoomToFit = () => void

export function useZoom(
    panzoomHandler: ReturnType<typeof usePanzoom>,
    middleImageSize: ImageSizeObject,
    middleImageElement: MutableRefObject<HTMLImageElement | null>
): {
    zoom: Zoom
    resetZoom: ResetZoom
    zoomToFullSize: ZoomToFullSize
    zoomToFit: ZoomToFit
} {
    const { panzoom, setPanzoomStyle, updatePanZoom } = panzoomHandler
    const fullSizeScale = useFullSizeScale(middleImageSize, middleImageElement)
    const getPositioningData = usePositioningData(
        panzoom,
        middleImageElement,
        middleImageSize
    )
    const constrainPan = useConstrainPan(
        panzoom,
        middleImageElement,
        middleImageSize
    )
    const initialScale = useInitialScale(middleImageSize)

    // Function to reset zoom to it's initial state, primarily when changing to a new image
    const resetZoom = useCallback(() => {
        setPanzoomStyle(0)
        setTimeout(() => panzoom.current?.zoom(initialScale))
    }, [panzoom, setPanzoomStyle, initialScale])

    const zoomToFullSize = useCallback(() => {
        // Animate first for performance
        setPanzoomStyle(IMAGE_TRANSITION_TIME, {
            x: DEFAULT_X_POSITION,
            y: DEFAULT_Y_POSITION,
            scale: fullSizeScale
        })

        // Then update the pan zoom object
        setTimeout(() => {
            updatePanZoom(DEFAULT_X_POSITION, DEFAULT_Y_POSITION, fullSizeScale)
        }, IMAGE_TRANSITION_TIME)
    }, [setPanzoomStyle, updatePanZoom, fullSizeScale])

    // Set the scale of the image back to it's initial state
    const zoomToFit = useCallback(() => {
        const scale = initialScale
        // Animate first for performance
        setPanzoomStyle(IMAGE_TRANSITION_TIME, {
            x: DEFAULT_X_POSITION,
            y: DEFAULT_Y_POSITION,
            scale
        })
        // Then update the pan zoom object
        setTimeout(() => {
            updatePanZoom(DEFAULT_X_POSITION, DEFAULT_Y_POSITION, scale)
        }, IMAGE_TRANSITION_TIME)
    }, [setPanzoomStyle, updatePanZoom, initialScale])

    const handleZoomOut = useCallback(
        (scale: number, toScale: number, change: number, animate: boolean) => {
            const { x, y } = getPositioningData(toScale)
            // Calculate how big of a step we are taking
            const step = scale - toScale

            // Calculate how many of those steps it would take to get back to the original scale
            let stepsToOriginal = (scale - initialScale) / step

            // If the steps are less than 0, set it to 1 (This shouldn't happen, but just in case)
            if (stepsToOriginal <= 0) {
                stepsToOriginal = 1
            }

            // Calculate how long a step should be at the current scale
            const stepLengthX = (DEFAULT_X_POSITION - x) / stepsToOriginal
            const stepLengthY = (DEFAULT_Y_POSITION - y) / stepsToOriginal

            let toX = x + stepLengthX
            let toY = y + stepLengthY

            // Translate the step position to the new scale
            toX = DEFAULT_X_POSITION + change * (toX - DEFAULT_X_POSITION)
            toY = DEFAULT_Y_POSITION + change * (toY - DEFAULT_Y_POSITION)

            // If panning past the maximum or minimum margins, stop at the margin.
            const { constrainedX, constrainedY } = constrainPan(
                toX,
                toY,
                toScale
            )
            toX = constrainedX
            toY = constrainedY

            panzoom.current?.pan(toX, toY, { force: true })
            panzoom.current?.zoom(toScale, { animate })
        },
        [getPositioningData, constrainPan, panzoom, initialScale]
    )

    const handleZoomIn = useCallback(
        (toScale: number, change: number, animate: boolean) => {
            const { x, y } = getPositioningData(toScale)
            // Translate the coordinates to the new scale
            let toX = x * change
            let toY = y * change

            // If panning past the maximum or minimum margins, stop at the margin.
            const { constrainedX, constrainedY } = constrainPan(
                toX,
                toY,
                toScale
            )
            toX = constrainedX
            toY = constrainedY

            panzoom.current?.pan(toX, toY, { force: true })
            panzoom.current?.zoom(toScale, { animate })
        },
        [constrainPan, getPositioningData, panzoom]
    )

    const zoom = useCallback(
        (scale: number, changeAmount: number, animate = true) => {
            let toScale = scale + changeAmount

            // If change would exceed the maximum allowed scale, set it to the maximum allowed scale
            const exceedsMaxScale =
                changeAmount >= 0 &&
                fullSizeScale > scale &&
                fullSizeScale < toScale

            if (exceedsMaxScale) {
                toScale = fullSizeScale
            }

            // If change is less than the initial scale set it to the initial scale
            if (toScale < initialScale) {
                toScale = initialScale
            }

            // If there is a change in scale after the above adjustments, update the scale
            if (middleImageElement.current && scale !== toScale) {
                // Set transition timing
                if (animate) {
                    setPanzoomStyle(KEYBOARD_ZOOM_TRANSITION_TIME)
                }

                const { scaledImageWidth } = getPositioningData(toScale)

                // Get the ratio of the change
                const change =
                    scaledImageWidth /
                    (middleImageElement.current.clientWidth * scale)

                const isZoomingIn =
                    changeAmount > 0 &&
                    toScale <= fullSizeScale * MAX_SCALE_MULTIPLIER
                const isZoomingOut = changeAmount < 0 && toScale >= initialScale

                if (isZoomingOut) {
                    handleZoomOut(scale, toScale, change, animate)
                } else if (isZoomingIn) {
                    handleZoomIn(toScale, change, animate)
                }
            }
        },
        [
            fullSizeScale,
            initialScale,
            middleImageElement,
            getPositioningData,
            setPanzoomStyle,
            handleZoomOut,
            handleZoomIn
        ]
    )

    return { zoom, resetZoom, zoomToFullSize, zoomToFit }
}
