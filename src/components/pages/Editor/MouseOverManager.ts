import { debounce, throttle } from 'lodash'
import Quill, { Sources } from 'quill'
import { DeltaStatic } from 'quill-delta'
import {
    BLOCK_EMBED_BLOT_NAME,
    PANE_EMBED_BLOT_NAME,
    RESIZEABLE_SERVICES
} from '../../../constants/embeds'
import { RESIZE_EVENT_WAIT } from '../../../constants/styles'
import {
    resetMouseOver,
    setMouseOver,
    setMouseOverIndex
} from '../../../data/actions'
import { elementCoordinatesSelectors } from '../../../data/elementCoordinates'
import { mouseoverSelectors } from '../../../data/mouseover'
import { MouseOverBlotData } from '../../../data/reducers/mouseover'
import store from '../../../data/store'
import { BlockEmbedValue } from '../../../interfaces/blockEmbed'
import { SelectionType } from '../../../interfaces/selectionType'
import { flattenLines } from '../../../lib/utils'
import deltaUtils from '../../quill/deltaUtils'
import QuillEvents from '../../quill/modules/QuillEvents'
import QuillSources from '../../quill/modules/QuillSources'
import ImageEmbedContainer from './Blots/ImageEmbedContainer'
import styles from './LineControls/LineControls.module.css'
const Parchment = Quill.import('parchment')

const DIVIDER_PADDING = 13

export default class MouseOverManager {
    lines: HTMLElement[]
    linesLength: number
    mouseMoveHandlerThrottled: EventListener
    handleResizeDebounced: EventListener
    mouseOverElement: HTMLElement | null = null

    constructor(private quill: Quill, enabled: boolean) {
        if (enabled) {
            this.attach()
        }
    }

