import cuid from 'cuid'
import data, { EmojiData } from 'emoji-datasource'
import { find, isEqual } from 'lodash'
import PubSub from 'pubsub-js'
import Delta, { StringMap } from 'quill-delta'
import Quill from 'quill/core'
import Keyboard from 'quill/modules/keyboard'
import MentionAnalytics from '../../../analytics/AnalyticsBuilders/MentionAnalytics'
import StyleChangeAnalytics from '../../../analytics/AnalyticsBuilders/StyleChangeAnalytics'
import { REG_EX_PATTERNS } from '../../../constants/keyboard'
import { DEFAULT_MENTIONS_TYPE } from '../../../constants/mentions'
import { EMBED_INSERT } from '../../../constants/topics'
import {
    clearEmojiPicker,
    clearMentionList,
    setEmojiPicker,
    setMentionList,
    updateSelectedMentionMember
} from '../../../data/actions'
import { isFirstLine } from '../../../data/selectors'
import store from '../../../data/store'
import { Embed } from '../../../interfaces/Embed'
import { keycodes } from '../../../interfaces/keycodes'
import { Line, LineElement } from '../../../interfaces/line'
import { Member } from '../../../interfaces/member'
import { getBounds, isBlankLine } from '../utils'
import insertMention from '../utils/insertMention'
import { Emoji } from './Emoji'
import { addBindingsForAnalytics } from './keyboardBindings/analytics'
import QuillSources from './QuillSources'

const Cursor = Quill.import('blots/cursor')
const Parchment = Quill.import('parchment')

interface EmojiOptions {
    picker: boolean
    shortcode: boolean
}
interface MarkdownOptions {
    header: boolean
    bold: boolean
    code: boolean
    divider: boolean
    strike: boolean
    italic: boolean
    link: boolean
    codeBlock: boolean
    list: boolean
    underline: boolean
    blockquote: boolean
}

type Format = boolean | number | string
interface Formats {
    [key: string]: Format
}

export interface Context {
    format: Formats
    offset: number
    prefix: string
    suffix: string
    empty: boolean
}
export interface Range {
    index: number
    length?: number
}
export interface Selection {
    index: number
}

export interface InsertElement {
    insertionPoint: number
    insertionText: string
    format: {
        [key: string]: boolean | number
    }
}

export interface FormattedLineChild {
    insertionPoint: number
    insertionText: string
    format: StringMap
}

export interface Binding {
    key: number
    collapsed?: boolean
    empty?: boolean
    offset?: number
    format?: string[]
    prefix?: RegExp
    suffix?: RegExp
    shortKey?: boolean
    shiftKey?: boolean | null
    handler: {
        call: (target: {}, range: Range, context: Context) => boolean
    }
}

interface KeyboardOptions {
    bindings: Binding[]
    emoji?: EmojiOptions
    markdown?: MarkdownOptions
    mentions?: boolean
    mentionsType?: string
    commentMode?: boolean
    commentBindings?: Binding[]
    editorId?: string
}

// We're replacing default handler so we can add the ID attr to new lines
// and also to handle enter in the middle of header
Keyboard.DEFAULTS.bindings['header enter'] = {
    key: keycodes.Enter,
    collapsed: true,
    format: ['header'],
    handler: function(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)

        const delta = new Delta()
            .retain(range.index)
            .insert('\n', context.format)
            .retain(line.length() - offset - 1)
            .retain(1, { header: null, id: cuid() })

        this.quill.updateContents(delta, QuillSources.USER)
        this.quill.setSelection(range.index + 1, QuillSources.SILENT)
        this.quill.scrollIntoView()
    }
}

// We're replacing default handler so we can add the ID attr to new lines
Keyboard.DEFAULTS.bindings['checklist enter'] = {
    key: keycodes.Enter,
    collapsed: true,
    format: { list: 'checked' },
    handler: function(range: Range) {
        const [line, offset] = this.quill.getLine(range.index)
        const formats = Object.assign({}, line.formats(), { list: 'checked' })
        const delta = new Delta()
            .retain(range.index)
            .insert('\n', formats)
            .retain(line.length() - offset - 1)
            .retain(1, { list: 'unchecked', id: cuid() })
        this.quill.updateContents(delta, QuillSources.USER)
        this.quill.setSelection(range.index + 1, QuillSources.SILENT)
        this.quill.scrollIntoView()
    }
}

// We're replacing default handler so we can add the ID attr to new lines
Keyboard.DEFAULTS.bindings['code exit'] = {
    key: keycodes.Enter,
    collapsed: true,
    format: ['code-block'],
    prefix: /\n\n$/,
    suffix: /^\s+$/,
    handler: function(range: Range) {
        const [line, offset] = this.quill.getLine(range.index)
        const delta = new Delta()
            .retain(range.index + line.length() - offset - 2)
            .retain(1, { 'code-block': null, id: cuid() })
            .delete(1)
        this.quill.updateContents(delta, QuillSources.USER)
    }
}

