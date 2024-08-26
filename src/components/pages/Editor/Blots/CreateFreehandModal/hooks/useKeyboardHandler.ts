import { keycodes } from '../../../../../../interfaces/keycodes'
import { FreehandDocumentSuccess } from '../../../../../../data/services/FreehandResponseTypes'
import { useCallback } from 'react'
export function useKeyboardHandler(
    suggestions: FreehandDocumentSuccess[],
    currentSuggestion: number,
    setCurrentSuggestion: (project: number) => void,
    onCreate: () => void,
    onSelect: (url: string) => void
) {
    return useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            // We only care about shift if it's a modifier for another key
            if (event.keyCode === keycodes.Shift) {
                return
            }

            // handle going up: `ArrowUp` and `shift+tab`
            if (
                (event.shiftKey && event.keyCode === keycodes.Tab) ||
                event.keyCode === keycodes.Up
            ) {
                const prevProject =
                    currentSuggestion > 0
                        ? currentSuggestion - 1
                        : currentSuggestion
                setCurrentSuggestion(prevProject)
                event.preventDefault()
                // handle going down: `ArrowDown` and `tab`
            } else if ([keycodes.Down, keycodes.Tab].includes(event.keyCode)) {
                const nextProject =
                    currentSuggestion < suggestions.length
                        ? currentSuggestion + 1
                        : currentSuggestion
                setCurrentSuggestion(nextProject)
                event.preventDefault()
                // handle selecting a suggestion: `Enter`
            } else if (event.keyCode === keycodes.Enter) {
                if (currentSuggestion === suggestions.length) {
                    onCreate()
                } else {
                    onSelect(suggestions[currentSuggestion].path)
                }
                event.preventDefault()
                // Reset current suggestion
            } else {
                setCurrentSuggestion(0)
            }
        },
        [
            suggestions,
            currentSuggestion,
            setCurrentSuggestion,
            onCreate,
            onSelect
        ]
    )
}
