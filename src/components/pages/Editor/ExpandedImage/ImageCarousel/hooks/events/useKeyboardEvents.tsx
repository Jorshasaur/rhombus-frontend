import { useCallback } from 'react'
import EmbedInteractionAnalytics from '../../../../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import { keycodes } from '../../../../../../../interfaces/keycodes'
import {
    DIRECTION,
    ZOOM_STEP_DOWN,
    ZOOM_STEP_UP
} from '../../ImageCarouselConstants'
import { PanzoomRef } from '../usePanZoom'
import { useZoom } from '../useZoom'

export function useKeyboardEvents(
    panzoom: PanzoomRef,
    zoomHandler: ReturnType<typeof useZoom>,
    setDirection: (direction: DIRECTION) => void,
    onKeyDown: () => void
) {
    const { zoom, zoomToFit, zoomToFullSize, resetZoom } = zoomHandler

    return useCallback(
        (event: KeyboardEvent) => {
            // Navigate to the previous image when pressing the left key
            if (event.keyCode === keycodes.Left) {
                resetZoom()
                setDirection(DIRECTION.RIGHT)
                onKeyDown()
                new EmbedInteractionAnalytics()
                    .onPaginated()
                    .keyboardLeft()
                    .track()
                // Navigate to the next image when pressing the right key
            } else if (event.keyCode === keycodes.Right) {
                resetZoom()
                setDirection(DIRECTION.LEFT)
                onKeyDown()
                new EmbedInteractionAnalytics()
                    .onPaginated()
                    .keyboardRight()
                    .track()
                // Zoom to 100% when pressing cmd/ctrl + .
            } else if (
                (event.metaKey || event.ctrlKey) &&
                event.keyCode === keycodes.Period
            ) {
                event.preventDefault()
                zoomToFullSize()
                // Zoom to fit when pressing cmd/ctrl + 0
            } else if (
                (event.metaKey || event.ctrlKey) &&
                event.keyCode === keycodes.Zero
            ) {
                event.preventDefault()
                zoomToFit()
                // Zoom in when pressing cmd/ctrl + +
            } else if (
                (event.metaKey || event.ctrlKey) &&
                event.keyCode === keycodes.Equal &&
                panzoom.current
            ) {
                event.preventDefault()
                const scale = panzoom.current.getScale()
                zoom(scale, scale * ZOOM_STEP_UP - scale, true)
                // Zoom out when pressing cmd/ctrl + -
            } else if (
                (event.metaKey || event.ctrlKey) &&
                event.keyCode === keycodes.Minus &&
                panzoom.current
            ) {
                event.preventDefault()
                const scale = panzoom.current.getScale()
                zoom(scale, scale * ZOOM_STEP_DOWN - scale)
            }
        },
        [
            panzoom,
            resetZoom,
            setDirection,
            onKeyDown,
            zoomToFullSize,
            zoomToFit,
            zoom
        ]
    )
}