class ModifiedKeyboard extends Keyboard {
    public quill: Quill
    public bindings: Binding[][]
    public addBinding: (
        key: { key: keycodes; shiftKey?: null | boolean; offset?: number },
        modifier: {},
        func: Function
    ) => void
    private mentionsType: string
    private editorId?: string

    constructor(quill: Quill, options: KeyboardOptions) {
        super(quill, options)

        this.mentionsType = options.mentionsType || DEFAULT_MENTIONS_TYPE
        this.editorId = options.editorId

        const isCommentMode =
            options.commentMode === undefined ? false : options.commentMode
        if (isCommentMode) {
            this._switchToSimpleBindings(
                options.commentBindings,
                options.mentions
            )
            return
        }

        // Quill's default enter, delete, and tab events overwrite those added with addBinding(). Push ours to the front.
        // Exit a blockquote when pressing "enter" on an empty line

        // Find and replace default enter handler
        // We're replacing default enter handler so we can add the ID attr to new lines
        const defaultEnterHandlerIndex = this.getDefaultEnterHandlerIndex()
        this.bindings[keycodes.Enter][defaultEnterHandlerIndex] = {
            key: keycodes.Enter,
            shiftKey: null,
            handler: this.handleEnter
        }

        this.bindings[keycodes.Enter].unshift({
            key: keycodes.Enter,
            collapsed: true,
            offset: 0,
            handler: this.handleBeginningEnter
        })

        this.bindings[keycodes.Enter].unshift({
            key: keycodes.Enter,
            collapsed: true,
            format: ['list'],
            empty: true,
            handler: this.handleListEmptyEnter
        })

        this.bindings[keycodes.Enter].unshift({
            key: keycodes.Enter,
            collapsed: true,
            empty: true,
            format: ['blockquote'],
            handler: this.exitBlockquote
        })
        this.bindings[keycodes.Backspace].unshift({
            key: keycodes.Backspace,
            collapsed: true,
            handler: this.handleBackspace
        })
        // Exit a code block when deleting an empty line
        this.bindings[keycodes.Backspace].unshift({
            key: keycodes.Backspace,
            collapsed: true,
            empty: true,
            format: ['code-block'],
            handler: this.deleteCodeBlock
        })

        // Exit a blockquote when deleting an empty line
        this.bindings[keycodes.Backspace].unshift({
            key: keycodes.Backspace,
            collapsed: true,
            empty: true,
            format: ['blockquote'],
            handler: this.deleteBlockquote
        })
        // Exit a code block when deleting an empty line
        this.bindings[keycodes.Backspace].unshift({
            key: keycodes.Backspace,
            collapsed: true,
            format: ['code'],
            handler: this.undoCodeFormat
        })

        if (options.emoji) {
            this._registerEmoji(options.emoji)
        }
        if (options.markdown) {
            this._registerMarkdown(options.markdown)
        }
        if (options.mentions) {
            this._registerMentions()
        }
        // Indent or outdent a list when tab or shift tab is pressed anywhere on the line
        this.bindings[keycodes.Tab].unshift({
            key: keycodes.Tab,
            format: ['list'],
            handler: this.indentList
        })
        this.bindings[keycodes.Tab].unshift({
            key: keycodes.Tab,
            format: ['list'],
            shiftKey: true,
            handler: this.outdentList
        })

        // Handle space at the end of inline code
        this.addBinding(
            { key: keycodes.Space },
            { suffix: REG_EX_PATTERNS.emptyString, format: ['code'] },
            this.handleSpaceAtCodeEnd
        )
        this.bindings[keycodes.Left].unshift({
            key: keycodes.Left,
            shiftKey: false,
            handler: this.handleLeftKey
        })

        this.addBinding(
            { key: keycodes.Up },
            { shiftKey: false },
            this.handleUpKey
        )

        this.bindings[keycodes.Right].unshift({
            key: keycodes.Right,
            shiftKey: false,
            handler: this.handleRightKey
        })

        this.addBinding(
            { key: keycodes.Down },
            { shiftKey: false },
            this.handleDownKey
        )

        // do this last since they are all pass through bindings and will no go first
        addBindingsForAnalytics(this.bindings)
    }

    getDefaultEnterHandlerIndex() {
        const defaultEnterHandler = this.bindings[keycodes.Enter].find(
            (binding) => {
                return (
                    Object.keys(binding).length === 3 &&
                    binding.key === keycodes.Enter &&
                    binding.shiftKey === null
                )
            }
        )
        return this.bindings[keycodes.Enter].indexOf(defaultEnterHandler!)
    }

    private _switchToSimpleBindings = (
        commentBindings: Binding[] | undefined,
        hasMentions: boolean | undefined
    ) => {
        Object.keys(this.bindings).map((key) => {
            this.bindings[key] = []
        })
        if (commentBindings) {
            Object.keys(commentBindings).map((key) => {
                const binding = commentBindings![key]
                this.bindings[binding.key].unshift(binding)
            })
        }
        if (hasMentions) {
            this._registerMentions()
        }
    }

