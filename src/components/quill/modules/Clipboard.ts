import { get, includes } from 'lodash'
import { DeltaStatic } from 'quill'
import Delta from 'quill-delta'
import Quill from 'quill/core'
import Clipboard from 'quill/modules/clipboard'
import URI from 'urijs'
import { v4 as uuid } from 'uuid'
import cuid from 'cuid'
import EmbedAddAnalytics from '../../../analytics/AnalyticsBuilders/EmbedAddAnalytics'
import store from '../../../data/store'
import tempAssets, { TempAssetType } from '../../../data/tempAssets'
import {
    FILE_TYPES,
    getEmbedType,
    URL_TYPES
} from '../../../helpers/EmbedHelper'
import { BlotSize } from '../../../interfaces/blotSize'
import { Permissions as PermissionsInterface } from '../../../interfaces/permissions'
import { SelectionType } from '../../../interfaces/selectionType'
import {
    BLOCK_EMBED_BLOT_NAME,
    PANE_EMBED_BLOT_NAME
} from '../../../constants/embeds'
import { PERMISSIONS_MODULE_NAME } from '../../../constants/quill-modules'
import { isAssetUrl } from '../../../lib/utils'
import { BlockEmbed } from '../blots/BlockEmbed'
import quillProvider from '../provider'
import { getIdsDelta } from './Id'
import QuillSources from './QuillSources'
import { matchEmbedUrl } from './matchEmbedUrl'
import { PaneEmbed } from '../blots/PaneEmbed'
import { Embed } from '../../../interfaces/Embed'
import QuillEmbeds from './QuillEmbeds'

type FormatString =
    | 'header'
    | 'bold'
    | 'code'
    | 'divider'
    | 'strike'
    | 'italic'
    | 'link'
    | 'codeBlock'
    | 'list'
    | 'underline'
    | 'blockquote'

type Matcher = [string | number, (node: Node, delta: Delta) => Delta]

interface ClipboardOptions {
    permissions?: PermissionsInterface
    formats?: FormatString[]
    matchers?: Matcher[]
    enabled?: boolean
    handleEmbeds?: boolean
    pane?: boolean
    editorId?: string
}

const Parchment = Quill.import('parchment')

const matchText = require('../../../../node_modules/quill/modules/clipboard')
    .matchText
