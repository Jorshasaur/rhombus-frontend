import { useEffect, useRef } from 'react'

export function useEventListener(
    target: HTMLElement | Document | null,
    event: string,
    handler: (...args: any) => void
) {
    useEffect(() => {
        if (!target) {
            return
        }
        target.addEventListener(event, handler)
        return () => {
            target.removeEventListener(event, handler)
        }
    }, [target, event, handler])
}

export function useConditionalEventListener(
    target: HTMLElement | Document | null | (Window & typeof globalThis),
    event: string,
    handler: (...args: any) => void,
    condition: boolean
) {
    const eventTarget = useRef<
        HTMLElement | Document | null | (Window & typeof globalThis)
    >(null)
    const previousHandler = useRef<(...args: any) => void>()

    useEffect(() => {
        if (!target || !condition) {
            return
        }

        eventTarget.current = target
        previousHandler.current = handler

        target.addEventListener(event, handler)
        return () => {
            target.removeEventListener(event, handler)
        }
    }, [target, event, handler, condition])

    useEffect(() => {
        if (!condition && previousHandler.current) {
            eventTarget.current?.removeEventListener(
                event,
                previousHandler.current
            )
        }
    }, [event, condition])
}
