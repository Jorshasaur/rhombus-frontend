import { ImageSizeObject } from '../components/pages/Editor/ExpandedImage/ImageCarousel/ImageCarouselConstants'
import { ImageCarouselImage } from '../data/images/interfaces'
import videoJS from 'video.js'

const ASSETS_API_PREFIX = 'assets/A'
const RETINA_REGEX = /@[234]{1}x\./

export const updateArrayItem = (
    arrayToUpdate: any[],
    index: number,
    objectToUpdate: any
) => {
    return arrayToUpdate
        .slice(0, index)
        .concat(objectToUpdate)
        .concat(arrayToUpdate.slice(index + 1))
}

export const formatTime = (
    value: number,
    unit: string,
    suffix: string,
    date: Date,
    recentUpdateText = 'Just now'
) => {
    if (unit === 'second') {
        return recentUpdateText
    }
    let minimizedUnit = 'm'
    switch (unit) {
        case 'minute':
            minimizedUnit = 'm'
            break
        case 'hour':
            minimizedUnit = 'h'
            break
        case 'day':
            minimizedUnit = 'd'
            break
        case 'week':
            minimizedUnit = 'w'
            break
        case 'month':
            minimizedUnit = 'mo'
            break
        case 'year':
            minimizedUnit = 'y'
            break
        default:
            break
    }
    return `${value}${minimizedUnit} ${suffix}`
}

export const getFileExtension = (fileName: string) => {
    if (!fileName.includes('.')) {
        return
    }
    const fileNameArr = fileName.split('.')
    let fileExt = fileNameArr[fileNameArr.length - 1]
    if (typeof fileExt === 'string') {
        fileExt = fileExt.toLowerCase()
    }
    return fileExt
}

export interface ScaledImageDimensions {
    width: number
    height: number
    scaledFactor: number
}

export const calculateImageDimensionsToFitContainer = (
    containerWidth: number,
    containerHeight: number,
    sourceWidth: number,
    sourceHeight: number
): ScaledImageDimensions => {
    let width = sourceWidth
    let height = sourceHeight
    const scaledFactor = 1

    if (width > containerWidth || height > containerHeight) {
        const ri = sourceWidth / sourceHeight
        const rs = containerWidth / containerHeight

        if (rs > ri) {
            width = (sourceWidth * containerHeight) / sourceHeight
            height = containerHeight
        } else {
            width = containerWidth
            height = (sourceHeight * containerWidth) / sourceWidth
        }
    }

    return {
        width,
        height,
        scaledFactor
    }
}

export function calculateAspectRatio(
    originalWidth: number,
    originalHeight: number
) {
    return originalHeight / originalWidth
}

export function flattenLines(children: Element[]): HTMLElement[] {
    return children.reduce(
        (ret: HTMLElement[], child: HTMLElement, index: number) => {
            if (
                child instanceof HTMLUListElement ||
                child instanceof HTMLOListElement
            ) {
                const listChildren = Array.from(child.children) as HTMLElement[]
                ret = ret.concat(listChildren)
            } else {
                ret.push(child)
            }

            return ret
        },
        []
    )
}

export function isAssetUrl(url: string) {
    return url?.includes(ASSETS_API_PREFIX)
}

export const isMacLike = () =>
    !!navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)

export function getImageScaleFactor(fileName: string) {
    const results = fileName.match(RETINA_REGEX)
    if (results != null) {
        const retinaString = results[0]
        const scaleFactor = parseInt(retinaString[1], 10)
        if (!isNaN(scaleFactor)) {
            return scaleFactor
        }
    }
    return 1
}

export function getImageSize(image: ImageCarouselImage) {
    if (image.fileName) {
        const scaleFactor = getImageScaleFactor(image.fileName)
        const style: ImageSizeObject = {
            scaleFactor
        }

        if (image.width != null) {
            style.width = image.width / scaleFactor
        }
        if (image.height != null) {
            style.height = image.height / scaleFactor
        }
        return style
    }
    return {}
}

export function createRootElement(id: string) {
    const rootContainer = document.createElement('div')
    rootContainer.setAttribute('id', id)
    return rootContainer
}

export function addRootElement(target: Element | null, rootElem: Element) {
    target?.insertBefore(
        rootElem,
        document.body.lastElementChild!.nextElementSibling
    )
}

/**
 * VideoJS scrubbing performance has a noticeable lag because they're caching the current
 * video percentage.  This code changes the mouse move event on the seekbar to update the
 * position based on the live position.  It could safely be removed in the future if VideoJS
 * ever adds an option to do non-cached scrubbing.
 */
export function improveVideoScrubbing() {
    const SeekBar = videoJS.getComponent('SeekBar')
    // @ts-ignore
    SeekBar.prototype.getPercent = function getPercent() {
        // @ts-ignore
        const time = this.player_.currentTime()
        // @ts-ignore
        const percent = time / this.player_.duration()
        return percent >= 1 ? 1 : percent
    }

    // @ts-ignore
    SeekBar.prototype.handleMouseMove = function handleMouseMove(event) {
        // @ts-ignore
        let newTime = this.calculateDistance(event) * this.player_.duration()
        if (newTime === this.player_.duration()) {
            newTime = newTime - 0.1
        }
        this.player_.currentTime(newTime)
        // @ts-ignore
        this.update()
    }
}
