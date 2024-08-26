import json1 from 'ot-json1'
import {
    Pane,
    PaneList,
    ListDoesntExistError,
    PaneText,
    PaneElement,
    ElementDoesntExistError
} from './Advil'
import { get } from 'lodash'

export function getListSelection(pane: Pane, listId: string) {
    const elements = pane.elements as PaneList[]
    for (let i = 0, len = elements.length; i < len; ++i) {
        const paneList = pane.elements[i] as PaneList
        if (paneList.id === listId) {
            return {
                index: i,
                size: paneList.elements.length
            }
        }
    }

    throw new ListDoesntExistError(listId)
}

export function getElementIndex(list: PaneList, id: string) {
    const elements = list.elements as PaneList[]
    for (let i = 0, len = elements.length; i < len; ++i) {
        const paneList = list.elements[i] as PaneList
        if (paneList.id === id) {
            return i
        }
    }

    throw new ElementDoesntExistError(id)
}

export function getElementValueAtPath(element: PaneElement, path: json1.Path) {
    let el = element
    for (let i = 0; i < path.length; i++) {
        const d = path[i]
        el = el[d]
        if (typeof el !== 'object') {
            break
        }
    }
    return el
}

export function getListAt(pane: Pane, position: number) {
    return pane.elements[position] as PaneList
}

export function getList(pane: Pane, listId: string) {
    const { index } = getListSelection(pane, listId)
    return pane.elements[index] as PaneList
}

export function getElementAt(pane: Pane, listId: string, position: number) {
    const { index } = getListSelection(pane, listId)
    const list = pane.elements[index] as PaneList
    return list.elements[position]
}

export function getElement(pane: Pane, listId: string, id: string) {
    const list = getList(pane, listId)
    const index = getElementIndex(list, id)
    return list.elements[index]
}

export function getTextValueAt(pane: Pane, listId: string, position: number) {
    const text = getElementAt(pane, listId, position) as PaneText
    return text.value
}

export function getTextValue(pane: Pane, listId: string, id: string) {
    const list = getList(pane, listId)
    const index = getElementIndex(list, id)
    const text = list.elements[index] as PaneText
    return text.value
}

export function getElementIdAt(pane: Pane, listId: string, position: number) {
    const element = getElementAt(pane, listId, position)
    return element.id
}

export function getValueAtPath<T>(pane: Pane, path: json1.Path): T {
    return get(pane, path)
}
