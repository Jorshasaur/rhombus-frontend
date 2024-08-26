import { useSmoothScrollingList } from '../useSmoothScrollingList'
import { TEST_FREEHANDS } from '../../_tests_/fixtures'
import React, { RefObject } from 'react'
React.useEffect = jest.fn((cb) => cb())

const makeListRef = ({ ...atrs } = {}) =>
    (({
        current: {
            children: [] as HTMLLIElement[],
            clientHeight: 100,
            scrollTop: 0,
            scrollTo: jest.fn(),
            ...atrs
        }
    } as unknown) as RefObject<HTMLUListElement>)

describe('useSmoothScrollingList', () => {
    it('does nothing if listRef is null', () => {
        const result = useSmoothScrollingList(
            { current: null },
            ['something'],
            0
        )

        expect(result).toBe(undefined)
    })

    it('does nothing if list is empty', () => {
        const listRef = makeListRef()
        const result = useSmoothScrollingList(listRef, [], 0)

        expect(result).toBe(undefined)
    })

    it('does nothing if `current` is outside the bounds of the list', () => {
        const listRef = makeListRef()
        const result = useSmoothScrollingList(listRef, [], 0)

        expect(result).toBe(undefined)
    })

    it('scrolls up if `current` is above viewport', () => {
        const listRef = makeListRef({
            children: [{ offsetTop: 5 }],
            scrollTop: 50
        })

        const result = useSmoothScrollingList(listRef, TEST_FREEHANDS, 0)

        expect(result).toBe(undefined)
    })

    it('scrolls down if `current` is below viewport', () => {
        const listRef = makeListRef({
            children: [{}, { offsetTop: 50, offsetHeight: 20 }],
            clientHeight: 50
        })

        const result = useSmoothScrollingList(listRef, TEST_FREEHANDS, 1)

        expect(result).toBe(undefined)
    })
})
