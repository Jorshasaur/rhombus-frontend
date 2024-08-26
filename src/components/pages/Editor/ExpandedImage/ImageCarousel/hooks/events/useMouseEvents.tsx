import { MutableRefObject, useCallback } from 'react'
import {
    ImageSizeObject,
    PanObject,
    WHEEL_ZOOM_STEP_MULTIPLIER
} from '../../ImageCarouselConstants'
import { useInitialScale } from '../useInitialScale'
import { usePan } from '../usePan'
import { usePanzoom } from '../usePanZoom'
import { useZoom } from '../useZoom'

export function useMouseEvents(
    panzoomHandler: ReturnType<typeof usePanzoom>,
    zoomHandler: ReturnType<typeof useZoom>,
    middleImageElement: MutableRefObject<HTMLImageElement | null>,
    mouseDownPosition: MutableRefObject<PanObject | null>,
    mousePosition: MutableRefObject<PanObject | null>,
    middleImageSize: ImageSizeObject
): {
    handleClick: () => void
    handlePointerMove: (event: React.PointerEvent<HTMLImageElement>) => void
    handleWheel: (event: WheelEvent) => void
} {
    const { panzoom } = panzoomHandler
    const { zoom, zoomToFit, zoomToFullSize } = zoomHandler
    const initialScale = useInitialScale(middleImageSize)
    const pan = usePan(panzoomHandler, middleImageElement, middleImageSize)
    // Handler to toggle the image to 100% on click
    const handleClick = useCallback(() => {
        const sameX = mouseDownPosition.current?.x === mousePosition.current?.x
        const sameY = mouseDownPosition.current?.y === mousePosition.current?.y
        const clickWithoutPan = sameX && sameY

        if (clickWithoutPan) {
            const scale = panzoom.current?.getScale()

            // If scale is not "fit to container" (i.e. the initial scale of one), fit it
            // Otherwise zoom to 100% of the image size
            if (scale !== initialScale) {
                zoomToFit()
            } else {
                zoomToFullSize()
            }
        }
        mouseDownPosition.current = null
        mousePosition.current = null
    }, [
        panzoom,
        mouseDownPosition,
        mousePosition,
        zoomToFit,
        zoomToFullSize,
        initialScale
    ])

    // Handler to move the image on drag
    const handlePointerMove = useCallback(
        (event: React.PointerEvent<HTMLImageElement>) => {
            const { clientX, clientY } = event

            const mouseIsDown = mouseDownPosition.current
            const pointerHasMoved =
                mousePosition.current &&
                (clientX !== mousePosition.current.x ||
                    clientY !== mousePosition.current.y)

            // Only pan the image if the mouse is down,
            // the mouse has moved,
            // and the image overflows it's container
            const canPan = mouseIsDown && pointerHasMoved

            if (canPan && mousePosition.current) {
                pan(
                    clientX - mousePosition.current.x,
                    clientY - mousePosition.current.y
                )
            }

            mousePosition.current = { x: clientX, y: clientY }
        },
        [pan, mouseDownPosition, mousePosition]
    )

    // Pan the image when scrolling
    // Zoom when holding meta/ctrl
    const handleWheel = useCallback(
        (event: WheelEvent) => {
            if (panzoom.current) {
                let { deltaX, deltaY } = event
                deltaX = deltaX * -1
                deltaY = deltaY * -1
                if (event.metaKey || event.ctrlKey) {
                    const scale = panzoom.current.getScale()
                    zoom(scale, deltaY * WHEEL_ZOOM_STEP_MULTIPLIER, false)
                    return
                }

                pan(deltaX, deltaY)
            }
        },
        [pan, panzoom, zoom]
    )

    return {
        handleClick,
        handlePointerMove,
        handleWheel
    }
}
