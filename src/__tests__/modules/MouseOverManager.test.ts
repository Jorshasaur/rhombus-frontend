import store from '../../data/store'
import MouseOverManager from '../../components/pages/Editor/MouseOverManager'
import QuillModule from 'quill'
import { TypeKeys } from '../../data/ActionTypes'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import QuillSources from '../../components/quill/modules/QuillSources'
import { SelectionType } from '../../interfaces/selectionType'
import Delta from 'quill-delta'
const Parchment = QuillModule.import('parchment')

const Quill: any = jest.genMockFromModule('quill')

beforeEach(() => {
    const events = {}

    Quill.on = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }

    Quill.off = (eventName: string, handler: Function) => {
        delete events[eventName]
    }

    Quill.emit = (eventName: string, ...args: any[]) => {
        events[eventName](...args)
    }

    Quill.root = document.createElement('div')
    Quill.scrollingContainer = document.createElement('div')

    store.dispatch = jest.fn()
    store.getState = jest.fn(() => {
        return {
            elementCoordinates: {
                navigation: {
                    bottom: 0
                }
            }
        }
    })

    window.getComputedStyle = jest.fn(() => {
        return {}
    })
})

describe('MouseOverManager', () => {
    it('should watch for changes when enabled', () => {
        const attachSpy = jest.spyOn(MouseOverManager.prototype, 'attach')
        const mouseOverManager = new MouseOverManager(Quill, true)
        expect(attachSpy).toHaveBeenCalled()
        attachSpy.mockRestore()
        mouseOverManager.detach()
    })
    it('should not watch for changes when disabled', () => {
        const attachSpy = jest.spyOn(MouseOverManager.prototype, 'attach')
        const mouseOverManager = new MouseOverManager(Quill, false)
        expect(attachSpy).not.toHaveBeenCalled()
        attachSpy.mockRestore()
        mouseOverManager.detach()
    })
    it('should dispatch setMouseOver on mousemove', () => {
        const mouseOverManager = new MouseOverManager(Quill, true)

        Quill.getIndex = () => {
            return 1
        }

        const mouseOverElem = {
            offsetTop: 7,
            clientHeight: 5
        } as any

        mouseOverManager.resetLines = jest.fn(() => {
            mouseOverManager.linesLength = 1
            mouseOverManager.lines = [mouseOverElem]
        })

        Parchment.find = jest.fn(() => {
            return {
                length: () => {
                    return 2
                },
                statics: {
                    blotName: 'block'
                }
            }
        })

        const mouseMoveEvent = document.createEvent('HTMLEvents')
        mouseMoveEvent.initEvent('mousemove', false, true)
        Object.defineProperty(mouseMoveEvent, 'clientY', {
            writable: true,
            configurable: true,
            value: 10
        })
        document.dispatchEvent(mouseMoveEvent)

        expect(mouseOverManager.mouseOverElement).toEqual(mouseOverElem)
        expect(store.dispatch).toBeCalledWith({
            data: {
                blotName: 'block',
                blotType: SelectionType.Text,
                height: 5,
                index: 2,
                top: 7
            },
            type: TypeKeys.SET_MOUSEOVER
        })
    })

    it('should dispatch resetMouseOver on mousemove when mouse is outside document', () => {
        const mouseOverElem = {
            offsetTop: 7,
            clientHeight: 5
        } as any

        const mouseOverManager = new MouseOverManager(Quill, true)
        mouseOverManager.mouseOverElement = mouseOverElem

        mouseOverManager.resetLines = jest.fn(() => {
            mouseOverManager.linesLength = 1
            mouseOverManager.lines = [mouseOverElem]
        })

        const mouseMoveEvent = document.createEvent('HTMLEvents')
        mouseMoveEvent.initEvent('mousemove', false, true)
        Object.defineProperty(mouseMoveEvent, 'clientY', {
            writable: true,
            configurable: true,
            value: 0
        })
        document.dispatchEvent(mouseMoveEvent)

        expect(mouseOverManager.mouseOverElement).toBeNull()
        expect(store.dispatch).toBeCalledWith({
            type: TypeKeys.RESET_MOUSEOVER
        })
    })

    it('should dispatch resetMouseOver when mouseover is first line', () => {
        const mouseOverManager = new MouseOverManager(Quill, true)

        Quill.getIndex = () => {
            return 0
        }

        const mouseOverElem = {
            offsetTop: 7,
            clientHeight: 5
        } as any

        mouseOverManager.resetLines = jest.fn(() => {
            mouseOverManager.linesLength = 1
            mouseOverManager.lines = [mouseOverElem]
        })

        Parchment.find = jest.fn(() => {
            return {
                length: () => {
                    return 2
                },
                statics: {
                    blotName: 'block'
                }
            }
        })

        const mouseMoveEvent = document.createEvent('HTMLEvents')
        mouseMoveEvent.initEvent('mousemove', false, true)
        Object.defineProperty(mouseMoveEvent, 'clientY', {
            writable: true,
            configurable: true,
            value: 10
        })
        document.dispatchEvent(mouseMoveEvent)

        expect(store.dispatch).toBeCalledWith({
            type: TypeKeys.RESET_MOUSEOVER
        })
    })

    it('should reset linesLength on editor change', () => {
        const mouseOverManager = new MouseOverManager(Quill, true)
        mouseOverManager.linesLength = 10

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            null,
            null,
            QuillSources.USER
        )

        expect(mouseOverManager.linesLength).toBe(-1)
    })

    it('should transform index when there is text change from another client', () => {
        const mouseOverElem = {
            offsetTop: 7,
            clientHeight: 5
        } as any

        const mouseOverManager = new MouseOverManager(Quill, true)
        mouseOverManager.mouseOverElement = mouseOverElem

        store.getState = jest.fn(() => {
            return {
                mouseover: {
                    index: 2,
                    blotType: SelectionType.Embed
                }
            }
        })

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            new Delta([{ retain: 1 }, { insert: 'a' }]),
            undefined,
            QuillSources.API
        )

        expect(store.dispatch).toBeCalledWith({
            data: { index: 3 },
            type: TypeKeys.SET_MOUSEOVER_INDEX
        })
    })

    it('should set data when mouseover blot type is embed and there was embed change', () => {
        const mouseOverElem = {
            offsetTop: 7,
            clientHeight: 5
        } as any

        const mouseOverManager = new MouseOverManager(Quill, true)
        mouseOverManager.mouseOverElement = mouseOverElem
        mouseOverManager.setMouseOverData = jest.fn()

        store.getState = jest.fn(() => {
            return {
                mouseover: {
                    index: 2,
                    blotType: SelectionType.Embed
                },
                elementCoordinates: {
                    navigation: {
                        bottom: 0
                    }
                }
            }
        })

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            new Delta({
                ops: [
                    { retain: 2 },
                    {
                        insert: {
                            'block-embed': {
                                size: 'large',
                                uuid: '9d8c86b9-2acc-469b-8653-eed9cc1ec815',
                                service: 'image',
                                version: 1,
                                authorId: 1,
                                createdAt: '2019-01-08T16:54:12.220Z',
                                embedData: {
                                    id: '34a49012-fe95-4da0-a34b-9de5e16b6c9d',
                                    width: 375,
                                    height: 812,
                                    threadIds: []
                                }
                            }
                        },
                        attributes: { author: 1 }
                    },
                    { delete: 1 }
                ]
            }),
            undefined,
            QuillSources.USER
        )

        expect(mouseOverManager.setMouseOverData).toBeCalled()
    })
})
