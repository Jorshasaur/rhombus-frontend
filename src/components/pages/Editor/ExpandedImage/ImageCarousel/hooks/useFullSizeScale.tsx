import { MutableRefObject } from 'react'
import { ImageSizeObject } from '../ImageCarouselConstants'

export function useFullSizeScale(
    middleImageSize: ImageSizeObject,
    middleImageElement: MutableRefObject<HTMLImageElement | null>
) {
    const fullSizeImageWidth = middleImageSize.width || 1

    const fitToScreenWidth =
        middleImageElement?.current?.clientWidth || fullSizeImageWidth
    return fullSizeImageWidth / fitToScreenWidth
}
