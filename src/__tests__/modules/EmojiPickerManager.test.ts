import Delta, { DeltaOperation } from 'quill-delta'
import setImmediatePromise from 'set-immediate-promise'
import EmojiPickerManager from '../../components/pages/Editor/EmojiPickerManager'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import QuillSources from '../../components/quill/modules/QuillSources'
import emojiPickerReducer, {
    initialState
} from '../../data/reducers/emojiPicker'
import store from '../../data/store'
import { members } from '../mockData/members'
import { mockQuill } from '../mockData/mockQuill'
import { teamMembers } from '../mockData/teamMembers'

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

jest.mock('../../QuillRegistry', () => {
    return {
        getEditor: () => {
            return Quill
        }
    }
})

const newDelta = (ops: DeltaOperation[]) => new Delta(ops)

const mentionsState = {
    currentDocument: {
        members,
        teamMembers
    },
    mentions: {
        showMentionsList: true
    },
    selection: {
        codeBlock: false
    }
}

beforeEach(() => {
    store.subscribe = jest.fn()
    store.getState = jest.fn(() => {
        return mentionsState
    })

    const state = store.getState()
    state.emojiPicker = emojiPickerReducer(initialState, {
        type: 'INIT'
    })

    store.dispatch = jest.fn(({ type, data }) => {
        state.emojiPicker = emojiPickerReducer(state.emojiPicker, {
            type,
            data
        })
    })

    const events = {}
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
    Quill.getText = () => ''
})

