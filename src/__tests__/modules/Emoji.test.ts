import {
    Emoji,
    normalizeVariationSelectorEmoji
} from '../../components/quill/modules/Emoji'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import QuillSources from '../../components/quill/modules/QuillSources'
import Delta from 'quill-delta'

const Quill: any = jest.genMockFromModule('quill/core')

const heartEyes = {
    emoji: '😍',
    name: 'SMILING FACE WITH HEART-SHAPED EYES',
    shortName: 'heart_eyes',
    skin: '1',
    unified: '1F60D',
    baseString: '1F60D',
    skinCode: '',
    nonQualified: ''
}
const one = {
    emoji: '1️⃣',
    name: 'KEYCAP 1',
    shortName: 'one',
    skin: '1',
    baseString: '0031-FE0F-20E3',
    skinCode: '',
    unified: '31-FE0F-20E3',
    nonQualified: '0031-20E3'
}
const family = {
    emoji: '👨‍👩‍👧‍👦',
    name: 'man-woman-girl-boy',
    shortName: 'man-woman-girl-boy',
    skin: '1',
    baseString: '1F468-200D-1F469-200D-1F467-200D-1F466',
    skinCode: '',
    unified: '1F468-200D-1F469-200D-1F467-200D-1F466',
    nonQualified: ''
}
const fingersCrossed = {
    emoji: '🤞🏾',
    name: 'HAND WITH INDEX AND MIDDLE FINGERS CROSSED',
    shortName: 'crossed_fingers',
    skin: '5',
    baseString: '1F91E',
    skinCode: '1F3FE',
    unified: '1F91E-1F3FE',
    nonQualified: ''
}

beforeEach(() => {
    const events = {}

    Quill.root = document.createElement('div')

    Quill.on = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }

    Quill.off = (eventName: string, handler: Function) => {
        delete events[eventName]
    }

    Quill.emit = (eventName: string, ...args: any[]) => {
        events[eventName](...args)
    }

    Quill.updateContents = jest.fn()
    Quill.deleteText = jest.fn()
    Quill.update = jest.fn()
    Quill.history = {
        clear: jest.fn()
    }
    Quill.setSelection = jest.fn()
    Quill.getSelection = jest.fn(() => {
        return {
            index: 1,
            length: 5
        }
    })
    Quill.clipboard = {
        addMatcher: jest.fn()
    }
    Quill.getFormat = jest.fn()
    Quill.deleteText = jest.fn()
    Quill.update = jest.fn()
    Quill.history = {
        clear: jest.fn(),
        stack: {
            undo: []
        },
        record: function(this: any) {
            this.stack.undo.push('deathstar')
        }
    }
    Quill.container = document.createElement('div')
    Quill.container.id = 'quill-container'
})