    attach() {
        this.mouseMoveHandlerThrottled = throttle(this.handleMouseMove, 20)
        document.addEventListener('mousemove', this.mouseMoveHandlerThrottled)

        // On resize recalculate the top of the mouseOverElement in case it shifted
        this.handleResizeDebounced = debounce(
            this.handleResize,
            RESIZE_EVENT_WAIT,
            {
                leading: false,
                trailing: true
            }
        )
        window.addEventListener('resize', this.handleResizeDebounced)

        this.quill.on(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
    }

    handleEditorChange = (
        eventName: string,
        delta: DeltaStatic,
        oldDelta: DeltaStatic,
        source: Sources
    ) => {
        if (eventName === QuillEvents.TEXT_CHANGE) {
            this.linesLength = -1 // reset lines length on editor change

            if (this.mouseOverElement != null) {
                const state = store.getState()

                if (source === QuillSources.USER) {
                    if (
                        mouseoverSelectors.isEmbed(state) &&
                        deltaUtils.isEmbedChange(delta)
                    ) {
                        this.setMouseOverData(
                            this.mouseOverElement,
                            elementCoordinatesSelectors.getNavigationHeight(
                                state
                            )
                        )
                    } else {
                        store.dispatch(resetMouseOver())
                        this.mouseOverElement = null
                    }
                } else if (source === QuillSources.API) {
                    const index = delta.transformPosition(
                        mouseoverSelectors.getIndex(state)
                    )
                    store.dispatch(setMouseOverIndex(index))
                }
            }
        }
    }

    resetLines() {
        const { children } = this.quill.root
        const childrenLength = children.length
        if (childrenLength !== this.linesLength) {
            this.linesLength = childrenLength
            this.lines = flattenLines(Array.from(children))
        }
    }

    detach() {
        document.removeEventListener(
            'mousemove',
            this.mouseMoveHandlerThrottled
        )
        this.quill.off(QuillEvents.EDITOR_CHANGE, this.handleEditorChange)
    }

    private _isOverLineControls(child: HTMLElement) {
        if (
            child.classList &&
            child.classList.length &&
            child.classList.contains(styles.lineControls)
        ) {
            return true
        }
        let node = child.parentNode as HTMLElement
        while (node) {
            if (
                node.classList &&
                node.classList.length &&
                node.classList.contains(styles.lineControls)
            ) {
                return true
            }
            node = node.parentNode as HTMLElement
        }
        return false
    }

    setMouseOverData(mouseOverElement: HTMLElement, navigationHeight: number) {
        const blot = Parchment.find(mouseOverElement)
        if (blot == null) {
            return
        }

        const index = this.quill.getIndex(blot)

        if (index === 0) {
            store.dispatch(resetMouseOver())
        } else {
            const indexWithLength = index + blot.length() - 1
            let blotName = blot.statics.blotName

            if (blotName === 'header') {
                blotName += `${blot.formats().header}`
            }

            const computedStyle = window.getComputedStyle(mouseOverElement)

            const paddingTop = parseFloat(computedStyle.paddingTop || '0')
            const paddingBottom = parseFloat(computedStyle.paddingBottom || '0')

            const height =
                mouseOverElement.clientHeight - paddingTop - paddingBottom
            const top = mouseOverElement.offsetTop + paddingTop
            let blotType
            let blotData: MouseOverBlotData

            if (
                blotName === BLOCK_EMBED_BLOT_NAME ||
                blotName === PANE_EMBED_BLOT_NAME
            ) {
                blotType = SelectionType.Embed
                const blockEmbedValue: BlockEmbedValue =
                    blot.value()[BLOCK_EMBED_BLOT_NAME] ||
                    blot.value()[PANE_EMBED_BLOT_NAME]

                if (blockEmbedValue.service === 'image') {
                    blotName = 'image'
                    const provider: ImageEmbedContainer = blot.provider
                    if (provider != null) {
                        provider.setIndex(indexWithLength, navigationHeight)
                    }
                }
                if (
                    RESIZEABLE_SERVICES.indexOf(blockEmbedValue.service) > -1 &&
                    !blockEmbedValue.unviewable
                ) {
                    blotName = blockEmbedValue.service
                    blotData = {
                        size: blockEmbedValue.size
                    }
                }
            } else {
                blotType = SelectionType.Text
            }

            store.dispatch(
                setMouseOver(
                    indexWithLength,
                    blotName,
                    blotType,
                    blotData,
                    top,
                    height,
                    mouseOverElement.id
                )
            )
        }
    }

    getMouseOverElement(clientY: number, navigationHeight: number) {
        let mouseOverElement = null as HTMLElement | null

        this.lines.forEach((child: HTMLElement) => {
            let offsetTop =
                child.offsetTop -
                this.quill.scrollingContainer.scrollTop +
                navigationHeight
            let height = child.clientHeight
            if (child instanceof HTMLHRElement) {
                offsetTop -= DIVIDER_PADDING
                height += DIVIDER_PADDING * 2
            }
            const offsetBottom = height + offsetTop
            if (clientY > offsetTop && clientY < offsetBottom) {
                mouseOverElement = child
                return false
            }
            return true
        })

        return mouseOverElement
    }

    handleResize = () => {
        if (this.mouseOverElement != null) {
            const navigationHeight = elementCoordinatesSelectors.getNavigationHeight(
                store.getState()
            )
            this.setMouseOverData(this.mouseOverElement, navigationHeight)
        }
    }

    handleMouseMove = (e: MouseEvent) => {
        if (e.target && this._isOverLineControls(e.target as HTMLElement)) {
            return
        }
        const navigationHeight = elementCoordinatesSelectors.getNavigationHeight(
            store.getState()
        )
        this.resetLines()

        const mouseOverElement = this.getMouseOverElement(
            e.clientY,
            navigationHeight
        )
        if (mouseOverElement !== this.mouseOverElement) {
            this.mouseOverElement = mouseOverElement
            if (this.mouseOverElement != null) {
                this.setMouseOverData(this.mouseOverElement, navigationHeight)
            } else {
                store.dispatch(resetMouseOver())
            }
        }
    }
}
