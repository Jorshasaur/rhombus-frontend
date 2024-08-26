import Panzoom from '@panzoom/panzoom'
import { MutableRefObject, useCallback } from 'react'
import {
    DEFAULT_X_POSITION,
    DEFAULT_Y_POSITION,
    ImageSizeObject,
    MARGIN
} from '../ImageCarouselConstants'
import { usePositioningData } from './usePositioningData'

export function useConstrainPan(
    panzoom: MutableRefObject<ReturnType<typeof Panzoom> | undefined>,
    middleImageElement: MutableRefObject<HTMLImageElement | null>,
    middleImageSize: ImageSizeObject
) {
    const getPositioningData = usePositioningData(
        panzoom,
        middleImageElement,
        middleImageSize
    )

    // Keep the image within it's margins when panning
    const constrainPan = useCallback(
        (x: number, y: number, scale?: number) => {
            const {
                imageOverflowX,
                imageOverflowY,
                scaledImageWidth,
                scaledImageHeight
            } = getPositioningData(scale)

            let constrainedX = x
            let constrainedY = y

            if (middleImageElement.current?.parentElement) {
                // prettier-ignore
                const leftMargin =
                    (scaledImageWidth - middleImageElement.current.parentElement.clientWidth) / 2
                    + MARGIN
                    + DEFAULT_X_POSITION

                // prettier-ignore
                const rightMargin =
                    DEFAULT_X_POSITION
                    - MARGIN
                    - (scaledImageWidth - middleImageElement.current.parentElement.clientWidth) / 2

                // prettier-ignore
                const topMargin =
                    (scaledImageHeight - middleImageElement.current.parentElement.clientHeight) / 2
                    + MARGIN
                    + DEFAULT_Y_POSITION

                // prettier-ignore
                const bottomMargin =
                    DEFAULT_Y_POSITION
                    - MARGIN
                    - (scaledImageHeight - middleImageElement.current.parentElement.clientHeight) / 2

                const largerThanContainerAndWithinLeftMargin =
                    imageOverflowX && constrainedX > leftMargin
                const smallerThanContainerAndOutsideLeftMargin =
                    !imageOverflowX && constrainedX < leftMargin
                const largerThanContainerAndWithinRightMargin =
                    imageOverflowX && constrainedX < rightMargin
                const smallerThanContainerAndOutsideRightMargin =
                    !imageOverflowX && constrainedX > rightMargin

                if (
                    largerThanContainerAndWithinLeftMargin ||
                    smallerThanContainerAndOutsideLeftMargin
                ) {
                    constrainedX = leftMargin
                } else if (
                    largerThanContainerAndWithinRightMargin ||
                    smallerThanContainerAndOutsideRightMargin
                ) {
                    constrainedX = rightMargin
                }

                const largerThanContainerAndWithinTopMargin =
                    imageOverflowY && constrainedY > topMargin
                const smallerThanContainerAndOutsideTopMargin =
                    !imageOverflowY && constrainedY < topMargin
                const largerThanContainerAndWithinBottomMargin =
                    imageOverflowY && constrainedY < bottomMargin
                const smallerThanContainerAndOutsideBottomMargin =
                    !imageOverflowY && constrainedY > bottomMargin

                if (
                    largerThanContainerAndWithinTopMargin ||
                    smallerThanContainerAndOutsideTopMargin
                ) {
                    constrainedY = topMargin
                } else if (
                    largerThanContainerAndWithinBottomMargin ||
                    smallerThanContainerAndOutsideBottomMargin
                ) {
                    constrainedY = bottomMargin
                }
            }

            return {
                constrainedX,
                constrainedY
            }
        },
        [middleImageElement, getPositioningData]
    )

    return constrainPan
}
