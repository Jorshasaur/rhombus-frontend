import Panzoom from '@panzoom/panzoom'
import { MutableRefObject, useCallback } from 'react'
import {
    DEFAULT_X_POSITION,
    DEFAULT_Y_POSITION,
    ImageSizeObject,
    MARGIN
} from '../ImageCarouselConstants'
import { useInitialScale } from './useInitialScale'

export function usePositioningData(
    panzoom: MutableRefObject<ReturnType<typeof Panzoom> | undefined>,
    middleImageElement: MutableRefObject<HTMLImageElement | null>,
    middleImageSize: ImageSizeObject
) {
    const initialScale = useInitialScale(middleImageSize)

    const getPositioningData = useCallback(
        (existingScale?: number) => {
            const panZoomObject = panzoom.current
            const panZoomScale = panZoomObject?.getScale() ?? initialScale
            const scale = existingScale || panZoomScale

            const middleImageElementWidth =
                middleImageElement.current?.clientWidth ?? 0
            const middleImageElementHeight =
                middleImageElement.current?.clientHeight ?? 0

            const scaledImageWidth = middleImageElementWidth * scale
            const scaledImageHeight = middleImageElementHeight * scale

            const parentElementWidth =
                middleImageElement.current?.parentElement?.clientWidth ?? 0
            const parentElementHeight =
                middleImageElement.current?.parentElement?.clientHeight ?? 0

            return {
                scale,
                scaledImageWidth,
                scaledImageHeight,
                x: panZoomObject?.getPan().x ?? DEFAULT_X_POSITION,
                y: panZoomObject?.getPan().y ?? DEFAULT_Y_POSITION,
                imageOverflowX:
                    scaledImageWidth > parentElementWidth - MARGIN * 2,
                imageOverflowY:
                    scaledImageHeight > parentElementHeight - MARGIN * 2
            }
        },
        [panzoom, initialScale, middleImageElement]
    )
    return getPositioningData
}
