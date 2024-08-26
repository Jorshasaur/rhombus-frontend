import ReactDOM from 'react-dom'
import { Maybe } from 'true-myth'
import URI from 'urijs'
import { BlotSize } from '../interfaces/blotSize'
import {
    DEFAULT_RATIO,
    GUTTER_WIDTH,
    LARGE_IMAGE_SIDE_MARGIN,
    MEDIUM_BREAKPOINT,
    SMALL_BREAKPOINT
} from '../constants/styles'
import { getFileExtension } from '../lib/utils'

export enum FILE_CREATE_METHOD {
    plusButton = 'PLUS_BUTTON',
    fileDrop = 'FILE_DROP',
    paste = 'PASTE',
    other = 'OTHER'
}

export enum FILE_TYPES {
    mov = 'video/quicktime',
    mp4 = 'video/mp4',
    pdf = 'application/pdf',
    png = 'image/png',
    jpeg = 'image/jpeg',
    jpg = 'image/jpeg',
    sketch = 'application/sketch',
    studio = 'application/studio'
}

export enum URL_TYPES {
    freehand = 'freehand',
    prototype = 'prototype',
    invision = 'invision',
    externalURL = 'externalUrl'
}

export function getEmbedType(fileType: string, fileName: string): string {
    if (fileType === '') {
        return FILE_TYPES[getFileExtension(fileName) || 'notthere']
    }

    return fileType
}

export function getLargeEmbedWidth() {
    return window.innerWidth - GUTTER_WIDTH * 2 - LARGE_IMAGE_SIDE_MARGIN * 2
}

export function getContainerWidth(container: HTMLElement) {
    const computedStyle = window.getComputedStyle(container)
    let containerWidth = container.getBoundingClientRect().width
    containerWidth -=
        parseFloat(computedStyle.paddingLeft || '0') +
        parseFloat(computedStyle.paddingRight || '0')
    return containerWidth
}

export function getLargeEmbedLeft(
    containerWidth: number,
    mediumSizeAdjust: number = 0
) {
    if (window.innerWidth <= SMALL_BREAKPOINT) {
        return 0
    } else if (window.innerWidth <= MEDIUM_BREAKPOINT) {
        const columnWidth = containerWidth / 7
        const halfGutter = GUTTER_WIDTH / 2
        return (
            (containerWidth - getLargeEmbedWidth()) / 2 +
            columnWidth -
            halfGutter * 3 +
            mediumSizeAdjust
        )
    }
    return (containerWidth - getLargeEmbedWidth()) / 2
}

export const getEmbedStyles = (
    aspectRatio: number,
    container: HTMLElement,
    size: BlotSize,
    hasOpenThread: boolean = false
): {
    width: number
    height: number
    left: number
} => {
    const containerWidth = getContainerWidth(container)
    const style = {
        left: 0,
        width: containerWidth,
        height: containerWidth * aspectRatio
    }
    if (size === BlotSize.Large && window.innerWidth > SMALL_BREAKPOINT) {
        const largeEmbedWidth = getLargeEmbedWidth()
        const largeEmbedLeft = getLargeEmbedLeft(containerWidth)
        const threadWidth = containerWidth + Math.abs(largeEmbedLeft)
        return {
            height:
                aspectRatio * (hasOpenThread ? threadWidth : largeEmbedWidth),
            left: largeEmbedLeft,
            width: hasOpenThread ? threadWidth : largeEmbedWidth
        }
    }

    return style
}

export const getEmbedSize = <T>(
    embed: React.Component<T>,
    extendedInfoSelector: string
) => {
    const defaultHeight =
        (document.querySelector('.ql-editor')!.clientWidth * 10) / 16
    return Maybe.of(ReactDOM.findDOMNode(embed) as Element)
        .andThen((node) =>
            Maybe.of(node.querySelector(`.${extendedInfoSelector}`))
        )
        .map((extendedInfo) => ({
            height: extendedInfo.clientHeight,
            width: extendedInfo.clientWidth
        }))
        .unwrapOr({
            height: defaultHeight,
            width: defaultHeight * DEFAULT_RATIO
        })
}

export function isOnTeam(uri: ReturnType<typeof URI>): boolean {
    if (process.env.NODE_ENV === 'development') {
        return true
    }
    const currentUri = new URI()
    return uri.subdomain() === currentUri.subdomain()
}

const PLAY_SEGMENT = '/play/'
const INSPECT_SEGMENT = '/inspect/'
const MOTION_SEGMENT = /\/motion.*/gi
const COMMENT_SEGMENT = '/comment/'

export function getPlayUrl(originalLink: string) {
    let link = originalLink

    if (link.toLowerCase().indexOf(INSPECT_SEGMENT) > -1) {
        link = link
            .replace(new RegExp(INSPECT_SEGMENT, 'ig'), PLAY_SEGMENT)
            .replace(MOTION_SEGMENT, '')
    } else if (link.toLowerCase().indexOf(COMMENT_SEGMENT) > -1) {
        link = link.replace(new RegExp(COMMENT_SEGMENT, 'ig'), PLAY_SEGMENT)
    }

    const uri = URI(link)
    link = uri.removeSearch('hideNavBar').toString()

    return link
}
