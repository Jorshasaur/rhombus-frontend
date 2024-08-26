import setImmediatePromise from 'set-immediate-promise'
import MentionsManager from '../../components/pages/Editor/MentionsManager'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import store from '../../data/store'
import { members } from '../mockData/members'
import { mockQuill } from '../mockData/mockQuill'
import { teamMembers } from '../mockData/teamMembers'
import { getCall } from '../utils'

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

const mentionsState = {
    currentDocument: {
        members,
        teamMembers
    },
    mentions: {
        showMentionsList: true
    },
    elementCoordinates: {
        navigation: {
            bottom: 0
        }
    }
}

beforeEach(() => {
    store.dispatch = jest.fn()
    store.subscribe = jest.fn()
    store.getState = jest.fn(() => {
        return mentionsState
    })

    const events = {}

    Quill.root = {
        addEventListener: jest.fn((eventName, cb) => {
            events[eventName] = cb
        }),
        getEvent: jest.fn((eventName) => {
            return events[eventName]
        }),
        getBoundingClientRect: () => {
            return {
                top: 0
            }
        }
    }
    Quill.emit = (eventName: string, ...args: any[]) => {
        events[eventName](...args)
    }
    Quill.on = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }
    Quill.off = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }
    const domNode = document.createElement('div')
    Quill.getBounds = () => {
        return domNode.getBoundingClientRect()
    }
    Quill.getText = () => {
        return ''
    }

    const app = document.createElement('div')
    app.id = 'app'
    document.body.appendChild(app)
})

describe('MentionsManager', () => {
    it('should watch for editor changes when module is enabled', () => {
        Quill.on = jest.fn()
        new MentionsManager(Quill, { enabled: true })
        expect(Quill.on).toHaveBeenCalledTimes(1)
    })
    it('should not watch for editor changes when module is disabled', () => {
        Quill.on = jest.fn()
        new MentionsManager(Quill, { enabled: false })
        expect(Quill.on).not.toBeCalled()
    })
    it('should do nothing if the mentions list is not visible', async () => {
        const mentionsManager = new MentionsManager(Quill, { enabled: true })
        const nothingState = {
            ...mentionsState,
            mentions: {
                showMentionsList: false
            }
        }
        store.getState = jest.fn(() => {
            return nothingState
        })
        const range = { index: 1, length: 0 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()

        expect(store.dispatch).not.toBeCalled()

        mentionsManager.detach()
    })
    it('should set mention members', async () => {
        const mentionsManager = new MentionsManager(Quill, { enabled: true })
        const range = { index: 1, length: 0 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()
        const firstCall = getCall(store.dispatch, 0)
        expect(firstCall.type).toBe('SET_MENTION_MEMBERS')
        mentionsManager.detach()
    })
    it('should select the first member when text is entered', async () => {
        Quill.getText = () => {
            return 'abc'
        }
        const mentionsManager = new MentionsManager(Quill, { enabled: true })
        const range = { index: 1, length: 0 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()
        const firstCall = getCall(store.dispatch, 0)
        expect(firstCall.type).toBe('SET_SELECTED_MEMBER_INDEX')
        expect(firstCall.data).toEqual({ selectedMemberIndex: 0 })
        mentionsManager.detach()
    })
    it('should set the mentions list', async () => {
        const mentionText = 'abc'
        Quill.getText = () => {
            return mentionText
        }
        const mentionsManager = new MentionsManager(Quill, { enabled: true })
        const range = { index: 1, length: 0 }
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.SELECTION_CHANGE,
            range
        )
        await setImmediatePromise()
        const thirdCall = getCall(store.dispatch, 2)
        expect(thirdCall.type).toBe('SET_MENTION_LIST')
        expect(thirdCall.data).toEqual({
            currentIndex: range.index,
            initialIndex: range.index,
            left: Quill.getBounds().left,
            mentionText,
            type: 'editor',
            showMentionsList: mentionsState.mentions.showMentionsList,
            top: Quill.getBounds().top
        })
        mentionsManager.detach()
    })
})
