import LinkedList from 'parchment/dist/src/collection/linked-list'

export interface LineElement {
    domNode: Node
    head: {
        domNode: Node
    }
    length: () => number
    next: LineElement
    prev: LineElement
}

export interface Line {
    children: LinkedList<LineElement>
    domNode: Node
    next: LineElement
    parent: LineElement
    prev: LineElement
}
