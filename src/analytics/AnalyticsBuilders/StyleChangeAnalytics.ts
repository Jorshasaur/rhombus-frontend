import AnalyticsBuilder from './AnalyticsBuilder'

const TEXT_STYLE_CHANGE = {
    event: 'App.Rhombus.TextStyle.Adjusted',
    properties: {
        method: {
            name: 'method',
            VIA_KEYBOARD: 'StyleChange.viaKeyboard',
            VIA_EDITOR: 'StyleChange.viaEditor',
            VIA_MARKDOWN: 'StyleChange.viaMarkdown'
        },
        style: {
            name: 'style',
            APPLIED_BODY_TEXT: 'Applied.BodyText',
            APPLIED_H1: 'Applied.H1',
            APPLIED_H2: 'Applied.H2',
            APPLIED_H3: 'Applied.H3',
            APPLIED_ORDERED_LIST: 'Applied.OrderedList',
            APPLIED_BULLETS: 'Applied.Bullets',
            APPLIED_TODO_LIST: 'Applied.ToDoList',
            APPLIED_DIVIDER: 'Applied.Divider',
            APPLIED_BLOCK_QUOTE: 'Applied.BlockQuote',
            APPLIED_CODE_BLOCK: 'Applied.CodeBlock',
            APPLIED_INLINE_CODE: 'Applied.InlineCode',
            APPLIED_BOLD: 'Applied.Bold',
            APPLIED_ITALICS: 'Applied.Italics',
            APPLIED_UNDERLINE: 'Applied.Underline',
            APPLIED_STRIKETHRU: 'Applied.Strikethru',
            APPLIED_URL: 'Applied.URL'
        }
    }
}

export default class StyleChangeAnalytics extends AnalyticsBuilder {
    protected eventName: string = TEXT_STYLE_CHANGE.event

    constructor() {
        super()
    }

    // methods
    public viaKeyboard = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.method.name,
            TEXT_STYLE_CHANGE.properties.method.VIA_KEYBOARD
        )

    public viaEditor = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.method.name,
            TEXT_STYLE_CHANGE.properties.method.VIA_EDITOR
        )

    public viaMarkdown = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.method.name,
            TEXT_STYLE_CHANGE.properties.method.VIA_MARKDOWN
        )

    // styles
    public appliedBodyText = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_BODY_TEXT
        )

    public appliedHeader = (num?: number | null) => {
        switch (num) {
            case null:
                return this.appliedBodyText()
            case 2:
                return this.appliedH2()
            case 3:
                return this.appliedH3()
            default:
                return this.appliedH1()
        }
    }

    public appliedH1 = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_H1
        )

    public appliedH2 = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_H2
        )

    public appliedH3 = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_H3
        )

    public appliedList = (listType?: string) => {
        switch (listType) {
            case 'ordered':
                return this.appliedOrderedList()
            case 'unchecked':
            case 'todo':
                return this.appliedToDoList()
            default:
                return this.appliedBullets()
        }
    }

    public appliedOrderedList = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_ORDERED_LIST
        )

    public appliedBullets = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_BULLETS
        )

    public appliedToDoList = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_TODO_LIST
        )

    public appliedDivider = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_DIVIDER
        )

    public appliedBlockQuote = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_BLOCK_QUOTE
        )

    public appliedCodeBlock = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_CODE_BLOCK
        )

    public appliedInlineCode = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_INLINE_CODE
        )

    public appliedBold = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_BOLD
        )

    public appliedItalics = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_ITALICS
        )

    public appliedUnderline = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_UNDERLINE
        )

    public appliedStrikethru = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_STRIKETHRU
        )

    public appliedURL = () =>
        this.withProperty(
            TEXT_STYLE_CHANGE.properties.style.name,
            TEXT_STYLE_CHANGE.properties.style.APPLIED_URL
        )
}