    private _registerMarkdown = (formats: MarkdownOptions) => {
        const {
            header,
            bold,
            code,
            divider,
            strike,
            italic,
            link,
            codeBlock,
            list,
            underline,
            blockquote
        } = formats
        if (header) {
            // Convert text to a headline after entering #, ##, or ###
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                {
                    prefix: REG_EX_PATTERNS.headline,
                    format: {
                        list: false
                    }
                },
                this.makeHeadline
            )
        }
        if (list) {
            // Convert a line to it's respective list type when entering 1., [], [x], or *
            // Needs to be at front to override 'list autofill' default in quill
            this.bindings[keycodes.Space].unshift({
                key: keycodes.Space,
                shiftKey: false,
                collapsed: true,
                prefix: REG_EX_PATTERNS.list,
                handler: this.makeList
            })
            // this is the same binding with the shift allowed
            this.bindings[keycodes.Space].unshift({
                key: keycodes.Space,
                shiftKey: true,
                collapsed: true,
                prefix: REG_EX_PATTERNS.list,
                handler: this.makeList
            })
        }
        if (divider) {
            this.bindings[keycodes.Enter].unshift({
                key: keycodes.Enter,
                prefix: REG_EX_PATTERNS.singleDashEmptyLine,
                empty: false,
                handler: this.makeDividerEnter
            })
            // Insert a divider after entering ___, ---, or ***
            this.addBinding(
                { key: keycodes.Dash },
                {
                    prefix: REG_EX_PATTERNS.divider,
                    shiftKey: false
                },
                this.makeDivider
            )
            this.addBinding(
                { key: keycodes.Dash },
                {
                    prefix: REG_EX_PATTERNS.divider,
                    shiftKey: true
                },
                this.makeDivider
            )
            this.addBinding(
                { key: keycodes.Eight },
                {
                    prefix: REG_EX_PATTERNS.divider,
                    shiftKey: true
                },
                this.makeDivider
            )
        }
        if (bold && code) {
            // Convert text to bold code when it's between `** or **`
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.boldCode },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.boldCode,
                        ['bold', 'code']
                    )
            )
        }
        if (bold && strike) {
            // Convert text to bold strikethrough when it's between **~~ or ~~**
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.boldStrikethrough },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.boldStrikethrough,
                        ['bold', 'strike']
                    )
            )
        }
        if (bold && underline) {
            // Convert text to bold underline when it's between **__ or __**
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.boldUnderline },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.boldUnderline,
                        ['bold', 'underline']
                    )
            )
        }
        if (bold && italic) {
            // Convert text to bold italic when it's between **_ or _**
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.boldItalic },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.boldItalic,
                        ['bold', 'italic']
                    )
            )
        }
        if (bold) {
            // Convert text to bold when it's between a pair of **
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.bold },
                (range: Range, context: Context) =>
                    this.formatInline(range, context, REG_EX_PATTERNS.bold, [
                        'bold'
                    ])
            )
        }
        if (underline && strike) {
            // Convert text to underlined strikethrough when it's between ~~__ or __~~
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.underlineStrikethrough },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.underlineStrikethrough,
                        ['underline', 'strike']
                    )
            )
        }
        if (underline && code) {
            // Convert text to underlined code when it's between `__ or __`
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.underlineCode },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.underlineCode,
                        ['underline', 'code']
                    )
            )
        }
        if (underline) {
            // Underline text when it's between a pair of __
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.underline },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.underline,
                        ['underline']
                    )
            )
        }
        if (italic && strike) {
            // Convert text to italic strikethrough when it's between ~~_ or _~~
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.italicStrikethrough },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.italicStrikethrough,
                        ['italic', 'strike']
                    )
            )
        }
        if (italic && code) {
            // Convert text to italic code when it's between `_ or _`
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.italicCode },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.italicCode,
                        ['italic', 'code']
                    )
            )
        }
        if (italic) {
            // Convert text to italic when it's between a pair of _
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.italic },
                (range: Range, context: Context) =>
                    this.formatInline(range, context, REG_EX_PATTERNS.italic, [
                        'italic'
                    ])
            )
        }
        if (strike) {
            // Strikethrough text when it's between a pair of ~~
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.strikethrough },
                (range: Range, context: Context) =>
                    this.formatInline(
                        range,
                        context,
                        REG_EX_PATTERNS.strikethrough,
                        ['strike']
                    )
            )
        }
        if (link) {
            // Convert a text to a link when it's formatted [Link Text](https://thelinkhere.com)
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.link },
                this.makeLink
            )
        }
        if (codeBlock) {
            // Create a code block following ```
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.codeBlock },
                this.makeCodeBlock
            )
        }
        if (code) {
            // Convert text to code when it's between a pair of `
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.code },
                (range: Range, context: Context) =>
                    this.formatInline(range, context, REG_EX_PATTERNS.code, [
                        'code'
                    ])
            )
        }
        if (blockquote) {
            // Create a blockquote following >
            this.addBinding(
                {
                    key: keycodes.Space,
                    shiftKey: null
                },
                { prefix: REG_EX_PATTERNS.blockquote },
                this.makeBlockquote
            )
        }
    }
    private _registerEmoji = (options: EmojiOptions) => {
        const { picker, shortcode } = options
        if (picker) {
            this.bindings[keycodes.Enter].unshift({
                key: keycodes.Enter,
                empty: false,
                handler: this.checkEmojiOnEnter
            })
            this.addBinding({ key: keycodes.Space }, {}, this.exitEmojiOnSpace)
            this.addBinding({ key: keycodes.Escape }, {}, this.escapeEmoji)
        }
        if (shortcode) {
            this.addBinding(
                { key: keycodes.Semicolon },
                {
                    format: { 'code-block': false },
                    prefix: REG_EX_PATTERNS.emojiShortname,
                    shiftKey: true
                },
                this.insertEmojiShortname
            )
            this.addBinding(
                {
                    key: keycodes.Semicolon,
                    shiftKey: true
                },
                {
                    prefix: REG_EX_PATTERNS.emojiSpaceStart
                },
                this.openBlankEmojiPicker
            )

            // open emoji picker at the start of a line
            this.addBinding(
                {
                    key: keycodes.Semicolon,
                    shiftKey: true,
                    offset: 0
                },
                {},
                this.openBlankEmojiPicker
            )
        }
    }
    private _registerMentions = () => {
        this.addBinding(
            { key: keycodes.Two },
            { prefix: REG_EX_PATTERNS.emptyOrSpace, shiftKey: true },
            this.handleAtKey
        )
        this.bindings[keycodes.Enter].unshift({
            key: keycodes.Enter,
            empty: false,
            handler: this.checkMembersOnEnter
        })
        this.addBinding({ key: keycodes.Escape }, {}, this.escapeMentions)
        this.addBinding(
            { key: keycodes.Up },
            { shiftKey: false },
            this.handleMentionsUp
        )

        this.addBinding(
            { key: keycodes.Down },
            { shiftKey: false },
            this.handleMentionsDown
        )
    }
    /**
     * Listen method came from quill Keyboard module
     * https://github.com/quilljs/quill/blob/develop/modules/keyboard.js#L74
     *
     * we need to keep it up to date with any changes that happen on this method on quill
     * and we should remove it once cursor bug will be fixed directly in quill
     *
     */
    listen() {
        this.quill.root.addEventListener('keydown', (evt: KeyboardEvent) => {
            if (evt.defaultPrevented) {
                return
            }
            const which = evt.which || evt.keyCode
            const bindings = (this.bindings[which] || []).filter(
                function(binding: {}) {
                    return Keyboard.match(evt, binding)
                }
            )
            if (bindings.length === 0) {
                return
            }
            const range = this.quill.getSelection()
            if (range == null || !this.quill.hasFocus()) {
                return
            }
            const [line, offset] = this.quill.getLine(range.index)
            let [leafStart, offsetStart] = this.quill.getLeaf(range.index)

            // 3 lines below are addition for original listen method from Quill
            // it corrects prefix when leafStart is Cursor
            if (leafStart instanceof Cursor) {
                ;[leafStart, offsetStart] = this.quill.getLeaf(range.index - 1)
                offsetStart += 1
            }

            const [leafEnd, offsetEnd] =
                range.length === 0
                    ? [leafStart, offsetStart]
                    : this.quill.getLeaf(range.index + range.length)

            const prefixText =
                leafStart instanceof Parchment.Text
                    ? leafStart.value().slice(0, offsetStart)
                    : ''
            const suffixText =
                leafEnd instanceof Parchment.Text
                    ? leafEnd.value().slice(offsetEnd)
                    : ''
            const curContext = {
                collapsed: range.length === 0,
                empty: range.length === 0 && line.length() <= 1,
                format: this.quill.getFormat(range),
                offset: offset,
                prefix: prefixText,
                suffix: suffixText
            }

            const prevented = bindings.some((binding: Binding) => {
                if (
                    binding.collapsed != null &&
                    binding.collapsed !== curContext.collapsed
                ) {
                    return false
                }
                if (
                    binding.empty != null &&
                    binding.empty !== curContext.empty
                ) {
                    return false
                }
                if (
                    binding.offset != null &&
                    binding.offset !== curContext.offset
                ) {
                    return false
                }
                if (Array.isArray(binding.format)) {
                    // any format is present
                    if (
                        binding.format.every(function(name: string) {
                            return curContext.format[name] == null
                        })
                    ) {
                        return false
                    }
                } else if (typeof binding.format === 'object') {
                    // all formats must match
                    if (
                        !Object.keys(binding.format).every(function(
                            name: string
                        ) {
                            if (binding.format![name] === true) {
                                return curContext.format[name] != null
                            }
                            if (binding.format![name] === false) {
                                return curContext.format[name] == null
                            }
                            return isEqual(
                                binding.format![name],
                                curContext.format[name]
                            )
                        })
                    ) {
                        return false
                    }
                }
                if (
                    binding.prefix != null &&
                    !binding.prefix.test(curContext.prefix)
                ) {
                    return false
                }
                if (
                    binding.suffix != null &&
                    !binding.suffix.test(curContext.suffix)
                ) {
                    return false
                }
                return binding.handler.call(this, range, curContext) !== true
            })
            if (prevented) {
                evt.preventDefault()
            }
        })
    }

    handleEnter(range: Range, context: Context) {
        if (range.length! > 0) {
            this.quill.scroll.deleteAt(range.index, range.length!) // So we do not trigger text-change
        }
        const lineFormats: Formats = Object.keys(context.format).reduce(
            function(formats: Formats, format: string) {
                if (
                    Parchment.query(format, Parchment.Scope.BLOCK) &&
                    !Array.isArray(context.format[format])
                ) {
                    formats[format] = context.format[format]
                }
                return formats
            },
            {}
        )

        const [line, offset] = this.quill.getLine(range.index)
        const delta = new Delta()
            .retain(range.index)
            .insert('\n', lineFormats)
            .retain(line.length() - offset - 1)
            .retain(1, { id: cuid() })

        this.quill.updateContents(delta, QuillSources.USER)

        // Earlier scroll.deleteAt might have messed up our selection,
        // so insertText's built in selection preservation is not reliable
        this.quill.setSelection(range.index + 1, QuillSources.SILENT)
        this.quill.focus()

        Object.keys(context.format).forEach((name) => {
            if (lineFormats[name] != null) {
                return
            }
            if (Array.isArray(context.format[name])) {
                return
            }
            if (name === 'link') {
                return
            }

            this.quill.format(name, context.format[name], QuillSources.USER)
        })
    }

    handleBeginningEnter(range: Range) {
        const delta = new Delta()
            .retain(range.index)
            .insert('\n', { id: cuid() })
        this.quill.updateContents(delta, QuillSources.USER)
        this.quill.setSelection(range.index + 1, QuillSources.SILENT)
        this.quill.scrollIntoView()
    }

    handleListEmptyEnter(range: Range, context: Context) {
        this.quill.format('list', false, QuillSources.USER)
        if (context.format.indent) {
            this.quill.format('indent', false, QuillSources.USER)
        }
    }

    getMatch(
        selection: Selection,
        offset: number,
        text: string,
        pattern: RegExp,
        calcLength?: number // optionally, the calculated by Quill line length
    ) {
        const lineStart = selection.index - offset
        const match = pattern.exec(text)
        if (match === null) {
            return {
                matches: [],
                startIndex: 0,
                success: false
            }
        }

        // In the case of at mention blots its possible that the length of the
        // line differs from the match length.  In those cases we need the shorter
        // length because that's what we'll actually be transforming
        let position = match.index
        if (calcLength && text.length !== calcLength) {
            const calcOffset = text.length - calcLength
            position = position - calcOffset
        }

        return {
            matches: [...match],
            startIndex: lineStart + position,
            success: true
        }
    }

    trackFormatInline(format: string) {
        const analytics = new StyleChangeAnalytics().viaMarkdown()
        switch (format) {
            case 'bold':
                analytics.appliedBold()
                break
            case 'italic':
                analytics.appliedItalics()
                break
            case 'strike':
                analytics.appliedStrikethru()
                break
            case 'underline':
                analytics.appliedUnderline()
                break
            case 'code':
                analytics.appliedInlineCode()
                break
            default:
        }
        analytics.track()
    }

    getChildrenLength(line: any) {
        let calcLength = 0
        if (line.children && line.children.length > 0) {
            line.children.forEach((child: any) => {
                calcLength += child.length()
            })
        }
        return calcLength
    }

    formatInline(
        range: Range,
        context: Context,
        pattern: RegExp,
        formats: string[]
    ) {
        const reverse = (str: string) =>
            str
                .split('')
                .reverse()
                .join('')

        const [line, offset] = this.quill.getLeaf(range.index)
        const text: string = reverse(
            line.domNode.textContent.substring(0, offset)
        )

        const match = this.getMatch(
            this.quill.getSelection(),
            offset,
            text,
            new RegExp(/(?:^)/.source + pattern.source),
            this.getChildrenLength(line)
        )

        // If no match, skip
        if (!match.success) {
            return true
        }
        // Create an object to set and unset the format of the text
        const formatObject = formats.reduce(
            (
                formatCollector: {
                    set: Object
                    unset: Object
                },
                type: string
            ) => {
                formatCollector.set[type] = true
                formatCollector.unset[type] = false
                return formatCollector
            },
            {
                set: {},
                unset: {}
            }
        )
        const startIndex = range.index - match.matches[0].length

        // Delete the unformatted text with markdown wrappers
        this.quill.deleteText(
            startIndex,
            match.matches[0].length,
            QuillSources.USER
        )
        // Insert the text and format the text without markdown wrappers
        this.quill.insertText(
            startIndex,
            reverse(match.matches[1]),
            formatObject.set,
            QuillSources.USER
        )
        // Insert an unformatted space after the formatted text
        this.quill.insertText(
            startIndex + match.matches[1].length,
            ' ',
            formatObject.unset,
            QuillSources.USER
        )
        // Set user selection after the space
        this.quill.setSelection(
            startIndex + match.matches[1].length + 1,
            QuillSources.SILENT
        )

        // analytics
        formats.forEach(this.trackFormatInline)

        return false
    }

    makeHeadline(range: Range, context: Context) {
        if (context.offset === context.prefix.length) {
            this.quill.deleteText(
                range.index - context.prefix.length,
                context.prefix.length,
                QuillSources.USER
            )
            this.quill.format(
                'header',
                context.prefix.length,
                QuillSources.USER
            )

            new StyleChangeAnalytics()
                .viaMarkdown()
                .appliedHeader(context.prefix.length)
                .track()
        }
    }

    makeList(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        const text = line.domNode.textContent.trim()
        if (
            text !== '*' &&
            text !== '[]' &&
            text !== '[ ]' &&
            text !== '[x]' &&
            text !== '-' &&
            text !== '1.'
        ) {
            return true
        }
        if (isFirstLine(store.getState())) {
            // TODO: make this more generic if we ever add
            // something besides a space to activate the list
            this.addSpace()
            return
        }

        const length = context.prefix.length
        let value
        const analytics = new StyleChangeAnalytics().viaMarkdown()
        switch (context.prefix.trim()) {
            case '*':
                value = 'unordered'
                analytics.appliedBullets()
                break
            case '[]':
            case '[ ]':
                value = 'unchecked'
                analytics.appliedToDoList()
                break
            case '[x]':
                value = 'checked'
                analytics.appliedToDoList()
                break
            case '-':
                value = 'bullet'
                analytics.appliedBullets()
                break
            default:
                value = 'ordered'
                analytics.appliedOrderedList()
        }
        this.quill.scroll.deleteAt(range.index - length, length)
        this.quill.formatLine(
            range.index - length,
            1,
            'list',
            value,
            QuillSources.USER
        )
        this.quill.setSelection(range.index - length, QuillSources.SILENT)

        analytics.track()

        return false
    }

    makeLink(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)
        const text = line.domNode.textContent
        const match = this.getMatch(
            this.quill.getSelection(),
            offset,
            text,
            REG_EX_PATTERNS.link,
            this.getChildrenLength(line)
        )
        // If no match, skip
        if (!match.success) {
            return true
        }
        this.quill.deleteText(
            match.startIndex,
            match.matches[0].length,
            QuillSources.USER
        )
        this.quill.insertText(
            match.startIndex,
            match.matches[1],
            'link',
            match.matches[2],
            QuillSources.USER
        )
        this.quill.insertText(
            match.startIndex + match.matches[1].length,
            ' ',
            { link: false },
            QuillSources.USER
        )
        this.quill.setSelection(
            match.startIndex + match.matches[1].length + 1,
            QuillSources.SILENT
        )

        new StyleChangeAnalytics()
            .viaMarkdown()
            .appliedURL()
            .track()

        return false
    }

    makeCodeBlock(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        line.format('code-block', true, QuillSources.USER)
        this.quill.deleteText(range.index - 3, 3, QuillSources.USER)

        new StyleChangeAnalytics()
            .viaMarkdown()
            .appliedCodeBlock()
            .track()
    }

    deleteCodeBlock(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        line.format('code-block', false, QuillSources.USER)
    }

    deleteBlockquote(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        line.format('blockquote', false, QuillSources.USER)
    }

    // Allow the user to escape from the end of inline code by pressing space
    handleSpaceAtCodeEnd(range: Range, context: Context) {
        this.quill.insertText(
            range.index,
            ' ',
            { code: false },
            QuillSources.USER
        )
        this.quill.setSelection(range.index + 1, QuillSources.SILENT)
    }

    undoCodeFormat(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        // Init code index to store length of line as we iterate over it
        let codeIndex = 0
        // Find the string of text that ends at the current offset
        const codeBlockText = line.children.reduce(
            (text: string, lineChild: { domNode: { textContent: string } }) => {
                // If the current child element of the line ends at the offset, return it
                if (
                    context.offset ===
                    codeIndex + lineChild.domNode.textContent.length
                ) {
                    text = lineChild.domNode.textContent
                }
                // Update the codeIndex with the new length
                codeIndex = codeIndex + lineChild.domNode.textContent.length
                return text
            },
            null
        )
        // If there is an inline code block that ends at the current offset...
        if (codeBlockText) {
            // delete it...
            this.quill.deleteText(
                range.index - codeBlockText.length,
                codeBlockText.length,
                QuillSources.USER
            )
            // and insert an unformatted text block with ` prepended...
            this.quill.insertText(
                range.index - codeBlockText.length,
                '`' + codeBlockText,
                { ...context.format, code: false },
                QuillSources.USER
            )
            this.quill.setSelection(range.index + 1, QuillSources.SILENT)
            return false
        }

        // Otherwise, do nothing
        return true
    }

    makeBlockquote(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        line.format('blockquote', true, QuillSources.USER)
        this.quill.deleteText(range.index - 1, 1, QuillSources.USER)

        new StyleChangeAnalytics()
            .viaMarkdown()
            .appliedBlockQuote()
            .track()
    }

    exitBlockquote(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        line.format('blockquote', false, QuillSources.USER)
    }
    checkMembersOnEnter(range: Range, context: Context) {
        const state = store.getState()
        const mentions = state.mentions
        if (
            mentions.showMentionsList &&
            typeof mentions.selectedMemberIndex === 'number'
        ) {
            const mentionType = 'mention'
            const mentionValue: Member | string = mentions.members![
                mentions.selectedMemberIndex
            ]

            const analytics = new MentionAnalytics()
            if (state.comments.selectedCommentMarkId) {
                analytics.fromCommenting()
            } else {
                analytics.fromDocument()
            }
            analytics.track()

            insertMention(
                this.quill,
                mentions.initialIndex!,
                mentions.currentIndex!,
                mentionType,
                mentionValue
            )
            return false
        }
        store.dispatch(clearMentionList())
        return true
    }
    checkEmojiOnEnter(range: Range, context: Context) {
        const state = store.getState()
        const emoji = state.emojiPicker
        if (emoji.showEmojiPicker && emoji.emojiText.length) {
            PubSub.publish(EMBED_INSERT, 'emoji-embed')
            return false
        }
        store.dispatch(clearEmojiPicker())
        return true
    }
    exitEmojiOnSpace(range: Range, context: Context) {
        const state = store.getState()
        const emoji = state.emojiPicker
        if (emoji.showEmojiPicker) {
            store.dispatch(clearEmojiPicker())
        }
        return true
    }
    makeDividerEnter(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        // If the line has other text than a dash, do not insert a divider
        if (line.domNode.textContent !== '-') {
            return true
        }

        const index = range.index - 1

        this.quill.deleteText(index, 1, QuillSources.USER)
        this.quill.updateContents(
            new Delta()
                .retain(index)
                .insert('\n', { divider: true, id: cuid() }),
            QuillSources.USER
        )
        this.quill.setSelection(range.index, QuillSources.SILENT)

        new StyleChangeAnalytics()
            .viaMarkdown()
            .appliedDivider()
            .track()

        return false
    }

    makeDivider(range: Range, context: Context) {
        const [line] = this.quill.getLine(range.index)
        // If the line has other text than --, __, or ** do not insert a divider
        if (
            line.domNode.textContent !== '--' &&
            line.domNode.textContent !== '__' &&
            line.domNode.textContent !== '**'
        ) {
            return true
        }
        const index = range.index - 2
        this.quill.deleteText(index, 2, QuillSources.USER)
        this.quill.updateContents(
            new Delta()
                .retain(index)
                .insert('\n', { divider: true, id: cuid() }),
            QuillSources.USER
        )
        this.quill.setSelection(range.index - 1, QuillSources.SILENT)

        new StyleChangeAnalytics()
            .viaMarkdown()
            .appliedDivider()
            .track()

        return false
    }

    canSelectEmbed(line: Line, index: number, edge: string) {
        if (
            line.children != null &&
            line.children.head != null &&
            line.children.head.domNode instanceof Element
        ) {
            const containerBounds = this.quill.container.getBoundingClientRect()
            const rect = line.children.head.domNode.getBoundingClientRect()
            const bounds = getBounds(rect, containerBounds)
            const rangeBounds = this.quill.getBounds(index)
            return bounds[edge] === rangeBounds[edge]
        }
        return true
    }

    getPrev(line: Line): LineElement | Embed | null {
        const prev = line.prev
        if (prev == null) {
            return line.parent.prev
        }
        return prev
    }

    getNext(line: Line): LineElement | Embed | null {
        const next = line.next
        if (next == null) {
            return line.parent.next
        }
        return next
    }

    handleUpKey(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)
        const prev = this.getPrev(line) as Embed | null

        if (prev?.isEmbed) {
            const selectEmbed = this.canSelectEmbed(line, range.index, 'top')

            if (selectEmbed) {
                this.quill.setSelection(null, QuillSources.SILENT)
                prev.select(range.index - offset - 1)
                return false
            }
        }
        return true
    }
    handleMentionsUp(range: Range, context: Context) {
        const state = store.getState()
        const mentions = state.mentions
        if (mentions.showMentionsList) {
            let newIndex: number | undefined =
                typeof state.mentions.selectedMemberIndex === 'number'
                    ? state.mentions.selectedMemberIndex - 1
                    : -1
            newIndex = newIndex < 0 ? undefined : newIndex
            store.dispatch(updateSelectedMentionMember(newIndex))
            return false
        }
        return true
    }
    handleDownKey(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)
        const next = this.getNext(line) as Embed | null

        if (next?.isEmbed) {
            const selectEmbed = this.canSelectEmbed(line, range.index, 'bottom')

            if (selectEmbed) {
                this.quill.setSelection(null, QuillSources.SILENT)
                next.select(range.index - offset + line.length())
                return false
            }
        }
        return true
    }
    handleMentionsDown(range: Range, context: Context) {
        const state = store.getState()
        const mentions = state.mentions
        if (mentions.showMentionsList) {
            let newIndex: number =
                typeof state.mentions.selectedMemberIndex === 'number'
                    ? state.mentions.selectedMemberIndex + 1
                    : 0
            newIndex = newIndex > 2 ? 2 : newIndex
            store.dispatch(updateSelectedMentionMember(newIndex))
            return false
        }
        return true
    }
    handleLeftKey(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)
        const prev = this.getPrev(line) as Embed | null

        if (offset === 0 && prev?.isEmbed) {
            this.quill.setSelection(null, QuillSources.SILENT)
            prev.select(range.index - offset - 1)
            return false
        }
        return true
    }

    handleRightKey(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)
        const lineLength = line.length()
        const next = this.getNext(line) as Embed | null

        if (offset === lineLength - 1 && next?.isEmbed) {
            this.quill.setSelection(null, QuillSources.SILENT)
            next.select(range.index - offset + lineLength)
            return false
        }
        return true
    }

    handleBackspace(range: Range, context: Context) {
        const [line, offset] = this.quill.getLine(range.index)
        const prev = this.getPrev(line) as Embed | null
        if (context.prefix === '@') {
            store.dispatch(clearMentionList())
        }
        // We don't want to backspace if its the last line since it would just get
        // added again.  Instead we treat it like an arrow left.
        if (range.index === this.quill.getLength() - 1) {
            const lastLineContent = line.domNode.textContent.replace(/\s/g, '')
            if (isBlankLine(line.length(), lastLineContent)) {
                this.quill.setSelection(range.index - 1, QuillSources.USER)
                return true
            }
        }
        if (offset === 0 && prev?.isEmbed) {
            this.quill.setSelection(null, QuillSources.SILENT)
            if (context.empty) {
                this.quill.deleteText(range.index, 1, QuillSources.USER)
            }
            prev.select(range.index - offset - 1)
            return false
        }
        return true
    }

    handleAtKey(range: Range, context: Context) {
        const lastCharacter = context.prefix.substr(-1)
        if (lastCharacter === ' ' || lastCharacter.length === 0) {
            store.dispatch(
                setMentionList(
                    true,
                    this.mentionsType,
                    this.editorId,
                    range.index
                )
            )
        }
        return true
    }

    addSpace() {
        const cursorIndex = this.quill.getSelection().index
        this.quill.insertText(cursorIndex, ' ', 'user')
        this.quill.setSelection(cursorIndex + 1, 0)
    }

    escapeMentions(range: Range, context: Context) {
        store.dispatch(clearEmojiPicker())
        store.dispatch(clearMentionList())
        return true
    }
    escapeEmoji(range: Range, context: Context) {
        store.dispatch(clearEmojiPicker())
        return true
    }
    indentList(range: Range, context: Context) {
        this.quill.format('indent', '+1', QuillSources.USER)
    }
    outdentList(range: Range, context: Context) {
        this.quill.format('indent', '-1', QuillSources.USER)
    }
    insertEmojiShortname(range: Range, context: Context) {
        const match = context.prefix.match(REG_EX_PATTERNS.emojiShortname)
        if (match && match[0]) {
            let shortName = match[0]
            shortName = shortName.substr(1)
            const emojiData: EmojiData | undefined = find(
                data,
                (emojiDataPoint: EmojiData) => {
                    return emojiDataPoint.short_name === shortName
                }
            )
            if (emojiData) {
                this.quill.deleteText(
                    range.index - match[0].length,
                    match[0].length,
                    QuillSources.USER
                )
                this.quill.insertEmbed(
                    range.index - match[0].length,
                    'emoji-embed',
                    Emoji.getEmoji(emojiData.unified, 'unified'),
                    QuillSources.USER
                )
                this.quill.setSelection(
                    range.index - match[0].length + 1,
                    QuillSources.USER
                )
                return false
            }
        }
        store.dispatch(clearEmojiPicker())
        return true
    }
    openBlankEmojiPicker(range: Range, context: Context) {
        const emojiBounds = this.quill.getBounds(range.index, 0)
        const id = this.editorId
        store.dispatch(
            setEmojiPicker(
                true,
                range.index,
                emojiBounds.bottom,
                emojiBounds.left,
                '',
                id
            )
        )
        return true
    }
}

export default ModifiedKeyboard
