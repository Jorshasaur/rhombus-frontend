import { DeltaStatic } from 'quill-delta'
import Quill from 'quill/core'
import { CommentMention } from '../../data/services/PagesApiService'
import { Blot } from 'parchment/dist/src/blot/abstract/blot'

interface CommentTextAndMentions {
    text: string
    source: string
    mentions: CommentMention[]
}

export function getBounds(bounds: ClientRect, containerBounds: ClientRect) {
    return {
        top: bounds.top - containerBounds.top,
        right: bounds.right - containerBounds.left,
        bottom: bounds.bottom - containerBounds.top,
        left: bounds.left - containerBounds.left,
        width: bounds.width,
        height: bounds.height
    }
}

export function getCachedContents(quill: Quill) {
    return quill.editor.delta
}

export function getTextAndMentions(delta: DeltaStatic) {
    const res = { text: '', source: '', mentions: [] }

    if (!delta) {
        return res
    }

    return delta.reduce((ret: CommentTextAndMentions, op) => {
        if (op.insert != null) {
            if (typeof op.insert === 'string') {
                ret.text += op.insert
                ret.source += op.insert
            } else if (op.insert.mention) {
                const { name, userId } = op.insert.mention
                ret.text += `@${name}`
                ret.source += `<@U${userId}>`
                ret.mentions.push({
                    token: name,
                    userId
                })
            }
        }
        return ret
    }, res)
}

export function preloadImage(imageUrl: string) {
    const preload = new Image()
    preload.src = imageUrl
}

export function getBlotOffset(quill: Quill, blot: Blot) {
    let offset = blot.offset()

    while (blot.parent !== quill.scroll) {
        blot = blot.parent
        offset += blot.offset()
    }
    return offset
}

// It's odd but the line length for the added last line is actually 1 because of the
// invisible line break character added to create the line.
export function isBlankLine(lineLength: number, lineContent: string) {
    return lineLength === 1 && lineContent === ''
}