describe('EmojiPickerManager', () => {
    it('should watch for editor and clipboard changes when module is enabled', () => {
        Quill.on = jest.fn()
        new EmojiPickerManager(Quill, { enabled: true })
        expect(Quill.on).toBeCalled()
    })
    it('should not watch for editor and clipboard changes when module is disabled', () => {
        Quill.on = jest.fn()
        new EmojiPickerManager(Quill, { enabled: false })
        expect(Quill.on).not.toBeCalled()
    })
    it('should show the emoji picker when the inserted text matches an emoji short name and the picker is not visible', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        store.getState = jest.fn(() => {
            return {
                emojiPicker: {
                    showEmojiPicker: false
                },
                selection: {
                    codeBlock: false
                }
            }
        })
        const delta = newDelta([{ retain: 2 }, { insert: 'o' }])
        Quill.getSelection = jest.fn(() => ({
            index: 3,
            range: 0
        }))
        Quill.getText = () => ':do'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            delta,
            undefined,
            'user'
        )
        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({
            data: {
                bottom: 0,
                emojiText: ':do',
                initialIndex: 0,
                left: 0,
                showEmojiPicker: true
            },
            type: 'SET_EMOJI_PICKER'
        })
    })
    it('should update the search text when the inserted text matches an emoji short name and the picker is visible', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        store.getState = jest.fn(() => {
            return {
                emojiPicker: {
                    showEmojiPicker: true,
                    initialIndex: 0
                },
                selection: {
                    codeBlock: false
                }
            }
        })
        const delta = newDelta([{ retain: 2 }, { insert: 'o' }])
        Quill.getSelection = jest.fn(() => ({
            index: 3,
            range: 0
        }))
        Quill.getText = () => ':dog'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            delta,
            undefined,
            'user'
        )
        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({
            data: {
                bottom: 0,
                emojiText: ':dog',
                initialIndex: 0,
                left: 0,
                showEmojiPicker: true
            },
            type: 'SET_EMOJI_PICKER'
        })
    })
    it('should update the search text when text is deleted from the editor', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        store.getState = jest.fn(() => {
            return {
                emojiPicker: {
                    showEmojiPicker: true,
                    initialIndex: 0
                },
                selection: {
                    codeBlock: false
                }
            }
        })
        const delta = newDelta([{ retain: 2 }, { delete: 1 }])
        Quill.getSelection = jest.fn(() => ({
            index: 3,
            range: 0
        }))
        Quill.getText = () => ':dog'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            delta,
            undefined,
            'user'
        )
        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({
            data: {
                bottom: 0,
                emojiText: ':dog',
                initialIndex: 0,
                left: 0,
                showEmojiPicker: true
            },
            type: 'SET_EMOJI_PICKER'
        })
    })
    it('should hide the picker when deleting to the beginning of the short name', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        store.getState = jest.fn(() => {
            return {
                emojiPicker: {
                    showEmojiPicker: true,
                    initialIndex: 2
                },
                selection: {
                    codeBlock: false
                }
            }
        })
        const delta = newDelta([{ retain: 2 }, { delete: 1 }])
        Quill.getSelection = jest.fn(() => ({
            index: 2,
            range: 0
        }))
        Quill.getText = () => ':dog'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            delta,
            undefined,
            'user'
        )
        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({ type: 'CLEAR_EMOJI_PICKER' })
    })
    it('should do nothing if the selection is in a code block', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        store.getState = jest.fn(() => {
            return {
                emojiPicker: {
                    showEmojiPicker: true,
                    initialIndex: 2
                },
                selection: {
                    codeBlock: true
                }
            }
        })
        const delta = newDelta([{ retain: 2 }, { delete: 1 }])
        Quill.getSelection = jest.fn(() => ({
            index: 2,
            range: 0
        }))
        Quill.getText = () => ':dog'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            delta,
            undefined,
            'user'
        )
        await setImmediatePromise()

        expect(store.dispatch).not.toBeCalled()
    })
    it('should not show the picker if the colon is grammatical', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        store.getState = jest.fn(() => {
            return {
                emojiPicker: {
                    showEmojiPicker: true,
                    initialIndex: 2
                },
                selection: {
                    codeBlock: false
                }
            }
        })
        const delta = newDelta([{ retain: 2 }, { delete: 1 }])
        Quill.getSelection = jest.fn(() => ({
            index: 2,
            range: 0
        }))
        Quill.getText = () => 'this is super interesting: a dog'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            delta,
            undefined,
            'user'
        )
        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({ type: 'CLEAR_EMOJI_PICKER' })
    })

    it('should transform initial index when there is text change from other client', async () => {
        new EmojiPickerManager(Quill, { enabled: true })
        const state = store.getState()
        state.emojiPicker = {
            showEmojiPicker: true,
            initialIndex: 2,
            left: 0,
            bottom: 0,
            emojiText: 'bb'
        }

        Quill.getSelection = jest.fn(() => ({
            index: 2,
            range: 0
        }))
        Quill.getText = () => 'th:bb'
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            newDelta([{ retain: 1 }, { insert: 'a' }]),
            undefined,
            QuillSources.API
        )

        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            newDelta([{ retain: 2 }, { insert: 'a' }]),
            undefined,
            QuillSources.API
        )

        await setImmediatePromise()

        expect(store.dispatch).toBeCalledWith({
            data: {
                bottom: 0,
                emojiText: 'bb',
                initialIndex: 3,
                left: 0,
                showEmojiPicker: true
            },
            type: 'SET_EMOJI_PICKER'
        })

        expect(state.emojiPicker.initialIndex).toEqual(4)
    })

    describe('#_colonDeletedByOtherUser', () => {
        it('reports the colon as deleted by another user when the picker is shown, the latest delta is to delete, and the selectionIndex is less than the initialIndex', () => {
            const manager = new EmojiPickerManager(Quill, { enabled: true })
            const initialIndex = 1
            const test1 = manager._colonDeletedByOtherUser(
                newDelta([{ retain: 2 }, { delete: 1 }]),
                1,
                initialIndex
            )

            expect(test1).toBe(true)

            // first op in delta is not a retain
            const test2 = manager._colonDeletedByOtherUser(
                newDelta([{ insert: 2 }, { delete: 1 }]),
                1,
                initialIndex
            )

            expect(test2).toBe(false)

            // selectionIndex is after initialIndex
            const test4 = manager._colonDeletedByOtherUser(
                newDelta([{ insert: 2 }, { delete: 1 }]),
                4,
                initialIndex
            )

            expect(test4).toBe(false)
        })
    })

    describe('Pane Emoji', () => {
        it('send the emoji to the correct editor', async () => {
            const editorId = '123'
            new EmojiPickerManager(Quill, { enabled: true, editorId })
            store.getState = jest.fn(() => {
                return {
                    emojiPicker: {
                        showEmojiPicker: false
                    },
                    selection: {
                        codeBlock: false
                    }
                }
            })
            const delta = newDelta([{ retain: 2 }, { insert: 'o' }])
            Quill.getSelection = jest.fn(() => ({
                index: 3,
                range: 0
            }))
            Quill.getText = () => ':do'
            Quill.emit(
                QuillEvents.EDITOR_CHANGE,
                QuillEvents.TEXT_CHANGE,
                delta,
                undefined,
                'user'
            )
            await setImmediatePromise()

            expect(store.dispatch).toBeCalledWith({
                data: {
                    bottom: 0,
                    emojiText: ':do',
                    initialIndex: 0,
                    left: 0,
                    showEmojiPicker: true,
                    editorId
                },
                type: 'SET_EMOJI_PICKER'
            })
        })
    })
})