describe('Emoji', () => {
    it('should watch for editor and clipboard changes when module is enabled', () => {
        Quill.on = jest.fn()
        new Emoji(Quill, true)
        expect(Quill.clipboard.addMatcher).toBeCalled()
        expect(Quill.on).toBeCalled()
    })
    it('should not watch for editor and clipboard changes when module is disabled', () => {
        Quill.on = jest.fn()
        new Emoji(Quill, false)
        expect(Quill.clipboard.addMatcher).not.toBeCalled()
        expect(Quill.on).not.toBeCalled()
    })
    it('should convert an emoji insert op into an emoji blot', () => {
        new Emoji(Quill, true)
        const {
            emoji,
            baseString,
            name,
            shortName,
            skin,
            skinCode,
            unified,
            nonQualified
        } = heartEyes
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            { ops: [{ insert: emoji }] },
            {},
            QuillSources.USER
        )
        expect(Quill.deleteText).toBeCalledWith(
            emoji.length - (emoji.length - 1),
            emoji.length,
            QuillSources.SILENT
        )
        expect(Quill.updateContents).toBeCalledWith(
            {
                ops: [
                    {
                        insert: {
                            'emoji-embed': {
                                baseString,
                                name,
                                shortName,
                                skin,
                                skinCode,
                                unified,
                                nonQualified
                            }
                        }
                    }
                ]
            },
            QuillSources.SILENT
        )
    })
    it('should not add the pasted emoji to history', () => {
        new Emoji(Quill, true)
        const { emoji } = heartEyes
        Quill.history.stack.undo.push('The pasted emoji')
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            { ops: [{ insert: emoji }] },
            {},
            QuillSources.USER
        )
        expect(Quill.history.stack.undo).toHaveLength(1)
    })
    it('should convert a complex emoji insert op into an emoji blot', () => {
        new Emoji(Quill, true)
        const {
            emoji,
            baseString,
            name,
            shortName,
            skin,
            skinCode,
            unified,
            nonQualified
        } = family
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            { ops: [{ insert: emoji }] },
            {},
            QuillSources.USER
        )
        expect(Quill.deleteText).toBeCalledWith(
            emoji.length - (emoji.length - 1),
            emoji.length,
            QuillSources.SILENT
        )
        expect(Quill.updateContents).toBeCalledWith(
            {
                ops: [
                    {
                        insert: {
                            'emoji-embed': {
                                baseString,
                                name,
                                shortName,
                                skin,
                                skinCode,
                                unified,
                                nonQualified
                            }
                        }
                    }
                ]
            },
            QuillSources.SILENT
        )
    })
    it('should convert an emoji with skin tone insert op into an emoji blot', () => {
        new Emoji(Quill, true)
        const {
            emoji,
            baseString,
            name,
            shortName,
            skin,
            skinCode,
            unified,
            nonQualified
        } = fingersCrossed
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            { ops: [{ insert: emoji }] },
            {},
            QuillSources.USER
        )
        expect(Quill.deleteText).toBeCalledWith(
            emoji.length - (emoji.length - 1),
            emoji.length,
            QuillSources.SILENT
        )
        expect(Quill.updateContents).toBeCalledWith(
            {
                ops: [
                    {
                        insert: {
                            'emoji-embed': {
                                baseString,
                                name,
                                shortName,
                                skin,
                                skinCode,
                                unified,
                                nonQualified
                            }
                        }
                    }
                ]
            },
            QuillSources.SILENT
        )
    })
    it('should convert an emoji with skin tone insert op into an emoji blot on paste', () => {
        const emojiClass = new Emoji(Quill, true)
        const {
            emoji,
            baseString,
            name,
            shortName,
            skin,
            skinCode,
            unified,
            nonQualified
        } = heartEyes
        const incomingPasteDelta = new Delta().insert(emoji)
        const outgoingPasteDelta = emojiClass._convertEmojiOnPaste(
            incomingPasteDelta
        )
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            { ops: [{ insert: emoji }] },
            {},
            QuillSources.USER
        )
        expect(Quill.deleteText).toBeCalledWith(
            emoji.length - (emoji.length - 1),
            emoji.length,
            QuillSources.SILENT
        )
        expect(outgoingPasteDelta.ops).toEqual([
            {
                insert: {
                    'emoji-embed': {
                        baseString,
                        name,
                        shortName,
                        skin,
                        skinCode,
                        unified,
                        nonQualified
                    }
                }
            }
        ])
    })
    it('should convert an emoji with retain and delete ops', () => {
        new Emoji(Quill, true)
        const {
            emoji,
            baseString,
            name,
            shortName,
            skin,
            skinCode,
            unified,
            nonQualified
        } = family
        const retainLength = 5
        const deleteLength = 3
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            {
                ops: [
                    { retain: retainLength },
                    { delete: deleteLength },
                    { insert: emoji }
                ]
            },
            {},
            QuillSources.USER
        )
        const docIndex = retainLength - deleteLength + emoji.length
        expect(Quill.deleteText).toBeCalledWith(
            docIndex - (emoji.length - 1),
            emoji.length,
            QuillSources.SILENT
        )
        expect(Quill.updateContents).toBeCalledWith(
            {
                ops: [
                    { retain: retainLength },
                    {
                        insert: {
                            'emoji-embed': {
                                baseString,
                                name,
                                shortName,
                                skin,
                                skinCode,
                                unified,
                                nonQualified
                            }
                        }
                    },
                    { delete: deleteLength }
                ]
            },
            QuillSources.SILENT
        )
    })
    it('should do nothing when there are no ops', () => {
        const emojiClass = new Emoji(Quill, true)
        const incomingPasteDelta = new Delta()
        const outgoingPasteDelta = emojiClass._convertEmojiOnPaste(
            incomingPasteDelta
        )
        expect(outgoingPasteDelta.ops).toEqual([])
    })
})

describe('#normalizeVariationSelectorEmoji', () => {
    it('should convert 2-digit variation selector emoji codes to 4-digit', () => {
        expect(one.unified).toHaveLength(12)

        const result = normalizeVariationSelectorEmoji(one.unified)

        expect(result).toHaveLength(14)
        expect(result).toMatch(/00[0-9A-F]{2}\-FE0F/g)
    })
})
