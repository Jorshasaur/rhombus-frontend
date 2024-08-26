import { debounce } from 'lodash'
import Quill from 'quill/core'
import { changePlaceholder } from '../../../data/actions'
import store from '../../../data/store'
import QuillEvents from './QuillEvents'

export default class Placeholder {
    private quill: Quill
    private resize: any
    stopShowingSecondlinePrompt: boolean

    checkLines() {
        if (this.quill) {
            const [firstLine] = this.quill.getLine(0)
            const [secondLine] = this.quill.getLine(1)
            const lineNode = firstLine.domNode as HTMLElement
            const hasFirstlineCopy = firstLine.length() > 1
            const hasSecondLineCopy =
                this.quill.getLength() > firstLine.length() + 1 ||
                secondLine.isEmbed
            if (hasSecondLineCopy) {
                this.stopShowingSecondlinePrompt = true
            }
            const showSecondLine =
                !hasSecondLineCopy && !this.stopShowingSecondlinePrompt
            store.dispatch(
                changePlaceholder(
                    !hasFirstlineCopy,
                    showSecondLine,
                    lineNode.clientHeight
                )
            )
        }
    }

    constructor(quill: Quill, options: { enabled: boolean }) {
        this.quill = quill
        this.stopShowingSecondlinePrompt = false
        if (options.enabled) {
            this.quill.on(
                QuillEvents.EDITOR_CHANGE,
                debounce(
                    () => {
                        this.checkLines()
                    },
                    20,
                    { leading: true }
                )
            )
            this.checkLines()
            window.addEventListener('resize', () => {
                clearTimeout(this.resize)
                this.resize = setTimeout(() => {
                    this.checkLines()
                }, 0)
            })
        }
    }
}
