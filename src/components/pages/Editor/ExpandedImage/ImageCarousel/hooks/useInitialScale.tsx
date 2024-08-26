import { useEffect, useState } from 'react'
import { ImageSizeObject, INITIAL_SCALE } from '../ImageCarouselConstants'

export function useInitialScale(middleImageSize: ImageSizeObject) {
    const [initialScale, setInitialScale] = useState(1)

    const { scaleFactor } = middleImageSize

    useEffect(() => {
        const setScale = INITIAL_SCALE / (scaleFactor ?? 1)
        setInitialScale(setScale)
    }, [scaleFactor])

    return initialScale
}
