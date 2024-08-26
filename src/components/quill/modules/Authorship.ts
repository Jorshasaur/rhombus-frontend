import Quill from 'quill/core'
import { DeltaStatic, Sources } from 'quill'
import QuillSources from './QuillSources'
import QuillEvents from './QuillEvents'
import Delta from 'quill-delta'
const Inline = Quill.import('blots/inline')

export class AuthorClass extends Inline {
    public static blotName = 'author'
    public static tagName = 'STRONG'

    public static create(value: number) {
        const node = super.create(value) as HTMLElement
        node.setAttribute('data-author-id', `${value}`)
        node.setAttribute('class', `pages-author pages-author-${value}`)
        return node
    }

    public static formats(domNode: HTMLElement) {
        return parseInt(domNode.getAttribute('data-author-id')!, 10)
    }
}

export interface AuthorshipOptions {
    enabled?: boolean
    authorId: number
    color: string
}

export default class Authorship {
    private quill: Quill
    private options: AuthorshipOptions

    constructor(quill: Quill, options: AuthorshipOptions) {
        this.quill = quill
        this.options = options
        if (this.options.enabled) {
            this.enable()
        }

        if (!this.options.authorId) {
            return
        }

        this.quill.on(
            QuillEvents.EDITOR_CHANGE,
            (
                eventName: string,
                delta: DeltaStatic,
                oldDelta: DeltaStatic,
                source: Sources
            ) => {
                if (
                    eventName === QuillEvents.TEXT_CHANGE &&
                    source === QuillSources.USER &&
                    delta &&
                    delta.ops
                ) {
                    const authorDelta = new Delta()
                    const curSelection = this.quill.getSelection()
                    delta.ops.forEach((op) => {
                        if (op.delete) {
                            return
                        }
                        if (op.insert) {
                            // Add authorship to insert
                            op.attributes = op.attributes || {}
                            let author = this.options.authorId
                            if (op.attributes.keepAuthor) {
                                author = op.attributes.author
                                delete op.attributes.keepAuthor
                            }
                            op.attributes.author = author
                            // Apply authorship to our own editor
                            authorDelta.retain(op.insert.length || 1, {
                                author,
                                keepAuthor: false
                            })
                        } else {
                            let author
                            if (op.attributes && op.attributes.keepAuthor) {
                                author = op.attributes.author
                                delete op.attributes.keepAuthor
                            }

                            const attributes = { keepAuthor: false } as {
                                keepAuthor: boolean
                                author?: string
                            }
                            if (author != null) {
                                attributes.author = author
                            }
                            authorDelta.retain(op.retain || 0, attributes)
                        }
                    })
                    this.quill.updateContents(authorDelta, QuillSources.SILENT)

                    // Get the scroll position of the window
                    const scrollTop = quill.scrollingContainer.scrollTop
                    quill.setSelection(curSelection, QuillSources.USER)
                    // Restore scroll position
                    quill.scrollingContainer.scrollTop = scrollTop
                }
            }
        )
    }

    enable(enabled: boolean = true) {
        this.quill.root.classList.toggle('pages-authorship', enabled)
    }

    disable() {
        this.enable(false)
    }
}
