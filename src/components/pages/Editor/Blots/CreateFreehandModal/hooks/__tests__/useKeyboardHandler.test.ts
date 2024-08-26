import { useKeyboardHandler } from '../useKeyboardHandler'
import { identity } from 'lodash'
import { TEST_FREEHANDS as suggestions } from '../../_tests_/fixtures'
import { keycodes } from 'interfaces/keycodes'
import { KeyboardEvent } from 'react'
import React from 'react'
React.useCallback = jest.fn(identity)

const keyboardEvent = (attrs: Partial<KeyboardEvent<HTMLInputElement>>) =>
    ({
        preventDefault: jest.fn(),
        ...attrs
    } as KeyboardEvent<HTMLInputElement>)

describe('useKeyboardHandler', () => {
    it('ignores single `shift` key presses', async () => {
        let currentSuggestion = 1
        const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
        const onCreate = jest.fn()
        const onSelect = jest.fn()
        const handleKeyDown = useKeyboardHandler(
            suggestions,
            currentSuggestion,
            setCurrentSuggestion,
            onCreate,
            onSelect
        )

        handleKeyDown(keyboardEvent({ keyCode: keycodes.Shift }))

        expect(currentSuggestion).toBe(1)
        expect(setCurrentSuggestion).not.toHaveBeenCalled()
        expect(onCreate).not.toHaveBeenCalled()
        expect(onSelect).not.toHaveBeenCalled()
    })

    describe('setting the current suggestion to the previous one', () => {
        it('handles arrow up', async () => {
            let currentSuggestion = 1
            const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
            const onCreate = jest.fn()
            const onSelect = jest.fn()
            const handleKeyDown = useKeyboardHandler(
                suggestions,
                currentSuggestion,
                setCurrentSuggestion,
                onCreate,
                onSelect
            )

            handleKeyDown(keyboardEvent({ keyCode: keycodes.Up }))

            expect(currentSuggestion).toBe(0)
            expect(setCurrentSuggestion).toHaveBeenCalledWith(0)
            expect(onCreate).not.toHaveBeenCalled()
            expect(onSelect).not.toHaveBeenCalled()
        })

        it('handles shift+tab', async () => {
            let currentSuggestion = 1
            const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
            const onCreate = jest.fn()
            const onSelect = jest.fn()
            const handleKeyDown = useKeyboardHandler(
                suggestions,
                currentSuggestion,
                setCurrentSuggestion,
                onCreate,
                onSelect
            )

            handleKeyDown(
                keyboardEvent({
                    keyCode: keycodes.Tab,
                    shiftKey: true
                })
            )

            expect(currentSuggestion).toBe(0)
            expect(setCurrentSuggestion).toHaveBeenCalledWith(0)
            expect(onCreate).not.toHaveBeenCalled()
            expect(onSelect).not.toHaveBeenCalled()
        })
    })

    describe('setting the current suggestion to the next one', () => {
        it('handles arrow down', async () => {
            let currentSuggestion = 0
            const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
            const onCreate = jest.fn()
            const onSelect = jest.fn()
            const handleKeyDown = useKeyboardHandler(
                suggestions,
                currentSuggestion,
                setCurrentSuggestion,
                onCreate,
                onSelect
            )

            handleKeyDown(keyboardEvent({ keyCode: keycodes.Down }))

            expect(currentSuggestion).toBe(1)
            expect(setCurrentSuggestion).toHaveBeenCalledWith(1)
            expect(onCreate).not.toHaveBeenCalled()
            expect(onSelect).not.toHaveBeenCalled()
        })

        it('handles tab', async () => {
            let currentSuggestion = 0
            const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
            const onCreate = jest.fn()
            const onSelect = jest.fn()
            const handleKeyDown = useKeyboardHandler(
                suggestions,
                currentSuggestion,
                setCurrentSuggestion,
                onCreate,
                onSelect
            )

            handleKeyDown(
                keyboardEvent({
                    keyCode: keycodes.Tab,
                    shiftKey: false
                })
            )

            expect(currentSuggestion).toBe(1)
            expect(setCurrentSuggestion).toHaveBeenCalledWith(1)
            expect(onCreate).not.toHaveBeenCalled()
            expect(onSelect).not.toHaveBeenCalled()
        })
    })

    describe('selecting a suggestion', () => {
        it('handles creating a new project', async () => {
            let currentSuggestion = 2
            const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
            const onCreate = jest.fn()
            const onSelect = jest.fn()
            const handleKeyDown = useKeyboardHandler(
                suggestions,
                currentSuggestion,
                setCurrentSuggestion,
                onCreate,
                onSelect
            )

            handleKeyDown(
                keyboardEvent({
                    keyCode: keycodes.Enter
                })
            )

            expect(onCreate).toHaveBeenCalled()
            expect(onSelect).not.toHaveBeenCalled()
        })

        it('handles selecting an existing project', async () => {
            let currentSuggestion = 1
            const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
            const onCreate = jest.fn()
            const onSelect = jest.fn()
            const handleKeyDown = useKeyboardHandler(
                suggestions,
                currentSuggestion,
                setCurrentSuggestion,
                onCreate,
                onSelect
            )

            handleKeyDown(
                keyboardEvent({
                    keyCode: keycodes.Enter
                })
            )

            expect(onCreate).not.toHaveBeenCalled()
            expect(onSelect).toHaveBeenCalledWith(
                suggestions[currentSuggestion].path
            )
        })
    })

    it('resets suggestions on any other keypress', () => {
        let currentSuggestion = 1
        const setCurrentSuggestion = jest.fn((x) => (currentSuggestion = x))
        const onCreate = jest.fn()
        const onSelect = jest.fn()
        const handleKeyDown = useKeyboardHandler(
            suggestions,
            currentSuggestion,
            setCurrentSuggestion,
            onCreate,
            onSelect
        )

        handleKeyDown(
            keyboardEvent({
                keyCode: keycodes.B
            })
        )

        expect(currentSuggestion).toBe(0)
        expect(setCurrentSuggestion).toHaveBeenCalledWith(0)
        expect(onCreate).not.toHaveBeenCalled()
        expect(onSelect).not.toHaveBeenCalled()
    })
})
