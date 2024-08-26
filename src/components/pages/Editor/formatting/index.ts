import { forEach } from 'lodash'
import StyleChangeAnalytics from '../../../../analytics/AnalyticsBuilders/StyleChangeAnalytics'
import QuillSources from '../../../quill/modules/QuillSources'
import {
    SelectionState,
    blockTypeStyles,
    initialTypeStyleState
} from '../../../../data/reducers/selection'
import Quill from '../../../quill/entries/Editor'
import { getEditor } from '../../../../QuillRegistry'

type FormatValue = boolean | string | number

export function formatBlockquote(
    quill: Quill,
    selection: SelectionState,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    const [line] = quill.getLine(selection.index!)
    line.format('blockquote', value, QuillSources.USER)
    quill.setSelection(
        selection.index!,
        selection.selectionLength!,
        QuillSources.USER
    )
    styleAnalytics.appliedBlockQuote()
}

export function formatCodeBlock(
    quill: Quill,
    selection: SelectionState,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    const [line] = quill.getLine(selection.index!)
    line.format('code-block', value, QuillSources.USER)

    // This fixes an issue where quill is still updating and leads
    // to it trying to call position on a leaf that doesn't exist
    quill.update()

    quill.setSelection(
        selection.index!,
        selection.selectionLength!,
        QuillSources.USER
    )
    styleAnalytics.appliedCodeBlock()
}

export function formatBold(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedBold()
    quill.format('bold', value, QuillSources.USER)
}

export function formatHeader(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedHeader(Number(value))
    quill.format('header', value, QuillSources.USER)
}

export function formatItalic(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedItalics()
    quill.format('italic', value, QuillSources.USER)
}

export function formatLink(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedURL()
    quill.format('link', value, QuillSources.USER)
}

export function formatList(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedList(`${value}`)
    quill.format('list', value, QuillSources.USER)
}

export function formatStrike(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedStrikethru()
    quill.format('strike', value, QuillSources.USER)
}

export function formatUnderline(
    quill: Quill,
    styleAnalytics: StyleChangeAnalytics,
    value: FormatValue
) {
    styleAnalytics.appliedUnderline()
    quill.format('underline', value, QuillSources.USER)
}

export function insertLink(selection: SelectionState) {
    if (selection.selectionLength === null || selection.selectionLength === 0) {
        return
    }

    const quill = getEditor(selection.editorId!)

    if (!quill) {
        return
    }

    let text = selection.text!
    if (/^\S+@\S+\.\S+$/.test(text) && text.indexOf('mailto:') !== 0) {
        text = 'mailto:' + text
    }

    const tooltip = quill.theme.tooltip
    tooltip.edit('link', text)
    new StyleChangeAnalytics()
        .viaEditor()
        .appliedURL()
        .track()
}

export function format(
    quill: Quill,
    selection: SelectionState,
    name: string,
    value: boolean | string | number
) {
    const styleAnalytics = new StyleChangeAnalytics().viaEditor()

    switch (name) {
        case 'blockquote':
            formatBlockquote(quill, selection, styleAnalytics, value)
            break
        case 'codeBlock':
            formatCodeBlock(quill, selection, styleAnalytics, value)
            break
        case 'bold':
            formatBold(quill, styleAnalytics, value)
            break
        case 'header':
            formatHeader(quill, styleAnalytics, value)
            break
        case 'italic':
            formatItalic(quill, styleAnalytics, value)
            break
        case 'link':
            formatLink(quill, styleAnalytics, value)
            break
        case 'list':
            formatList(quill, styleAnalytics, value)
            break
        case 'strike':
            formatStrike(quill, styleAnalytics, value)
            break
        case 'underline':
            formatUnderline(quill, styleAnalytics, value)
            break
        default:
            console.warn('unknown format', name, value)
            break
    }

    styleAnalytics.track()
}

export function formatSelection(
    selection: SelectionState,
    name: string,
    newValue: FormatValue
) {
    const quill = getEditor(selection.editorId!)

    if (!quill) {
        return
    }

    let formats
    if (blockTypeStyles.indexOf(name) > -1) {
        formats = {
            ...initialTypeStyleState,
            [name]: newValue
        }
    } else {
        formats = { [name]: newValue }
    }

    forEach(formats, (value: FormatValue, key: string) => {
        if (value !== selection[key]) {
            format(quill, selection, key, value)
        }
    })
}
