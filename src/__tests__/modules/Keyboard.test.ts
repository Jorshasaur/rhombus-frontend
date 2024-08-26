import { find } from 'lodash'
import Delta from 'quill-delta'
import quillModule from 'quill/core'
import MentionAnalytics from '../../analytics/AnalyticsBuilders/MentionAnalytics'
import StyleChangeAnalytics from '../../analytics/AnalyticsBuilders/StyleChangeAnalytics'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import { Emoji } from '../../components/quill/modules/Emoji'
import Keyboard, { Binding } from '../../components/quill/modules/Keyboard'
import * as analyticsBindings from '../../components/quill/modules/keyboardBindings/analytics'
import QuillSources from '../../components/quill/modules/QuillSources'
import quillProvider from '../../components/quill/provider'
import * as selectionReducer from '../../data/reducers/selection'
import { getSelectedIndex } from '../../data/selection/selectors'
import * as selectors from '../../data/selectors'
import store from '../../data/store'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { keycodes } from '../../interfaces/keycodes'
import { REG_EX_PATTERNS } from '../../constants/keyboard'
import { members } from '../mockData/members'
import { dispatchKeydownEvent } from '../utils'

const Parchment = quillModule.import('parchment')

jest.mock('cuid', () => {
    return () => {
        return 'cuid1'
    }
})

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

const StyleChangeTrackSpy = jest
    .spyOn(StyleChangeAnalytics.prototype, 'track')
    .mockImplementation(jest.fn())
const MentionTrackSpy = jest
    .spyOn(MentionAnalytics.prototype, 'track')
    .mockImplementation(jest.fn())

const QuillKeyboard = quillModule.import('modules/keyboard')

const Quill: any = jest.genMockFromModule('quill/core')

jest.mock('../../QuillRegistry', () => {
    return {
        getEditor: () => {
            return Quill
        }
    }
})

const isFirstLineSpy = jest.spyOn(selectors, 'isFirstLine')
const addBindingsForAnalytics = jest.spyOn(
    analyticsBindings,
    'addBindingsForAnalytics'
)

interface GetLineFunc {
    (index: number): [any, number]
}

const service: BlockEmbedService = 'prototype'

const blockEmbedValue = {
    version: 1,
    originalLink: 'https://link.com',
    service,
    type: 'test',
    uuid: '1',
    authorId: '1',
    embedData: {},
    createdAt: '2018-11-08T21:18:24.424Z'
}

function createGetLine(
    textContent: string,
    offset: number = 0,
    additionalProperties: any = {}
): GetLineFunc {
    return function getLine(index: number) {
        const line = {
            domNode: {
                textContent
            },
            format: jest.fn(),
            length() {
                return textContent.length
            },
            prev: {}
        }
        const obj = Object.assign(line, additionalProperties)
        return [obj, offset]
    }
}
function matchFormatInlineFunction(
    handler: string,
    regexPattern: string,
    formats: string
) {
    const testString = `REG_EX_PATTERNS.${regexPattern}, [${formats}]);}`.replace(
        /\s/g,
        ''
    )
    return handler.includes(testString)
}

