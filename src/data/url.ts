import shortUuid from 'short-uuid'
import slug from 'slug'
import isUuid from 'is-uuid'
import { UNSAFE_URL_CHARACTERS } from '../constants/network'

export function getIds(slugAndShortId: string) {
    const uuidTranslator = shortUuid()

    if (isUuid.v4(slugAndShortId)) {
        return {
            documentId: slugAndShortId,
            shortId: uuidTranslator.fromUUID(slugAndShortId)
        }
    } else {
        const parts = slugAndShortId.split('-')
        const shortId = parts[parts.length - 1]
        const documentId = uuidTranslator.toUUID(shortId)
        return {
            shortId,
            documentId
        }
    }
}

export function getPath(title: string, shortId: string) {
    if (!title) {
        title = 'Untitled'
    }

    // Setting these characters to '?' makes slug filter them out.
    // Setting them to blank strings were inconsistent for some chars.
    const unsafeCharMap = UNSAFE_URL_CHARACTERS.split('').reduce(
        (charMap, c: string) => {
            charMap[c] = '?'
            return charMap
        },
        {}
    )

    const options = {
        lower: false,
        charmap: Object.assign({}, slug.charmap, unsafeCharMap)
    }

    return `${slug(title, options)}-${shortId}`
}
