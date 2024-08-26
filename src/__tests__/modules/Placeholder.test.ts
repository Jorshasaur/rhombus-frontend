const Quill: any = jest.genMockFromModule('quill/core')
import Placeholder from '../../components/quill/modules/Placeholder'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import store from '../../data/store'

let showFirstline = false
let showSecondLine = false
let placeholder: Placeholder

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

beforeEach(() => {
    store.dispatch = jest.fn((func: any) => {
        showFirstline = func.data.showFirstLinePlaceholder
        showSecondLine = func.data.showSecondLinePlaceholder
    })

    const events = {}

    Quill.root = document.createElement('div')

    Quill.on = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }

    Quill.emit = (eventName: string, ...args: any[]) => {
        events[eventName](...args)
    }
    Quill.getLine = jest.fn(() => {
        return [
            {
                domNode: {
                    clientHeight: 110
                },
                length: () => {
                    return 0
                }
            }
        ]
    })
    Quill.getLength = jest.fn(() => {
        return 0
    })

    placeholder = new Placeholder(Quill, { enabled: true })
    placeholder.stopShowingSecondlinePrompt = false
})

describe('Placeholder', () => {
    it('should show both placeholders for an empty document', () => {
        Quill.emit(QuillEvents.EDITOR_CHANGE)
        expect(store.dispatch).toHaveBeenCalled()
        expect(showFirstline).toEqual(true)
        expect(showSecondLine).toEqual(true)
    })
    it('should not show the title placeholder if there is title copy', () => {
        Quill.getLine = jest.fn(() => {
            return [
                {
                    domNode: {
                        clientHeight: 110
                    },
                    length: () => {
                        return 10
                    }
                }
            ]
        })
        placeholder = new Placeholder(Quill, { enabled: true })
        Quill.emit(QuillEvents.EDITOR_CHANGE)
        expect(store.dispatch).toHaveBeenCalled()
        expect(showFirstline).toEqual(false)
        expect(showSecondLine).toEqual(true)
    })
    it('should not show the body placeholder if there is body copy', () => {
        Quill.getLine = jest.fn(() => {
            return [
                {
                    domNode: {
                        clientHeight: 110
                    },
                    length: () => {
                        return 5
                    }
                }
            ]
        })
        Quill.getLength = jest.fn(() => {
            return 50
        })
        placeholder = new Placeholder(Quill, { enabled: true })
        Quill.emit(QuillEvents.EDITOR_CHANGE)
        expect(store.dispatch).toHaveBeenCalled()
        expect(showFirstline).toEqual(false)
        expect(showSecondLine).toEqual(false)
    })
    it('should not show the body placeholder after body copy has been shown and deleted', () => {
        Quill.getLine = jest.fn(() => {
            return [
                {
                    domNode: {
                        clientHeight: 110
                    },
                    length: () => {
                        return 5
                    }
                }
            ]
        })
        Quill.getLength = jest.fn(() => {
            return 50
        })
        placeholder = new Placeholder(Quill, { enabled: true })
        Quill.emit(QuillEvents.EDITOR_CHANGE)
        Quill.getLength = jest.fn(() => {
            return 5
        })
        Quill.emit(QuillEvents.EDITOR_CHANGE)
        expect(showSecondLine).toEqual(false)
    })
})
