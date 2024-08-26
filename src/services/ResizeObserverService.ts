import ResizeObserver from 'resize-observer-polyfill'

class ResizeObserverService {
    observer: ResizeObserver | null
    observedElements: Map<Element, (target: Element) => void>
    constructor() {
        this.observedElements = new Map()
    }

    private _createObserver() {
        this.observer = new ResizeObserver(
            (entries: ResizeObserverEntry[], observer: ResizeObserver) => {
                window.requestAnimationFrame(() => {
                    for (const entry of entries) {
                        const resizeCallback = this.observedElements.get(
                            entry.target
                        )
                        if (resizeCallback) {
                            resizeCallback(entry.target)
                        }
                    }
                })
            }
        )
    }

    observe(element: Element, callback: (...args: unknown[]) => void) {
        if (!this.observer) {
            this._createObserver()
        }
        this.observedElements.set(element, callback)
        this.observer?.observe(element)
    }

    unobserve(element: Element) {
        this.observedElements.delete(element)
        this.observer?.unobserve(element)
        if (this.observedElements.size <= 0) {
            this.observer?.disconnect()
            this.observer = null
        }
    }
}

export default new ResizeObserverService()