export const urlRegEx = /^(?:(?:https?):\/\/|www|[A-Za-z0-9](?:[A-Za-z0-9\-]{0,61}[A-Za-z0-9])?\.)(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[-A-Z0-9+&@#\/%=~_|$?!:,.])*(?:\([-A-Z0-9+&@#\/%=~_|$?!:,.]*\)|[A-Z0-9+&@#\/%=~_|$])/gim

class ModifiedClipboard extends (Clipboard as {
    new (quill: Quill, options: ClipboardOptions): any
}) {
    private options: ClipboardOptions
    private editorId: string | null

    constructor(private quill: Quill, options: ClipboardOptions) {
        super(quill, options)
        this.enabled =
            options.enabled || options.enabled === undefined
                ? true
                : options.enabled
        if (options.permissions && options.permissions.canEdit) {
            this.canEdit = options.permissions.canEdit
        }
        if (this.enabled) {
            this.matchers[0] = [Node.TEXT_NODE, autoLinkifiedMatchText]
            this.matchers.push([Node.ELEMENT_NODE, this.matchBlockEmbed])
            this.matchers.push(['img', matchImage])
            this.addMatcher('[data-author-id]', setAuthorFormat)
            this.addMatcher('.mention', handleMention)
            this.addMatcher('.document-mention', handleDocumentMention)
        } else {
            this.matchers.push(['img', pasteImageUrl])
            this.addMatcher('b', this.convertNodeToText)
            this.addMatcher('br', this.convertNodeToText)
            this.addMatcher('li', this.convertNodeToText)
            this.addMatcher('ol', this.convertNodeToText)
            this.addMatcher('ul', this.convertNodeToText)
            this.addMatcher('pre', this.convertNodeToText)
            this.addMatcher('tr', this.convertNodeToText)
            this.addMatcher('i', this.convertNodeToText)
            this.addMatcher('style', this.convertNodeToText)
        }
        const brIndex = getBrIndex(this.matchers)
        if (brIndex != null) {
            this.matchers[brIndex] = ['br', handleBr]
        }

        this.editorId = options.editorId || null
        if (this.options.handleEmbeds) {
            if (!this.editorId) {
                throw new Error(
                    'editorId must be provided in Clipboard module option in order to handle embeds copy/paste'
                )
            }

            document.addEventListener('copy', this._handleEmbedCutCopy)
            document.addEventListener('cut', this._handleEmbedCutCopy)
            document.body.addEventListener(
                'paste',
                this._handleEmbedPaste,
                true
            )
        }

        // If formats are defined, convert the delta according to white-listed formats
        if (options.formats) {
            this.addMatcher(Node.ELEMENT_NODE, this.convertNodeToText)
        }
    }
    convertNodeToText = (node: Node, delta: DeltaStatic) => {
        if (this._isAllowedFormat(node.nodeName) && this.enabled) {
            return delta
        }
        const textContent = this._getTextContent(node)
        return new Delta().insert(textContent)
    }
    private _isAllowedFormat = (nodeName: string) => {
        switch (nodeName) {
            case 'H1':
            case 'H2':
            case 'H3':
                return includes(this.options.formats, 'header')
            case 'B':
                return includes(this.options.formats, 'bold')
            case 'CODE':
                return includes(this.options.formats, 'code')
            case 'HR':
                return includes(this.options.formats, 'divider')
            case 'S':
                return includes(this.options.formats, 'strike')
            case 'EM':
                return includes(this.options.formats, 'italic')
            case 'A':
                return includes(this.options.formats, 'link')
            case 'PRE':
                return includes(this.options.formats, 'codeBlock')
            case 'UL':
            case 'LI':
            case 'OL':
                return includes(this.options.formats, 'list')
            case 'U':
                return includes(this.options.formats, 'underline')
            case 'BLOCKQUOTE':
                return includes(this.options.formats, 'blockquote')
            default:
                return false
        }
    }
    private _getTextContent = (node: Node) => {
        switch (node.nodeName) {
            case 'H1':
            case 'H2':
            case 'H3':
            case 'PRE':
            case 'UL':
            case 'LI':
            case 'OL':
            case 'BLOCKQUOTE':
                return node.textContent + '\n'
            case 'B':
            case 'CODE':
            case 'S':
            case 'EM':
            case 'A':
            case 'U':
            default:
                return node.textContent
        }
    }
    detach() {
        if (this.options.handleEmbeds) {
            document.removeEventListener('copy', this._handleEmbedCutCopy)
            document.removeEventListener('cut', this._handleEmbedCutCopy)
            document.body.removeEventListener(
                'paste',
                this._handleEmbedPaste,
                true
            )
        }
    }

    onPaste(e: ClipboardEvent): void {
        // Prevent pasting without edit permissions, or if a document is archived
        const permissions = quillProvider
            .getQuill()
            .getModule(PERMISSIONS_MODULE_NAME)
        if (!permissions.canEdit || permissions.isArchived) {
            e.preventDefault()
            return
        }

        // Analytics for pasted url embeds
        const html = e.clipboardData?.getData('text/html')
        if (html) {
            const originalLinkRegex = new RegExp(/data-originallink="([^"]*?)"/)

            if (originalLinkRegex.test(html)) {
                const link = html.match(originalLinkRegex)![1]

                // For when the original link was undefined, like images
                if (link !== 'undefined') {
                    const service = matchEmbedUrl(link)

                    new EmbedAddAnalytics()
                        .isURL()
                        .urlType(service as URL_TYPES)
                        .track()
                }
            }
        }

        return super.onPaste(e)
    }

    _handleEmbedCutCopy = (e: ClipboardEvent) => {
        const { selection } = store.getState()
        if (
            selection.index != null &&
            selection.selectionType === SelectionType.Embed &&
            selection.editorId === this.editorId
        ) {
            const [leaf] = this.quill.getLeaf(selection.index) as [Embed | null]
            if (!leaf?.isEmbed) {
                return
            }
            e.clipboardData?.clearData()
            e.clipboardData?.setData('text/html', leaf.domNode.outerHTML)
            if (e.type === 'cut') {
                this.quill.deleteText(
                    selection.index,
                    selection.selectionLength || 1,
                    QuillSources.USER
                )
            }
            e.preventDefault()
        }
    }

    _handleEmbedPaste = (e: ClipboardEvent) => {
        const state = store.getState()
        if (
            state.selection.selectionType === SelectionType.Embed &&
            state.selection.editorId === this.editorId
        ) {
            const newIndex = state.selection.index! + 1
            const [leaf] = this.quill.getLeaf(newIndex) as [Embed | null]
            if (leaf?.isEmbed) {
                this.quill.insertText(
                    newIndex,
                    '\n',
                    { id: cuid() },
                    QuillSources.USER
                )
            }
            this.quill.setSelection(newIndex, QuillSources.SILENT)
        }
    }

    matchBlockEmbed = (node: Node, delta: DeltaStatic): DeltaStatic => {
        const match = Parchment.query(node)
        if (match == null) {
            return delta
        }
        if (match.blotName === BLOCK_EMBED_BLOT_NAME) {
            delta = pasteBlockEmbed(
                match,
                node as HTMLElement,
                delta,
                this.options
            )
        }
        if (match.blotName === PANE_EMBED_BLOT_NAME) {
            delta = pastePaneEmbed(match, node as HTMLElement, delta)
        }
        return delta
    }

    convert(html?: string) {
        // Get selected text
        const selectionText = this.quill.getText(
            this.quill.selection.savedRange.index,
            this.quill.selection.savedRange.length
        )
        // Trim whitespace from the clipboard text
        const text: string = this.container.innerText.trim()
        // Check if clipboard text is a link.
        // using a RegExp constructor here to override the `g` flag only in this instance
        // https://stackoverflow.com/questions/3891641/regex-test-only-works-every-other-time
        const isLink = new RegExp(urlRegEx, 'i').test(text)

        let service: ReturnType<typeof matchEmbedUrl> = false
        if (this.enabled && isLink) {
            service = matchEmbedUrl(text)
        }

        if (!selectionText && isLink && service) {
            new EmbedAddAnalytics()
                .isURL()
                .urlType(service as URL_TYPES)
                .track()

            const link = addProtocol(text)
            this.container.innerHTML = ''
            return new Delta().insert({
                [BLOCK_EMBED_BLOT_NAME]: {
                    version: 1,
                    originalLink: link,
                    service,
                    size: BlotSize.Medium,
                    type: 'iframe',
                    uuid: uuid(),
                    authorId: this.quill.getModule('authorship').options
                        .authorId,
                    embedData: {}, // Empty data object on insert, but this will get populated by the embed itself
                    createdAt: new Date()
                }
            })
        } else if (selectionText && isLink) {
            new EmbedAddAnalytics()
                .isURL()
                .isExternalURL()
                .track()

            const link = addProtocol(text)

            // Empty the clipboard
            this.container.innerHTML = ''
            // Insert the new link with the selection text
            return new Delta().insert(selectionText, { link })
        }
        let delta = super.convert(html)

        const idDelta = getIdsDelta(delta)
        if (idDelta) {
            delta = delta.compose(idDelta)
        }

        return delta
    }
}

function getBrIndex(matchers: Matcher[]) {
    const brItem = matchers.find((matcher) => matcher[0] === 'br')
    if (brItem) {
        return matchers.indexOf(brItem)
    }
    return
}

function handleBr(node: Node, delta: DeltaStatic) {
    return delta
}

export function handleMention(
    node: HTMLElement,
    delta: DeltaStatic
): DeltaStatic {
    // Check to make sure pasted mention contains required data
    if (
        node.dataset.userId &&
        node.dataset.name &&
        node.dataset.email &&
        node.dataset.rhombus
    ) {
        return delta
    }
    // Otherwise insert text content
    return new Delta().insert(node.textContent)
}

export function handleDocumentMention(
    element: HTMLElement,
    delta: DeltaStatic
): DeltaStatic {
    if (element.dataset.rhombus) {
        return delta
    }
    return new Delta().insert(element.textContent)
}

function matchImage(node: HTMLImageElement): DeltaStatic {
    const embedId = uuid()
    const imageUrl = node.src
    const embedData: any = {}

    if (!isAssetUrl(imageUrl)) {
        embedData.url = imageUrl
    }

    const embedOptions: any = {
        version: 1,
        service: 'image',
        uuid: embedId,
        authorId: quillProvider.getQuill().getModule('authorship').options
            .authorId,
        embedData,
        createdAt: new Date()
    }

    tempAssets.addAsset(embedId, imageUrl, TempAssetType.COPY)

    return new Delta().insert({ [BLOCK_EMBED_BLOT_NAME]: embedOptions })
}
export function pasteImageUrl(node: HTMLImageElement): DeltaStatic {
    const imageUrl = node.src
    if (imageUrl) {
        return new Delta().insert(imageUrl)
    } else {
        return new Delta()
    }
}

export function pasteBlockEmbed(
    match: any,
    html: HTMLElement,
    delta: DeltaStatic,
    options: ClipboardOptions
): DeltaStatic {
    const domNode = BlockEmbed.cloneDOMNode(html)
    const embed = {}
    const value = match.value(domNode)
    if (value != null) {
        if (options.pane && value.service === QuillEmbeds.IMAGE) {
            value.size = BlotSize.Medium
        }

        const img = get(html, 'firstChild.firstChild.firstChild', null)
        const hasRhombusTag = domNode.getAttribute('data-rhombus') || false
        if (!hasRhombusTag) {
            const originalLink = value.originalLink || get(img, 'src')
            if (originalLink) {
                return new Delta().insert(originalLink)
            }
            return new Delta()
        }

        // Analytics
        const state = store.getState()
        const asset = state.assets[value.embedData.id]
        if (asset) {
            const embedType = getEmbedType(
                asset.contentType,
                asset.fileName
            ) as FILE_TYPES
            new EmbedAddAnalytics()
                .viaPaste()
                .isFile()
                .fileType(embedType)
                .track()
        }

        if (img) {
            tempAssets.addAsset(value.uuid, img.src, TempAssetType.COPY)
        }
        embed[match.blotName] = value
        delta = new Delta().insert(embed, match.formats(domNode))
    }

    return delta
}

export function pastePaneEmbed(
    match: any,
    html: HTMLElement,
    delta: DeltaStatic
): DeltaStatic {
    const domNode = PaneEmbed.cloneDOMNode(html)
    const value = match.value(domNode)
    if (value != null) {
        const hasRhombusTag = domNode.getAttribute('data-rhombus') || false
        const showPanes = store.getState().featureFlags.panes
        if (!hasRhombusTag || !showPanes) {
            return new Delta()
        }
        PaneEmbed.clonePane(value)
        return new Delta()
    }
    return delta
}

function setAuthorFormat(node: Node, delta: DeltaStatic): DeltaStatic {
    const authorElement = node as HTMLElement
    return delta.compose(
        new Delta().retain(delta.length(), {
            author: authorElement.dataset.authorId,
            keepAuthor: true
        })
    )
}
function autoLinkifiedMatchText(node: Node, delta: DeltaStatic): DeltaStatic {
    const textMatchedDelta = matchText(node, delta) as DeltaStatic
    // No delta or ops means just return a blank delta
    if (
        !textMatchedDelta ||
        !textMatchedDelta.ops ||
        textMatchedDelta.ops.length === 0
    ) {
        return new Delta()
    }
    // If we run into a delta with more than one op  or doesn't have an insert (shouldnt be possible), then just don't auto linkify
    if (textMatchedDelta.ops.length > 1 || !textMatchedDelta.ops[0].insert) {
        return textMatchedDelta
    }

    const text = textMatchedDelta.ops[0].insert as string
    // Do in-place url matching, and add them as linkified attributes
    const matches = text.match(urlRegEx)

    if (!matches) {
        return textMatchedDelta
    }

    const finalDelta = new Delta()
    const str = text
    const re = urlRegEx
    const result: string[] = []
    let match
    let lastIndex = 0

    while ((match = re.exec(str))) {
        result.push(
            str.slice(lastIndex, re.lastIndex - match[0].length),
            match[0]
        )
        lastIndex = re.lastIndex
    }
    result.push(str.slice(lastIndex))
    result.forEach((textPiece: string) => {
        // Is this a URL insert as a link
        if (textPiece.match(urlRegEx)) {
            const link = addProtocol(textPiece)
            finalDelta.insert(textPiece, { link })
        } else {
            // otherwise just insert as text
            finalDelta.insert(textPiece)
        }
    })
    return finalDelta
}

export function addProtocol(text: string): string {
    const uri = URI(text)
    // If the uri doesn't have a protocol, lets add one
    // Since we always serve over https, lets be secure yo
    if (!uri.protocol()) {
        uri.protocol('https')
    }
    return uri.toString()
}

export default ModifiedClipboard
