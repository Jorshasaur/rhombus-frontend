import { MutableRefObject, useCallback } from 'react'
import { ImageSizeObject } from '../ImageCarouselConstants'
import { useConstrainPan } from './useConstrainPan'
import { useInitialScale } from './useInitialScale'
import { usePanzoom } from './usePanZoom'
import { usePositioningData } from './usePositioningData'

export function usePan(
    panzoomHandler: ReturnType<typeof usePanzoom>,
    middleImageElement: MutableRefObject<HTMLImageElement | null>,
    middleImageSize: ImageSizeObject
) {
    const { panzoom, setPanzoomStyle } = panzoomHandler
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

    const pan = useCallback(
        (deltaX: number, deltaY: number) => {
            const { x, y, scale } = getPositioningData()

            let moveX = x
            let moveY = y

            // If the scale is greater than zoom to fit, pan
            if (scale > initialScale) {
                moveX = x + deltaX
                moveY = y + deltaY
            }

            const { constrainedX, constrainedY } = constrainPan(moveX, moveY)
            // If panning past the maximum or minimum margins, stop at the margin.
            moveX = constrainedX
            moveY = constrainedY

            setPanzoomStyle(0, { x: moveX, y: moveY, scale })
            panzoom.current!.pan(moveX, moveY, { force: true, animate: false })
        },
        [
            getPositioningData,
            constrainPan,
            setPanzoomStyle,
            panzoom,
            initialScale
        ]
    )

    return pan
}
