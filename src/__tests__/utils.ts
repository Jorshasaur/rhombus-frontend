import * as sinon from 'sinon'
import Delta from 'quill-delta'
import json1 from 'ot-json1'

export function assertArgs(call: sinon.SinonSpy, ...args: any[]) {
    expect(call.args).toEqual(args)
}

export function assertFirstCallArgs(call: sinon.SinonSpy, ...args: any[]) {
    expect(call.firstCall.args).toEqual(args)
}
export function assertSecondCallArgs(call: sinon.SinonSpy, ...args: any[]) {
    expect(call.secondCall.args).toEqual(args)
}
export function getCall(mockFunction: any, index: number): any {
    return mockFunction.mock.calls[index][0]
}

export function createFakeMark(threadId: string): void {
    const mark = document.createElement('div')
    mark.setAttribute('class', `mark-id-${threadId}`)
    document.body.appendChild(mark)
}

export function dispatchKeydownEvent(
    domNode: HTMLElement,
    keycode: number,
    ctrlKey: boolean = false,
    shiftKey: boolean = false
) {
    const evt = document.createEvent('KeyboardEvent')
    evt.initEvent('keydown', false, true)
    Object.defineProperty(evt, 'which', {
        writable: true,
        configurable: true,
        value: keycode
    })
    Object.defineProperty(evt, 'altKey', {
        writable: true,
        configurable: true,
        value: false
    })
    Object.defineProperty(evt, 'ctrlKey', {
        writable: true,
        configurable: true,
        value: ctrlKey
    })
    Object.defineProperty(evt, 'metaKey', {
        writable: true,
        configurable: true,
        value: false
    })
    Object.defineProperty(evt, 'shiftKey', {
        writable: true,
        configurable: true,
        value: shiftKey
    })
    domNode.dispatchEvent(evt)
}

export function setupQlEditor() {
    const editor = document.createElement('div')
    editor.classList.add('ql-editor')
    document.body.appendChild(editor)
}

export const createContainer = (height: number, width: number) => {
    const container = document.createElement('div')
    container.getBoundingClientRect = () => {
        return { height, width } as DOMRect
    }
    Object.defineProperty(container, 'clientWidth', {
        value: width,
        writable: false
    })
    return container
}

export const resizeWindow = (height: number = 768, width: number = 1024) => {
    const windowObject = window as any
    windowObject.innerWidth = width
    windowObject.innerHeight = height
    windowObject.dispatchEvent(new Event('resize'))
}

export const fakeClickEvent: Object = {
    preventDefault() {
        //
    },
    stopPropagation() {
        //
    }
}

export function getInitialContents() {
    return new Delta([
        { insert: 'Untitled' },
        { insert: '\n', attributes: { header: 1 } },
        { insert: 'This is a document whose text is synced in real time\n' }
    ])
}

export function getInitialJSONContents() {
    return json1.type.create({
        id: '12334',
        viewType: 'table',
        elements: []
    })
}
