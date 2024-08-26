import { useEffect, RefObject } from 'react'

export function useSmoothScrollingList<T>(
    listRef: RefObject<HTMLUListElement>,
    items: T[],
    current: number
) {
    useEffect(() => {
        const NO_ITEMS = items.length === 0
        const CREATE_NEW_SELECTED = current === items.length

        if (listRef.current == null || NO_ITEMS || CREATE_NEW_SELECTED) {
            return
        }

        const item = listRef.current.children[current] as HTMLLIElement
        const itemOffsetBottom = item.offsetTop + item.offsetHeight
        const ITEM_BOTTOM_NOT_VISIBLE =
            itemOffsetBottom > listRef.current.clientHeight
        const ITEM_NOT_FULLY_VISIBLE =
            ITEM_BOTTOM_NOT_VISIBLE ||
            item.offsetTop < listRef.current.scrollTop

        if (ITEM_NOT_FULLY_VISIBLE) {
            listRef.current.scrollTo({
                top: item.offsetTop,
                behavior: 'smooth'
            })
        }
    }, [items, current, listRef])
}
