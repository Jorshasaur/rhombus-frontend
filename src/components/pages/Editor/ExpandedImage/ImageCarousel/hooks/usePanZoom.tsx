import Panzoom from '@panzoom/panzoom'
import { MutableRefObject, useCallback, useEffect, useRef } from 'react'
import { ImageSizeObject } from '../ImageCarouselConstants'
import { useInitialScale } from './useInitialScale'

type PanzoomOptions = {
    maxScale: number
    minScale: number
    startX: number
    startY: number
    animate: boolean
    disablePan: boolean
}

export type PanzoomRef = MutableRefObject<
    ReturnType<typeof Panzoom> | undefined
>
export type UpdatePanZoom = (x: number, y: number, zoom?: number) => void
export type SetPanzoomStyle = (
    transition: number,
    transformObject?: {
        x: number
        y: number
        scale: number
    }
) => void

export function usePanzoom(
    panzoomElement: MutableRefObject<HTMLElement | null>,
    panzoomOptions: PanzoomOptions,
    middleImageSize: ImageSizeObject
): {
    panzoom: PanzoomRef
    setPanzoomStyle: SetPanzoomStyle
    updatePanZoom: UpdatePanZoom
} {
    const panzoom = useRef<ReturnType<typeof Panzoom>>()
    const initialScale = useInitialScale(middleImageSize)

    // Function that handles the transform on the Panzoom element
    const setTransform = useCallback(
        (
            element: HTMLElement,
            { scale, x, y }: { scale: number; x: number; y: number }
        ) => {
            const transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`
            // Only apply the transform if needed
            if (element.style.transform !== transform) {
                panzoom.current?.setStyle('transform', transform)
            }
        },
        []
    )
    useEffect(() => {
        if (!panzoom.current && panzoomElement.current) {
            const newPanzoom = Panzoom(panzoomElement.current, {
                ...panzoomOptions,
                minScale: initialScale,
                initialScale,
                setTransform
            })
            panzoom.current = newPanzoom
        }
    }, [panzoomElement, panzoomOptions, setTransform, initialScale])

    // Function to update Panzoom's zoom and pan, and set the new pan in state.
    const updatePanZoom = useCallback(
        (x: number, y: number, zoom?: number) => {
            if (zoom) {
                panzoom.current?.zoom(zoom, { force: true })
            }

            panzoom.current?.pan(x, y, { force: true })
        },
        [panzoom]
    )

    // Immediately set styles on the panzoom element
    // This is useful to add transitions before updates,
    // or to apply a style before the panzoom library applies it itself (set scale and pan at the same time)
    const setPanzoomStyle = useCallback(
        (
            transition: number,
            transformObject?: {
                x: number
                y: number
                scale: number
            }
        ) => {
            if (panzoomElement.current) {
                const transitionProperty = 'transform'
                const transitionDuration = `${transition}ms`

                // Check element styles to prevent duplicate setStyle calls
                if (
                    panzoomElement.current.style.transitionDuration !==
                        transitionDuration ||
                    panzoomElement.current.style.transitionProperty !==
                        transitionProperty
                ) {
                    panzoomElement.current.style.transitionDuration = transitionDuration
                    panzoomElement.current.style.transitionProperty = transitionProperty
                    panzoomElement.current.style.transition = `${transitionProperty} ${transitionDuration}`
                    panzoom.current?.setStyle(
                        'transition',
                        `${transitionProperty} ${transitionDuration}`
                    )
                }

                if (transformObject) {
                    const { x, y, scale } = transformObject
                    const transform = `translate3d(${x}px, ${y}px, 0px) scale(${scale})`

                    // Check element styles to prevent duplicate setStyle calls
                    if (panzoomElement.current.style.transform !== transform)
                        panzoomElement.current.style.transform = transform
                    panzoom.current?.setStyle('transform', transform)
                }
            }
        },
        [panzoomElement]
    )

    useEffect(() => {
        if (panzoom.current) {
            if (panzoom.current.getScale() !== initialScale) {
                panzoom.current.setOptions({
                    initialScale,
                    minScale: initialScale
                })

                panzoom.current.zoom(initialScale, {
                    force: true,
                    animate: true
                })
            }
        }
    }, [initialScale, setPanzoomStyle])

    return { panzoom, setPanzoomStyle, updatePanZoom }
}