beforeEach(() => {
    Quill.root = {
        addEventListener: jest.fn()
    }
    Quill.scroll = {
        deleteAt: jest.fn()
    }
    Quill.deleteText = jest.fn()
    Quill.focus = jest.fn()
    Quill.format = jest.fn()
    Quill.formatLine = jest.fn()
    Quill.insertText = jest.fn()
    Quill.insertEmbed = jest.fn()
    Quill.setSelection = jest.fn()
    Quill.scrollIntoView = jest.fn()
    Quill.updateContents = jest.fn()
    Quill.container = document.createElement('div')
    Quill.getSelection = () => {
        return {
            index: 0
        }
    }
    Quill.getBounds = () => {
        return {
            bottom: 0,
            top: 0
        }
    }
    Quill.getLength = () => {
        return 10
    }

    jest.resetAllMocks()
})
const keyboardOptions = {
    emoji: {
        picker: true,
        shortcode: true
    },
    mentions: true,
    bindings: QuillKeyboard.DEFAULTS.bindings,
    markdown: {
        header: true,
        bold: true,
        code: true,
        divider: true,
        strike: true,
        italic: true,
        link: true,
        codeBlock: true,
        list: true,
        underline: true,
        blockquote: true
    }
}
describe('Keyboard Module', () => {
    it('should have a Quill instance', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        expect(testKeyboard.quill).toBeDefined()
    })
    it('should register bindings', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const spaceStartEmojiBinding = find(
            testKeyboard.bindings[keycodes.Semicolon],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.openBlankEmojiPicker.toString()
        )
        const exitEmojiOnSpaceBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.exitEmojiOnSpace.toString()
        )
        const checkEmojiOnEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.checkEmojiOnEnter.toString()
        )
        const escapeEmojiBinding = find(
            testKeyboard.bindings[keycodes.Escape],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.escapeEmoji.toString()
        )

        const handleAtKeyBinding = find(
            testKeyboard.bindings[keycodes.Two],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleAtKey.toString()
        )
        const checkMembersOnEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.checkMembersOnEnter.toString()
        )
        const escapeMentionsBinding = find(
            testKeyboard.bindings[keycodes.Escape],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.escapeMentions.toString()
        )
        const handleMentionsUpBinding = find(
            testKeyboard.bindings[keycodes.Up],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleMentionsUp.toString()
        )
        const handleMentionsDownBinding = find(
            testKeyboard.bindings[keycodes.Down],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleMentionsDown.toString()
        )

        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                    testKeyboard.makeList.toString() && !binding.shiftKey
        )
        const makeListWithShift = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                    testKeyboard.makeList.toString() && binding.shiftKey
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
        expect(makeListWithShift).toBeDefined()

        expect(handleAtKeyBinding).toBeDefined()
        expect(checkMembersOnEnterBinding).toBeDefined()
        expect(escapeMentionsBinding).toBeDefined()
        expect(handleMentionsUpBinding).toBeDefined()
        expect(handleMentionsDownBinding).toBeDefined()

        expect(exitEmojiOnSpaceBinding).toBeDefined()
        expect(checkEmojiOnEnterBinding).toBeDefined()
        expect(escapeEmojiBinding).toBeDefined()
        expect(spaceStartEmojiBinding).toBeDefined()

        expect(addBindingsForAnalytics).toHaveBeenCalled()
    })
    it('should not register bindings if in commentMode', () => {
        const testKeyboard = new Keyboard(Quill, {
            mentions: false,
            commentMode: true,
            bindings: []
        })
        const spaceStartEmojiBinding = find(
            testKeyboard.bindings[keycodes.Semicolon],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.openBlankEmojiPicker.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                    testKeyboard.makeList.toString() && !binding.shiftKey
        )
        expect(spaceStartEmojiBinding).toBeUndefined()
        expect(makeList).toBeUndefined()
    })
    it('should register comment bindings if in commentMode', () => {
        const commentBinding = {
            key: keycodes.Enter,
            shortKey: true,
            handler: () => {
                return
            }
        }
        const testKeyboard = new Keyboard(Quill, {
            mentions: false,
            commentMode: true,
            bindings: [],
            commentBindings: [commentBinding]
        })
        const foundCommentBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() === commentBinding.handler.toString()
        )
        expect(foundCommentBinding).toBeDefined()
    })
    it('should register mention bindings if in commentMode', () => {
        const testKeyboard = new Keyboard(Quill, {
            mentions: true,
            commentMode: true,
            bindings: []
        })
        const handleAtKeyBinding = find(
            testKeyboard.bindings[keycodes.Two],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleAtKey.toString()
        )
        expect(handleAtKeyBinding).toBeDefined()
    })
    it('should not register emoji bindings if disabled', () => {
        const noEmojiOptions = {
            ...keyboardOptions,
            emoji: {
                picker: false,
                shortcode: false
            }
        }
        const testKeyboard = new Keyboard(Quill, noEmojiOptions)
        const exitEmojiOnSpaceBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.exitEmojiOnSpace.toString()
        )
        const checkEmojiOnEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.checkEmojiOnEnter.toString()
        )
        const escapeEmojiBinding = find(
            testKeyboard.bindings[keycodes.Escape],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.escapeEmoji.toString()
        )
        expect(exitEmojiOnSpaceBinding).not.toBeDefined()
        expect(checkEmojiOnEnterBinding).not.toBeDefined()
        expect(escapeEmojiBinding).not.toBeDefined()
    })
    it('should not register mentions bindings if disabled', () => {
        const noMentionOptions = {
            ...keyboardOptions,
            mentions: false
        }
        const testKeyboard = new Keyboard(Quill, noMentionOptions)

        const handleAtKeyBinding = find(
            testKeyboard.bindings[keycodes.Two],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleAtKey.toString()
        )
        const checkMembersOnEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.checkMembersOnEnter.toString()
        )
        const escapeMentionsBinding = find(
            testKeyboard.bindings[keycodes.Escape],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.escapeMentions.toString()
        )
        const handleMentionsUpBinding = find(
            testKeyboard.bindings[keycodes.Up],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleMentionsUp.toString()
        )
        const handleMentionsDownBinding = find(
            testKeyboard.bindings[keycodes.Down],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.handleMentionsDown.toString()
        )

        expect(handleAtKeyBinding).not.toBeDefined()
        expect(checkMembersOnEnterBinding).not.toBeDefined()
        expect(escapeMentionsBinding).not.toBeDefined()
        expect(handleMentionsUpBinding).not.toBeDefined()
        expect(handleMentionsDownBinding).not.toBeDefined()
    })
    it('should not register markdown header bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: false,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).not.toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown bold bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: false,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).not.toBeDefined()
        expect(makeBoldStrikeBinding).not.toBeDefined()
        expect(makeBoldUnderlineBinding).not.toBeDefined()
        expect(makeBoldItalicBinding).not.toBeDefined()
        expect(makeBoldBinding).not.toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown code bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: false,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).not.toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).not.toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).not.toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).not.toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown divider bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: false,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).not.toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown strike through bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: false,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).not.toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).not.toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).not.toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).not.toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown italic bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: false,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).not.toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).not.toBeDefined()
        expect(makeItalicCodeBinding).not.toBeDefined()
        expect(makeItalicBinding).not.toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown link bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: false,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).not.toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown code block bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: false,
                list: true,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).not.toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown list bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: false,
                underline: true,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                    testKeyboard.makeList.toString() && !binding.shiftKey
        )
        const makeListWithShift = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                    testKeyboard.makeList.toString() && binding.shiftKey
        )

        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).not.toBeDefined()
        expect(makeListWithShift).not.toBeDefined()
    })
    it('should not register markdown underline bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: false,
                blockquote: true
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).not.toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).not.toBeDefined()
        expect(makeUnderlineCodeBinding).not.toBeDefined()
        expect(makeUnderlineBinding).not.toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should not register markdown blockquote bindings if disabled', () => {
        const noMarkdownOptions = {
            ...keyboardOptions,
            markdown: {
                header: true,
                bold: true,
                code: true,
                divider: true,
                strike: true,
                italic: true,
                link: true,
                codeBlock: true,
                list: true,
                underline: true,
                blockquote: false
            }
        }
        const testKeyboard = new Keyboard(Quill, noMarkdownOptions)
        const makeHeadlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeHeadline.toString()
        )
        const makeDividerEnterBinding = find(
            testKeyboard.bindings[keycodes.Enter],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeDividerEnter.toString()
        )
        const makeBoldCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldCode',
                    `'bold', 'code'`
                )
        )
        const makeBoldStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldStrikethrough',
                    `'bold', 'strike'`
                )
        )
        const makeBoldUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldUnderline',
                    `'bold', 'underline'`
                )
        )
        const makeBoldItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'boldItalic',
                    `'bold', 'italic'`
                )
        )
        const makeBoldBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'bold',
                    `'bold'`
                )
        )
        const makeUnderlineStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineStrikethrough',
                    `'underline', 'strike'`
                )
        )
        const makeUnderlineCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underlineCode',
                    `'underline', 'code'`
                )
        )
        const makeUnderlineBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'underline',
                    `'underline'`
                )
        )
        const makeItalicStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicStrikethrough',
                    `'italic', 'strike'`
                )
        )
        const makeItalicCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italicCode',
                    `'italic', 'code'`
                )
        )
        const makeItalicBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'italic',
                    `'italic'`
                )
        )
        const makeStrikeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'strikethrough',
                    `'strike'`
                )
        )
        const makeLinkBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeLink.toString()
        )
        const makeCodeBlockBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeCodeBlock.toString()
        )
        const makeCodeBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                matchFormatInlineFunction(
                    binding.handler.toString().replace(/\s/g, ''),
                    'code',
                    `'code'`
                )
        )
        const makeBlockQuoteBinding = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() ===
                testKeyboard.makeBlockquote.toString()
        )
        const makeList = find(
            testKeyboard.bindings[keycodes.Space],
            (binding: any) =>
                binding.handler.toString() === testKeyboard.makeList.toString()
        )
        expect(makeHeadlineBinding).toBeDefined()
        expect(makeDividerEnterBinding).toBeDefined()
        expect(makeBoldCodeBinding).toBeDefined()
        expect(makeBoldStrikeBinding).toBeDefined()
        expect(makeBoldUnderlineBinding).toBeDefined()
        expect(makeBoldItalicBinding).toBeDefined()
        expect(makeBoldBinding).toBeDefined()
        expect(makeUnderlineStrikeBinding).toBeDefined()
        expect(makeUnderlineCodeBinding).toBeDefined()
        expect(makeUnderlineBinding).toBeDefined()
        expect(makeItalicStrikeBinding).toBeDefined()
        expect(makeItalicCodeBinding).toBeDefined()
        expect(makeItalicBinding).toBeDefined()
        expect(makeStrikeBinding).toBeDefined()
        expect(makeLinkBinding).toBeDefined()
        expect(makeCodeBlockBinding).toBeDefined()
        expect(makeCodeBinding).toBeDefined()
        expect(makeBlockQuoteBinding).not.toBeDefined()
        expect(makeList).toBeDefined()
    })
    it('should add a binding', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        // There should be no function bound to the key
        expect(testKeyboard.bindings[9999]).toBeUndefined()
        testKeyboard.addBinding({ key: 9999 }, () => true)
        // There should now be a function bound to the key
        expect(testKeyboard.bindings[9999]).toHaveLength(1)
    })

    it('should format a headline', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '#'
        const index = prefix.length

        testKeyboard.makeHeadline(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(0, prefix.length, 'user')
        expect(Quill.format).toHaveBeenCalledWith(
            'header',
            prefix.length,
            'user'
        )

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format an unordered list', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '*'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(prefix)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        // It deletes the old text
        expect(Quill.formatLine).toHaveBeenCalledWith(
            0,
            1,
            'list',
            'unordered',
            'user'
        )

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format an ordered list', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '1.'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(prefix)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        // It deletes the old text
        expect(Quill.formatLine).toHaveBeenCalledWith(
            0,
            1,
            'list',
            'ordered',
            'user'
        )

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format an unchecked list', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '[]'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(prefix)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        // It deletes the old text
        expect(Quill.formatLine).toHaveBeenCalledWith(
            0,
            1,
            'list',
            'unchecked',
            'user'
        )

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format a checked list', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '[x]'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(prefix)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        // It deletes the old text
        expect(Quill.formatLine).toHaveBeenCalledWith(
            0,
            1,
            'list',
            'checked',
            'user'
        )

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should should not create lists in the title', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '-'
        const index = prefix.length

        isFirstLineSpy.mockReturnValueOnce(true)
        testKeyboard.addSpace = jest.fn()
        testKeyboard.quill.getLine = createGetLine(prefix)
        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        expect(isFirstLineSpy).toHaveBeenCalled()
        expect(testKeyboard.addSpace).toHaveBeenCalled()

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })

    it('should format a link', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const linkText = 'Link Here'
        const linkAddress = 'www.link.com'
        const textContent = `[${linkText}](${linkAddress})`
        const index = 0

        testKeyboard.quill.getLine = createGetLine(textContent)

        testKeyboard.makeLink(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} }
        )
        expect(Quill.insertText).toHaveBeenCalledWith(
            index,
            linkText,
            'link',
            linkAddress,
            'user'
        )

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format bold', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Bold'
        const textContent = `**${finalText}**`
        const index = textContent.length
        const pattern = /(?:\*){2}(.+?)(?:\*){2}/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['bold']
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { bold: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { bold: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format bold code', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Bold Code'
        const textContent = `**\`${finalText}\`**`
        const index = textContent.length
        const pattern = /(?:\*\*\`|\`\*\*)(.+?)(?:\`\*\*|\*\*\`)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['bold', 'code']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { bold: true, code: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { bold: false, code: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format bold italic', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Bold Italic'
        const textContent = `**_${finalText}_**`
        const index = textContent.length
        const pattern = /(?:\*\*\_|\_\*\*)(.+?)(?:\_\*\*|\*\*\_)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['bold', 'italic']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { bold: true, italic: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { bold: false, italic: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format bold strikethrough', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Bold Strike'
        const textContent = `**~~${finalText}~~**`
        const index = textContent.length
        const pattern = /(?:\*\*\~\~|\~\~\*\*)(.+?)(?:\~\~\*\*|\*\*\~\~)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['bold', 'strike']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { bold: true, strike: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { bold: false, strike: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format bold underline', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Bold underline'
        const textContent = `**__${finalText}__**`
        const index = textContent.length
        const pattern = /(?:\*\*\_\_|\_\_\*\*)(.+?)(?:\_\_\*\*|\*\*\_\_)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['bold', 'underline']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { bold: true, underline: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { bold: false, underline: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format inline code', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Code'
        const textContent = `\`${finalText}\``
        const index = textContent.length
        const pattern = /(?:`)(.+?)(?:`)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['code']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { code: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { code: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format italic with emoji before it in the same line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Italic'
        const textContent = `:crystal_ball:_${finalText}_`
        const index = finalText.length + 2
        const pattern = REG_EX_PATTERNS.italic

        testKeyboard.quill.getLine = createGetLine(
            textContent,
            textContent.length
        )
        testKeyboard.quill.getLeaf = createGetLine(
            textContent.substring(14),
            index
        )
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['italic']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: Binding) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            finalText.length + 2,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { italic: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { italic: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format italic with emoji after it in the same line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Italic'
        const textContent = `_${finalText}_:crystal_ball:`
        const index = finalText.length + 2
        const pattern = REG_EX_PATTERNS.italic

        testKeyboard.quill.getLine = createGetLine(
            textContent,
            textContent.length
        )
        testKeyboard.quill.getLeaf = createGetLine(
            textContent.substring(0, 8),
            index
        )
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['italic']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            finalText.length + 2,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { italic: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { italic: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format italic code', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Italic Code'
        const textContent = `\`_${finalText}_\``
        const index = textContent.length
        const pattern = /(?:\`\_|\_\`)(.+?)(?:\_\`|\`\_)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['italic', 'code']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { italic: true, code: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { italic: false, code: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format italic strikethrough', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Italic Strikethrough'
        const textContent = `~~_${finalText}_~~`
        const index = textContent.length
        const pattern = /(?:\_\~\~|\~\~\_)(.+?)(?:\~\~\_|\_\~\~)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['italic', 'strike']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { italic: true, strike: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { italic: false, strike: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format strikethrough', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Strikethrough'
        const textContent = `~~${finalText}~~`
        const index = textContent.length
        const pattern = /(?:~~)(.+?)(?:~~)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['strike']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { strike: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { strike: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format underline', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Underline'
        const textContent = `__${finalText}__`
        const index = textContent.length
        const pattern = /(?:\_){2}(.+?)(?:\_){2}/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['underline']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { underline: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { underline: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format underline code', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Underline Code'
        const textContent = `__\`${finalText}\`__`
        const index = textContent.length
        const pattern = /(?:\_\_\`|\`\_\_)(.+?)(?:\`\_\_|\_\_\`)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['underline', 'code']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { underline: true, code: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { underline: false, code: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should format underline strikethrough', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const finalText = 'Underline strikethrough'
        const textContent = `__~~${finalText}~~__`
        const index = textContent.length
        const pattern = /(?:\_\_\~\~|\~\~\_\_)(.+?)(?:\~\~\_\_|\_\_\~\~)/

        testKeyboard.quill.getLeaf = createGetLine(textContent, index)
        testKeyboard.formatInline(
            { index },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} },
            pattern,
            ['underline', 'strike']
        )

        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            0,
            textContent.length,
            'user'
        )
        // It inserts the new formatted text without markdown, followed by an unformatted space
        expect(Quill.insertText.mock.calls[0]).toEqual([
            0,
            finalText,
            { underline: true, strike: true },
            'user'
        ])
        expect(Quill.insertText.mock.calls[1]).toEqual([
            finalText.length,
            ' ',
            { underline: false, strike: false },
            'user'
        ])

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })

    it('should handle enter at the beginning of a header', () => {
        Quill.root = document.createElement('div')

        Quill.hasFocus = () => {
            return true
        }

        Quill.getLeaf = () => {
            return []
        }

        Quill.getSelection = () => {
            return {
                index: 0,
                length: 0
            }
        }

        const testKeyboard = new Keyboard(Quill, keyboardOptions)

        const textContent = 'A headline'
        const format = { header: 1 }

        testKeyboard.quill.getIndex = () => {
            return 0
        }

        testKeyboard.quill.getLine = createGetLine(textContent, 0, {
            children: [
                {
                    domNode: {
                        textContent
                    }
                }
            ]
        })

        testKeyboard.quill.getFormat = () => format

        dispatchKeydownEvent(Quill.root, keycodes.Enter)

        const delta = new Delta().retain(0).insert('\n', { id: 'cuid1' })

        expect(Quill.updateContents).toBeCalledWith(delta, QuillSources.USER)
        expect(Quill.setSelection).toBeCalledWith(1, QuillSources.SILENT)
    })

    it('should handle enter at the checked item', () => {
        Quill.root = document.createElement('div')

        Quill.hasFocus = () => {
            return true
        }

        Quill.getLeaf = () => {
            return []
        }

        Quill.getSelection = () => {
            return {
                index: 2,
                length: 0
            }
        }

        const testKeyboard = new Keyboard(Quill, keyboardOptions)

        const textContent = 'Checked item'
        const offset = 4
        const format = { list: 'checked', id: 'cuid2' }

        testKeyboard.quill.getIndex = () => {
            return 0
        }

        testKeyboard.quill.getLine = createGetLine(textContent, offset, {
            children: [
                {
                    domNode: {
                        textContent
                    }
                }
            ],
            formats: () => {
                return format
            }
        })

        testKeyboard.quill.getFormat = () => format

        dispatchKeydownEvent(Quill.root, keycodes.Enter)

        const delta = new Delta()
            .retain(2)
            .insert('\n', { list: 'checked', id: 'cuid2' })
            .retain(7)
            .retain(1, { list: 'unchecked', id: 'cuid1' })

        expect(Quill.updateContents).toBeCalledWith(delta, QuillSources.USER)
        expect(Quill.setSelection).toBeCalledWith(3, QuillSources.SILENT)
        expect(Quill.scrollIntoView).toHaveBeenCalled()
    })

    it('should handle enter for empty list item', () => {
        Quill.root = document.createElement('div')

        Quill.hasFocus = () => {
            return true
        }

        Quill.getLeaf = () => {
            return []
        }

        Quill.getSelection = () => {
            return {
                index: 2,
                length: 0
            }
        }

        const testKeyboard = new Keyboard(Quill, keyboardOptions)

        const textContent = ''
        const offset = 0
        const format = { list: 'unordered', indent: 1 }

        testKeyboard.quill.getIndex = () => {
            return 0
        }

        testKeyboard.quill.getLine = createGetLine(textContent, offset, {
            children: [
                {
                    domNode: {
                        textContent
                    }
                }
            ],
            formats: () => {
                return format
            }
        })

        testKeyboard.quill.getFormat = () => format

        dispatchKeydownEvent(Quill.root, keycodes.Enter)

        expect(Quill.format).toBeCalledWith('list', false, QuillSources.USER)
        expect(Quill.format).toBeCalledWith('indent', false, QuillSources.USER)
    })

    it('should add id for new line', () => {
        Quill.root = document.createElement('div')

        Quill.hasFocus = () => {
            return true
        }

        Quill.getLeaf = () => {
            return []
        }

        Quill.getSelection = () => {
            return {
                index: 2,
                length: 0
            }
        }

        const testKeyboard = new Keyboard(Quill, keyboardOptions)

        const textContent = 'Text'
        const offset = 4
        const format = { id: 'cuid2' }

        testKeyboard.quill.getIndex = () => {
            return 0
        }

        testKeyboard.quill.getLine = createGetLine(textContent, offset, {
            children: [
                {
                    domNode: {
                        textContent
                    }
                }
            ],
            formats: () => {
                return format
            }
        })

        testKeyboard.quill.getFormat = () => format

        Parchment.query = () => {
            return true
        }

        dispatchKeydownEvent(Quill.root, keycodes.Enter)

        const delta = new Delta()
            .retain(2)
            .insert('\n', { id: 'cuid2' })
            .retain(1, { id: 'cuid1' })

        expect(Quill.updateContents).toBeCalledWith(delta, QuillSources.USER)
        expect(Quill.setSelection).toBeCalledWith(3, QuillSources.SILENT)
    })

    it('should handle enter in the middle of a header', () => {
        Quill.root = document.createElement('div')

        Quill.hasFocus = () => {
            return true
        }

        Quill.getLeaf = () => {
            return []
        }

        Quill.getSelection = () => {
            return {
                index: 2,
                length: 0
            }
        }

        const testKeyboard = new Keyboard(Quill, keyboardOptions)

        const textContent = 'A headline'
        const offset = 4
        const format = { header: 1, id: 'cuid2' }

        testKeyboard.quill.getIndex = () => {
            return 0
        }

        testKeyboard.quill.getLine = createGetLine(textContent, offset, {
            children: [
                {
                    domNode: {
                        textContent
                    }
                }
            ]
        })

        testKeyboard.quill.getFormat = () => format

        dispatchKeydownEvent(Quill.root, keycodes.Enter)

        const delta = new Delta()
            .retain(2)
            .insert('\n', { header: 1, id: 'cuid2' })
            .retain(5)
            .retain(1, { header: null, id: 'cuid1' })

        expect(Quill.updateContents).toBeCalledWith(delta, QuillSources.USER)
        expect(Quill.setSelection).toBeCalledWith(3, QuillSources.SILENT)
    })

    it('should undo code formatting on backspace at the end of inline code', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const firstTextContent = 'Non code block'
        const codeTextContent = 'Code block'
        const thirdTextContent = 'Another non code block'
        const index = 0

        testKeyboard.quill.getLine = () => [
            {
                children: [
                    {
                        domNode: {
                            textContent: firstTextContent
                        }
                    },
                    {
                        domNode: {
                            textContent: codeTextContent
                        }
                    },
                    {
                        domNode: {
                            textContent: thirdTextContent
                        }
                    }
                ],
                format: jest.fn()
            },
            0
        ]
        testKeyboard.undoCodeFormat(
            { index: 0 },
            {
                empty: false,
                offset: firstTextContent.length + codeTextContent.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[8],
            (binding: any) => binding.format.indexOf('code') > -1
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It deletes the old text
        expect(Quill.deleteText).toHaveBeenCalledWith(
            index - codeTextContent.length,
            codeTextContent.length,
            'user'
        )
        // It inserts the new unformatted text with a ` at the beginning
        expect(Quill.insertText).toHaveBeenCalledWith(
            index - codeTextContent.length,
            '`' + codeTextContent,
            { code: false },
            'user'
        )
    })

    it('should delete a blockquote and escape its formatting when pressing delete on an empty line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const format = jest.fn()
        testKeyboard.quill.getLine = () => [
            {
                format
            },
            0
        ]
        testKeyboard.deleteBlockquote(
            { index: 0 },
            {
                empty: true,
                offset: 0,
                prefix: '',
                suffix: '',
                format: { blockquote: true }
            }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[8],
            (binding: any) => binding.format.indexOf('blockquote') > -1
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It should remove the blockquote format on the line
        expect(format).toHaveBeenCalledWith('blockquote', false, 'user')
    })

    it('should not undo code formatting on backspace in the middle of inline code', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const firstTextContent = 'Non code block'
        const codeTextContent = 'Code block'
        const thirdTextContent = 'Another non code block'
        const index = 0

        testKeyboard.quill.getLine = () => [
            {
                children: [
                    {
                        domNode: {
                            textContent: firstTextContent
                        }
                    },
                    {
                        domNode: {
                            textContent: codeTextContent
                        }
                    },
                    {
                        domNode: {
                            textContent: thirdTextContent
                        }
                    }
                ],
                format: jest.fn()
            },
            0
        ]
        testKeyboard.undoCodeFormat(
            { index },
            {
                empty: false,
                offset: firstTextContent.length + codeTextContent.length - 4,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        // It does not delete text
        expect(Quill.deleteText).toHaveBeenCalledTimes(0)
        // It does not insert any text
        expect(Quill.insertText).toHaveBeenCalledTimes(0)
    })

    it('should exit inline code when a space is entered at the end', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const codeTextContent = 'Code block'
        const index = 0
        const pattern = /^(?![\s\S])/
        testKeyboard.handleSpaceAtCodeEnd(
            { index: 0 },
            {
                empty: false,
                offset: codeTextContent.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[32],
            (binding: any) =>
                Array.isArray(binding.format) &&
                binding.format.indexOf('code') > -1 &&
                binding.suffix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        // It inserts an unformatted space at the end
        expect(Quill.insertText).toHaveBeenCalledWith(
            index,
            ' ',
            { code: false },
            'user'
        )
        // It sets the selection after the new space
        expect(Quill.setSelection).toHaveBeenCalledWith(index + 1, 'silent')
    })

    it('should select embed when a backspace is pressed and embed is on previous line', () => {
        quillProvider.setQuill(Quill)

        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const textContent = 'A link'
        const index = 5
        const offset = 0
        const format = {}

        const prev = new BlockEmbed(BlockEmbed.create(blockEmbedValue))

        testKeyboard.quill.getLine = createGetLine(textContent, offset, {
            prev
        })
        testKeyboard.handleBackspace(
            { index },
            { empty: true, offset, prefix: '', suffix: '', format }
        )

        expect(Quill.deleteText).toBeCalledWith(5, 1, QuillSources.USER)
        expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)
        expect(prev.domNode.classList.contains('selected')).toBe(true)
        expect(prev.isSelected).toBe(true)
        expect(prev.domNode).toBe(document.activeElement)
    })

    it('should not select embed when a backspace is pressed and embed is on previous line and offset isnt 0', () => {
        quillProvider.setQuill(Quill)

        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const textContent = 'A link'
        const index = 5
        const offset = 4
        const format = {}

        const prev = new BlockEmbed(BlockEmbed.create(blockEmbedValue))

        testKeyboard.quill.getLine = createGetLine(textContent, offset, {
            prev
        })
        testKeyboard.handleBackspace(
            { index },
            { empty: true, offset, prefix: '', suffix: '', format }
        )

        expect(Quill.setSelection).not.toBeCalled()
        expect(prev.domNode.classList.contains('selected')).not.toBe(true)
        expect(prev.isSelected).not.toBe(true)
        expect(prev.domNode).not.toBe(document.activeElement)
    })

    describe('BlockEmbed', () => {
        beforeEach(() => {
            const state = store.getState()
            state.selection = selectionReducer.selection(
                selectionReducer.initialState,
                { type: 'INIT' }
            )

            store.dispatch = jest.fn(({ type, data }) => {
                state.selection = selectionReducer.selection(state.selection, {
                    type,
                    data
                })
            })
        })

        it('should select embed when a left key is pressed and offset is 0', () => {
            quillProvider.setQuill(Quill)

            const testKeyboard = new Keyboard(Quill, keyboardOptions)
            const textContent = 'A link'
            const index = 2
            const offset = 0
            const format = {}

            const prev = new BlockEmbed(BlockEmbed.create(blockEmbedValue))

            testKeyboard.quill.getLine = createGetLine(textContent, offset, {
                prev
            })
            testKeyboard.handleLeftKey(
                { index },
                { empty: true, offset, prefix: '', suffix: '', format }
            )

            expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)
            expect(prev.domNode.classList.contains('selected')).toBe(true)
            expect(prev.isSelected).toBe(true)
            expect(prev.domNode).toBe(document.activeElement)
            expect(getSelectedIndex(store.getState())).toBe(1)
        })

        it('should not select embed when a left key is pressed and offset is 4', () => {
            quillProvider.setQuill(Quill)

            const testKeyboard = new Keyboard(Quill, keyboardOptions)
            const textContent = 'A link'
            const index = 0
            const offset = 4
            const format = {}

            const prev = new BlockEmbed(BlockEmbed.create(blockEmbedValue))

            testKeyboard.quill.getLine = createGetLine(textContent, offset, {
                prev
            })
            testKeyboard.handleLeftKey(
                { index },
                { empty: true, offset, prefix: '', suffix: '', format }
            )

            expect(Quill.setSelection).not.toBeCalledWith(
                null,
                QuillSources.SILENT
            )
            expect(prev.isSelected).toBe(false)
            expect(prev.domNode).not.toBe(document.activeElement)
            expect(getSelectedIndex(store.getState())).toBe(null)
        })

        it('should select embed when a up key is pressed', () => {
            quillProvider.setQuill(Quill)

            const testKeyboard = new Keyboard(Quill, keyboardOptions)
            const textContent = 'A link'
            const index = 6
            const offset = 4
            const format = {}

            const prev = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
            const children = {
                head: {
                    domNode: document.createElement('strong')
                },
                domNode: {
                    textContent
                }
            }

            testKeyboard.quill.getLine = createGetLine(textContent, offset, {
                prev,
                children
            })
            testKeyboard.handleUpKey(
                { index },
                { empty: true, offset, prefix: '', suffix: '', format }
            )

            expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)
            expect(prev.domNode.classList.contains('selected')).toBe(true)
            expect(prev.isSelected).toBe(true)
            expect(prev.domNode).toBe(document.activeElement)
            expect(getSelectedIndex(store.getState())).toBe(1)
        })

        it('should select embed when a down key is pressed', () => {
            quillProvider.setQuill(Quill)

            const testKeyboard = new Keyboard(Quill, keyboardOptions)
            const textContent = 'A link'
            const index = 6
            const offset = 4
            const format = {}

            const next = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
            const children = {
                head: {
                    domNode: document.createElement('strong')
                },
                domNode: {
                    textContent
                }
            }

            const length = () => {
                return offset + 1
            }

            testKeyboard.quill.getLine = createGetLine(textContent, offset, {
                next,
                children,
                length
            })
            testKeyboard.handleDownKey(
                { index },
                { empty: true, offset, prefix: '', suffix: '', format }
            )

            expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)
            expect(next.domNode.classList.contains('selected')).toBe(true)
            expect(next.isSelected).toBe(true)
            expect(next.domNode).toBe(document.activeElement)
            expect(getSelectedIndex(store.getState())).toBe(7)
        })

        it('should select embed when a right key is pressed and offset is same as length of line', () => {
            quillProvider.setQuill(Quill)

            const testKeyboard = new Keyboard(Quill, keyboardOptions)
            const textContent = 'A link'
            const index = 6
            const offset = 4
            const format = {}

            const next = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
            const length = () => {
                return offset + 1
            }

            testKeyboard.quill.getLine = createGetLine(textContent, offset, {
                next,
                length
            })
            testKeyboard.handleRightKey(
                { index },
                { empty: true, offset, prefix: '', suffix: '', format }
            )

            expect(Quill.setSelection).toBeCalledWith(null, QuillSources.SILENT)
            expect(next.domNode.classList.contains('selected')).toBe(true)
            expect(next.isSelected).toBe(true)
            expect(next.domNode).toBe(document.activeElement)
            expect(getSelectedIndex(store.getState())).toBe(7)
        })

        it('should not select embed when a right key is pressed and offset is not same as length of line', () => {
            quillProvider.setQuill(Quill)

            const testKeyboard = new Keyboard(Quill, keyboardOptions)
            const textContent = 'A link'
            const index = 6
            const offset = 2
            const format = {}

            const next = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
            const length = () => {
                return 6
            }

            testKeyboard.quill.getLine = createGetLine(textContent, offset, {
                next,
                length
            })
            testKeyboard.handleRightKey(
                { index },
                { empty: true, offset, prefix: '', suffix: '', format }
            )

            expect(Quill.setSelection).not.toBeCalledWith(
                null,
                QuillSources.SILENT
            )
            expect(next.isSelected).toBe(false)
            expect(next.domNode).not.toBe(document.activeElement)
            expect(getSelectedIndex(store.getState())).toBe(null)
        })
    })

    it('should show the mentions dialog on @ press', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const mentionsContext = ''
        const index = 0
        const pattern = REG_EX_PATTERNS.emptyOrSpace
        testKeyboard.handleAtKey(
            { index },
            {
                empty: false,
                offset: mentionsContext.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Two],
            (binding: any) => binding.prefix.toString() === pattern.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(store.dispatch).toHaveBeenCalled()
    })
    it('should hide the mentions dialog on enter', () => {
        store.getState = jest.fn(() => ({
            mentions: {
                showMentionsList: false
            },
            comments: {}
        }))
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const mentionsContext = ''
        const index = 0
        testKeyboard.checkMembersOnEnter(
            { index },
            {
                empty: false,
                offset: mentionsContext.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        // Find the binding for the pattern
        expect(store.dispatch).toHaveBeenCalledWith({
            type: 'CLEAR_MENTION_LIST'
        })
        expect(MentionTrackSpy).not.toHaveBeenCalled()
    })
    it('should insert a mention on enter', () => {
        quillProvider.setQuill(Quill)
        const mentions = {
            members,
            mentionText: 'Adm',
            selectedMemberIndex: 0,
            showMentionsList: true,
            initialIndex: 1,
            currentIndex: 5
        }
        store.getState = jest.fn(() => ({
            mentions,
            comments: {}
        }))
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const mentionsContext = ''
        const index = 0
        testKeyboard.checkMembersOnEnter(
            { index },
            {
                empty: false,
                offset: mentionsContext.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        // Find the binding for the pattern
        const quillInstance = quillProvider.getQuill()
        expect(quillInstance.deleteText).toBeCalledWith(
            mentions.initialIndex,
            mentions.currentIndex - mentions.initialIndex,
            'user'
        )
        expect(quillInstance.insertEmbed).toBeCalledWith(
            mentions.initialIndex,
            'mention',
            mentions.members[mentions.selectedMemberIndex],
            'user'
        )
        expect(quillInstance.focus).toBeCalled()
        expect(quillInstance.setSelection).toBeCalledWith(
            mentions.initialIndex + 1,
            'silent'
        )
        expect(store.dispatch).toBeCalledWith({ type: 'CLEAR_MENTION_LIST' })
        expect(MentionTrackSpy).toHaveBeenCalled()
    })
    it('should move through mentions on the down key', () => {
        quillProvider.setQuill(Quill)
        const mentions = {
            members,
            mentionText: 'Adm',
            selectedMemberIndex: 0,
            showMentionsList: true,
            initialIndex: 1,
            currentIndex: 5
        }
        store.getState = jest.fn(() => ({
            mentions
        }))
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const mentionsContext = ''
        const index = 0
        testKeyboard.handleMentionsDown(
            { index },
            {
                empty: false,
                offset: mentionsContext.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        expect(store.dispatch).toBeCalledWith({
            data: { selectedMemberIndex: mentions.selectedMemberIndex + 1 },
            type: 'SET_SELECTED_MEMBER_INDEX'
        })
    })
    it('should move through mentions on the up key', () => {
        quillProvider.setQuill(Quill)
        const mentions = {
            members,
            mentionText: 'Adm',
            selectedMemberIndex: 1,
            showMentionsList: true,
            initialIndex: 1,
            currentIndex: 5
        }
        store.getState = jest.fn(() => ({
            mentions
        }))
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const mentionsContext = ''
        const index = 0
        testKeyboard.handleMentionsUp(
            { index },
            {
                empty: false,
                offset: mentionsContext.length,
                prefix: '',
                suffix: '',
                format: {}
            }
        )
        expect(store.dispatch).toBeCalledWith({
            data: { selectedMemberIndex: mentions.selectedMemberIndex - 1 },
            type: 'SET_SELECTED_MEMBER_INDEX'
        })
    })
    it('should insert a divider when enter is pressed after a dash on an empty line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine('-', 1, {})
        const makeDividerEnter = testKeyboard.makeDividerEnter(
            { index },
            { empty: false, offset: 0, prefix: '-', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[13],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.singleDashEmptyLine.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).toBeCalledWith(index - 1, 1, QuillSources.USER)
        expect(Quill.updateContents).toBeCalledWith(
            new Delta()
                .retain(index - 1)
                .insert('\n', { divider: true, id: 'cuid1' }),
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(index, QuillSources.SILENT)
        expect(makeDividerEnter).toBe(false)
    })
    it('should not insert a divider when enter is pressed after a dash on an line that has other text', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine(
            'This is some text and a dash -',
            1,
            {}
        )
        const makeDividerEnter = testKeyboard.makeDividerEnter(
            { index },
            { empty: false, offset: 0, prefix: '-', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[13],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.singleDashEmptyLine.toString()
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.updateContents).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(makeDividerEnter).toBe(true)

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
    it('should insert a divider when --- is entered on an otherwise empty line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine('--', 1, {})
        const makeDividerEnter = testKeyboard.makeDivider(
            { index },
            { empty: false, offset: 0, prefix: '--', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Dash],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.divider.toString() &&
                !binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).toBeCalledWith(index - 2, 2, QuillSources.USER)
        expect(Quill.updateContents).toBeCalledWith(
            new Delta()
                .retain(index - 2)
                .insert('\n', { divider: true, id: 'cuid1' }),
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(
            index - 1,
            QuillSources.SILENT
        )
        expect(makeDividerEnter).toBe(false)

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })
    it('should insert a divider when ___ is entered on an otherwise empty line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine('__', 1, {})
        const makeDividerEnter = testKeyboard.makeDivider(
            { index },
            { empty: false, offset: 0, prefix: '__', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Dash],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.divider.toString() &&
                binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).toBeCalledWith(index - 2, 2, QuillSources.USER)
        expect(Quill.updateContents).toBeCalledWith(
            new Delta()
                .retain(index - 2)
                .insert('\n', { divider: true, id: 'cuid1' }),
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(
            index - 1,
            QuillSources.SILENT
        )
        expect(makeDividerEnter).toBe(false)

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })
    it('should insert a divider when *** is entered on an otherwise empty line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine('**', 1, {})
        const makeDividerEnter = testKeyboard.makeDivider(
            { index },
            { empty: false, offset: 0, prefix: '**', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Eight],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.divider.toString() &&
                binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).toBeCalledWith(index - 2, 2, QuillSources.USER)
        expect(Quill.updateContents).toBeCalledWith(
            new Delta()
                .retain(index - 2)
                .insert('\n', { divider: true, id: 'cuid1' }),
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(
            index - 1,
            QuillSources.SILENT
        )
        expect(makeDividerEnter).toBe(false)

        expect(StyleChangeTrackSpy).toHaveBeenCalled()
    })
    it('should not insert a divider when --- is entered on a line with other text at the beginning', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine(
            'Hey some other text--',
            1,
            {}
        )
        const makeDividerEnter = testKeyboard.makeDivider(
            { index },
            { empty: false, offset: 0, prefix: '--', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Dash],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.divider.toString() &&
                !binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.updateContents).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(makeDividerEnter).toBe(true)

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
    it('should not insert a divider when --- is entered on a line with other text at the end', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine('--More text?', 1, {})
        const makeDividerEnter = testKeyboard.makeDivider(
            { index },
            { empty: false, offset: 0, prefix: '--', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Dash],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.divider.toString() &&
                !binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.updateContents).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(makeDividerEnter).toBe(true)

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
    it('should not insert a divider when --- is entered on a line with multiple dashes', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.quill.getLine = createGetLine('---------', 1, {})
        const makeDividerEnter = testKeyboard.makeDivider(
            { index },
            { empty: false, offset: 0, prefix: '--', suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Dash],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.divider.toString() &&
                !binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.updateContents).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(makeDividerEnter).toBe(true)

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
    it('should indent when tab is pressed anywhere in a list', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.indentList(
            { index },
            {
                empty: false,
                offset: 0,
                prefix: 'Prefix',
                suffix: 'Suffix',
                format: { list: 'unordered' }
            }
        )
        expect(Quill.format).toBeCalledWith('indent', '+1', QuillSources.USER)
    })
    it('should outdent when shift + tab is pressed anywhere in a list', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = 0
        testKeyboard.outdentList(
            { index },
            {
                empty: false,
                offset: 0,
                prefix: 'Prefix',
                suffix: 'Suffix',
                format: { list: 'unordered' }
            }
        )
        expect(Quill.format).toBeCalledWith('indent', '-1', QuillSources.USER)
    })
    it('should insert an emoji when a matching shortname is typed', () => {
        const prefix = ':wink'
        const emoji = {
            native: '😉'
        }
        const emojiData = Emoji.getEmoji(emoji.native, 'native')
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = prefix.length
        const makeEmojiEmbed = testKeyboard.insertEmojiShortname(
            { index },
            { empty: false, offset: 0, prefix, suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Semicolon],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.emojiShortname.toString() &&
                binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).toBeCalledWith(
            index - prefix.length,
            prefix.length,
            QuillSources.USER
        )
        expect(Quill.insertEmbed).toBeCalledWith(
            index - prefix.length,
            'emoji-embed',
            emojiData,
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(
            index - prefix.length + 1,
            QuillSources.USER
        )
        expect(makeEmojiEmbed).toBe(false)
    })
    it('should not insert an emoji when a non-matching shortname is typed', () => {
        const prefix = ':dinosaur'
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const index = prefix.length
        const makeEmojiEmbed = testKeyboard.insertEmojiShortname(
            { index },
            { empty: false, offset: 0, prefix, suffix: '', format: {} }
        )
        // Find the binding for the pattern
        const keyBinding = find(
            testKeyboard.bindings[keycodes.Semicolon],
            (binding: any) =>
                binding.prefix &&
                binding.prefix.toString() ===
                    REG_EX_PATTERNS.emojiShortname.toString() &&
                binding.shiftKey
        )
        // There should be a defined binding
        expect(keyBinding).toBeDefined()
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.insertEmbed).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(makeEmojiEmbed).toBe(true)
    })
    it('should open the blank emoji picker', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const openBlankPicker = testKeyboard.openBlankEmojiPicker(
            { index: 0 },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} }
        )
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.insertEmbed).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(openBlankPicker).toBe(true)
    })
    it('should open the blank emoji picker using the correct editor id', () => {
        const editorId = '1234'
        const testKeyboard = new Keyboard(Quill, {
            ...keyboardOptions,
            editorId
        })
        const openBlankPicker = testKeyboard.openBlankEmojiPicker(
            { index: 0 },
            { empty: false, offset: 0, prefix: '', suffix: '', format: {} }
        )
        expect(Quill.deleteText).not.toBeCalled()
        expect(Quill.insertEmbed).not.toBeCalled()
        expect(Quill.setSelection).not.toBeCalled()
        expect(store.dispatch).toHaveBeenCalledWith({
            data: {
                bottom: 0,
                emojiText: '',
                initialIndex: 0,
                left: undefined,
                showEmojiPicker: true,
                editorId
            },
            type: 'SET_EMOJI_PICKER'
        })
        expect(openBlankPicker).toBe(true)
    })
    it('should move the selection on backspace on the last line', () => {
        const keyboard = new Keyboard(Quill, keyboardOptions)
        keyboard.quill.getLine = createGetLine(' ')
        const testRange = { index: 9, length: 0 }
        const testContext = {
            empty: false,
            offset: 0,
            prefix: '',
            suffix: '',
            format: {}
        }
        keyboard.handleBackspace(testRange, testContext)
        expect(Quill.setSelection).toBeCalled()
    })
    it('should not format an unordered list at the end of a line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '*'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(`some content ${prefix}`)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        expect(Quill.formatLine).not.toHaveBeenCalled()

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
    it('should not format an ordered list at the end of a line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '1.'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(`some content ${prefix}`)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        expect(Quill.formatLine).not.toHaveBeenCalled()

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
    it('should not format an unchecked list at the end of a line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '[]'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(`some content ${prefix}`)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        expect(Quill.formatLine).not.toHaveBeenCalled()

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })

    it('should not format a checked list at the end of a line', () => {
        const testKeyboard = new Keyboard(Quill, keyboardOptions)
        const prefix = '[x]'
        const index = prefix.length

        testKeyboard.quill.getLine = createGetLine(`some content ${prefix}`)
        isFirstLineSpy.mockReturnValueOnce(false)

        testKeyboard.makeList(
            { index },
            {
                empty: false,
                offset: prefix.length,
                prefix,
                suffix: '',
                format: {}
            }
        )

        expect(Quill.formatLine).not.toHaveBeenCalled()

        expect(StyleChangeTrackSpy).not.toHaveBeenCalled()
    })
})
