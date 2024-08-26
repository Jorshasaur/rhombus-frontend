import { MutableRefObject, useCallback } from 'react'
import { ImageSizeObject } from '../../ImageCarouselConstants'
import { usePanzoom } from '../usePanZoom'
import { usePositioningData } from '../usePositioningData'

export function usePanzoomEvents(
    panzoomHandler: ReturnType<typeof usePanzoom>,
    middleImageElement: MutableRefObject<HTMLImageElement | null>,
    setCurrentScale: (scale: number) => void,
    middleImageSize: ImageSizeObject
): {
    handlePanZoomZoom: () => void
    handlePanZoomStart: () => void
} {
    const { panzoom, setPanzoomStyle } = panzoomHandler
    const getPositioningData = usePositioningData(
        panzoom,
        middleImageElement,
        middleImageSize
    )

    // Update the scale after zooming in or out
    const handlePanZoomZoom = useCallback(() => {
        const { scaledImageWidth } = getPositioningData()

        const fullWidth = parseInt(
            middleImageElement.current?.getAttribute('width') ??
                `${scaledImageWidth}`
        )
        const newScale = (scaledImageWidth / fullWidth) * 100
        setCurrentScale(newScale)
    }, [getPositioningData, setCurrentScale, middleImageElement])

    // Unset the animation speed when panning the image to stop animation lag
    const handlePanZoomStart = useCallback(() => {
        setPanzoomStyle(0)
    }, [setPanzoomStyle])

    return {
        handlePanZoomZoom,
        handlePanZoomStart
    }
}
