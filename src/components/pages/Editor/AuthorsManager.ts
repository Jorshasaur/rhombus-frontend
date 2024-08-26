import { debounce, get } from 'lodash'
import { get as property, includes, pipe, __ } from 'lodash/fp'
import PubSub from 'pubsub-js'
import { EXTRA_OFFSETS } from '../../../constants/authorship'
import { OMIT_AUTHORSHIP_SERVICES } from '../../../constants/embeds'
import {
    DEFAULT_LINE_HEIGHT,
    HEADLINE_NODE_NAMES
} from '../../../constants/styles'
import { DOCUMENT_CHANGE_UPDATE } from '../../../constants/topics'
import { setAuthors } from '../../../data/authors/actions'
import store from '../../../data/store'
import { Author } from '../../../interfaces/author'
import Quill from '../../quill/entries/Editor'
import QuillEvents from '../../quill/modules/QuillEvents'

interface MostAuthored {
    author: string | null
    textLength: number
}

export default class AuthorsManager {
    token: string
    loaded: boolean
    constructor(private quill: Quill, enabled: boolean) {
        if (enabled) {
            this.token = PubSub.subscribe(
                DOCUMENT_CHANGE_UPDATE,
                this.subscriber.bind(this)
            )

            // Wait for the window to stop resizing and recalculate it's size
            window.addEventListener('resize', debounce(this.setAuthors, 150))
            // Reset the document authors on text change
            this.quill.on(QuillEvents.TEXT_CHANGE, this.setAuthors)
        }
    }

    detach() {
        this.quill.off(QuillEvents.TEXT_CHANGE, this.setAuthors)
        PubSub.unsubscribe(this.token)
    }

    subscriber() {
        // Set loaded on first run
        if (!this.loaded) {
            this.loaded = true
        }
        this.setAuthors()
    }

    setAuthors = debounce(() => {
        // If Quill has not loaded yet, do not set Authors
        if (!this.loaded) {
            return
        }
        const authors: Author[] = []
        const lines = this.quill.getLines()
        lines.forEach((line, index: number) => {
            const lineDelta = this.quill.getContents(
                line.offset(this.quill.scroll),
                line.length()
            )
            const lineAuthors = {}

            lineDelta.forEach((op) => {
                let textLength = 0
                let author
                // Get the length of the insert. If it is an object, set it to one.
                if (op.insert && typeof op.insert === 'string') {
                    textLength = op.insert.length
                } else if (op.insert && typeof op.insert === 'object') {
                    textLength = 1
                }

                // If author exists in attributes, or is in a block embed get it's value
                if (op.attributes && op.attributes.author) {
                    author = op.attributes.author
                } else if (op.insert && typeof op.insert === 'object') {
                    const embedName = Object.keys(op.insert)[0]
                    if (embedName && op.insert[embedName].authorId) {
                        author = op.insert[embedName].authorId
                    }
                }

                // If author exists, either add to it's key or add it to the line authors object
                if (author) {
                    if (author in lineAuthors) {
                        lineAuthors[author] += textLength
                    } else {
                        lineAuthors[author] = textLength
                    }
                }
            })

            let mostAuthored: MostAuthored = {
                author: null,
                textLength: 0
            }

            // Compare authors per line
            Object.keys(lineAuthors).forEach((key: string) => {
                const value = lineAuthors[key]
                if (value > mostAuthored.textLength) {
                    mostAuthored = { author: key, textLength: value }
                }
            })

            // Get the line height of the dom node
            const lineHeight =
                window.getComputedStyle(line.domNode).lineHeight ||
                DEFAULT_LINE_HEIGHT
            let top: number =
                HEADLINE_NODE_NAMES.indexOf(line.domNode.nodeName) > -1
                    ? get(line, ['domNode', 'children', 0, 'offsetTop'])
                    : line.domNode.offsetTop

            // Adjust top for text baseline
            switch (line.domNode.nodeName) {
                case 'H1':
                    top += EXTRA_OFFSETS.H1
                    break
                case 'H2':
                    top += EXTRA_OFFSETS.H2
                    break
                case 'H3':
                    top += EXTRA_OFFSETS.H3
                    break
                default:
                    top += EXTRA_OFFSETS.General
                    break
            }

            const shouldOmitAuthorship = pipe(
                property('domNode.dataset.service'),
                includes(__, OMIT_AUTHORSHIP_SERVICES)
            )(line)

            // If line has author information, and is not the first line, add it to the authors array
            if (mostAuthored.author && index > 0) {
                if (shouldOmitAuthorship) {
                    return
                }

                authors.push({
                    top,
                    lineHeight,
                    textLength: mostAuthored.textLength,
                    authorId: mostAuthored.author
                })
            }
        })
        // Set the Authors redux store to our updated authors array
        store.dispatch(setAuthors(authors))
    }, 100)
}
