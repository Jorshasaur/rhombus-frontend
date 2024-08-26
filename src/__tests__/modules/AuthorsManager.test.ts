import AuthorsManager from '../../components/pages/Editor/AuthorsManager'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import { types } from '../../data/authors/types'
import store from '../../data/store'
import { DEFAULT_LINE_HEIGHT } from '../../constants/styles'
import { RESIZEABLE_SERVICES } from '../../constants/embeds'
import { EXTRA_OFFSETS } from '../../constants/authorship'
import { mockQuill } from '../mockData/mockQuill'
const lodash = require('lodash')

lodash.debounce = (fn: Function) => {
    return function callFn() {
        fn()
    }
}

const Quill = mockQuill

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

const firstLineText = 'First line'
const secondLineAuthorOneText = 'Second line'
const secondLineAuthorTwoText = 'Second line, second author'

const lines = [
    {
        offset: () => 0,
        length: () => ({}),
        delta: [
            {
                insert: 'Title!',
                attributes: { author: '1' }
            }
        ],
        domNode: {
            nodeName: 'H1',
            children: [
                {
                    offsetTop: 5
                }
            ]
        }
    },
    {
        offset: () => 1,
        length: () => ({}),
        delta: [
            {
                insert: firstLineText,
                attributes: { author: '1' }
            }
        ],
        domNode: {
            nodeName: 'P',
            offsetTop: 10
        }
    },
    {
        offset: () => 2,
        length: () => ({}),
        delta: [
            {
                insert: secondLineAuthorOneText,
                attributes: { author: '1' }
            },
            {
                insert: secondLineAuthorTwoText,
                attributes: { author: '2' }
            }
        ],
        domNode: {
            nodeName: 'P',
            offsetTop: 15
        }
    }
]

beforeEach(() => {
    store.dispatch = jest.fn()
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
    Quill.getContents = (index: number) => {
        return lines[index].delta
    }
    Quill.getLines = () => lines

    Quill.root = document.createElement('div')

    const modules = {}

    Quill.setModule = (name: string, module: any) => {
        modules[name] = module
    }

    window.getComputedStyle = (): any => {
        return {
            lineHeight: DEFAULT_LINE_HEIGHT
        }
    }
    window.addEventListener = jest.fn()
})

describe('AuthorsManager', () => {
    it('should watch for editor and window resize changes when module is enabled', () => {
        Quill.on = jest.fn()
        new AuthorsManager(Quill, true)
        expect(window.addEventListener).toBeCalled()
        expect(Quill.on).toBeCalled()
    })
    it('should not watch for editor and window resize changes when module is disabled', () => {
        Quill.on = jest.fn()
        new AuthorsManager(Quill, false)
        expect(window.addEventListener).not.toBeCalled()
        expect(Quill.on).not.toBeCalled()
    })
    it('should handle authors on editor change event', () => {
        const authorsManager = new AuthorsManager(Quill, true)
        authorsManager.loaded = true
        const range = { index: 1, length: 0 }

        Quill.emit(QuillEvents.TEXT_CHANGE, range)

        expect(store.dispatch).toBeCalled()

        authorsManager.detach()
    })
    it('should not do anything until Quill is finished loading', () => {
        const authorsManager = new AuthorsManager(Quill, true)
        const range = { index: 1, length: 0 }

        Quill.emit(QuillEvents.TEXT_CHANGE, range)

        expect(store.dispatch).not.toBeCalled()

        authorsManager.detach()
    })
    it('should set the author data', () => {
        const authorsManager = new AuthorsManager(Quill, true)
        authorsManager.loaded = true
        const range = { index: 1, length: 0 }

        Quill.emit(QuillEvents.TEXT_CHANGE, range)

        expect(store.dispatch).toBeCalledWith({
            data: {
                '0': {
                    authorId: '1',
                    lineHeight: DEFAULT_LINE_HEIGHT,
                    textLength: firstLineText.length,
                    top: lines[1].domNode!.offsetTop! + EXTRA_OFFSETS.General
                },
                '1': {
                    authorId: '2',
                    lineHeight: DEFAULT_LINE_HEIGHT,
                    textLength: secondLineAuthorTwoText.length,
                    top: lines[2].domNode!.offsetTop! + EXTRA_OFFSETS.General
                }
            },
            type: 'SET_AUTHORS'
        })

        authorsManager.detach()
    })

    RESIZEABLE_SERVICES.forEach((service) => {
        const blockEmbedLines = [
            {
                offset: () => 0,
                length: () => ({}),
                delta: [
                    {
                        insert: {},
                        attributes: { author: '1' }
                    },
                    {
                        insert: {},
                        attributes: { author: '2' }
                    }
                ],
                domNode: {
                    dataset: {
                        service
                    },
                    nodeName: 'DIV',
                    offsetTop: 20
                }
            }
        ]

        it(`should not set the author data for ${service}`, () => {
            Quill.getLines = () => blockEmbedLines
            Quill.getContents = (index: number) => {
                return blockEmbedLines[index].delta
            }
            const authorsManager = new AuthorsManager(Quill, true)
            authorsManager.loaded = true
            const range = { index: 1, length: 0 }

            Quill.emit(QuillEvents.TEXT_CHANGE, range)

            expect(store.dispatch).toHaveBeenCalledWith({
                type: types.SET_AUTHORS,
                data: {}
            })

            authorsManager.detach()
        })
    })
})
