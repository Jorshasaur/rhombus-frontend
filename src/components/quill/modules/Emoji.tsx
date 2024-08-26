import Quill from 'quill/core'
import { DeltaStatic, Sources, Embed as EmbedType } from 'quill'
import Delta from 'quill-delta'
import data, { EmojiData } from 'emoji-datasource'
import jsesc from 'jsesc'
import { find } from 'lodash'
import bugsnag from '../../../bugsnag'
import QuillSources from './QuillSources'
import QuillEvents from './QuillEvents'
import { EMOJI_REGEX, FALLBACK_EMOJI_DATA } from '../../../constants/emoji'
import styles from '../../../assets/css/common/emoji.module.css'

const Embed: typeof EmbedType = Quill.import('blots/embed')

// If an emoji with a variation selector (-FE0F) comes in as only two digits,
// left pad with 2 zeroes to 4 digits
export const normalizeVariationSelectorEmoji = (unified: string) =>
    /^[0-9A-F]{2}\-FE0F/g.test(unified) ? `00${unified}` : unified

interface EmojiEmbedValue {
    shortName: string
    skin: string
    name: string
    baseString: string
    unified: string
    skinCode: string
    nonQualified: string
}

export class EmojiEmbed extends Embed {
    public static blotName = 'emoji-embed'
    public static tagName = 'SPAN'
    public static className = styles.emojiEmbed
    domNode: HTMLElement

    static create(value: EmojiEmbedValue) {
        const node = super.create(value)
        const unified = normalizeVariationSelectorEmoji(value.unified)
        node.setAttribute('data-shortname', value.shortName)
        node.setAttribute('data-skin', value.skin)
        node.setAttribute('data-name', value.name)
        node.setAttribute('data-basestring', value.baseString)
        node.setAttribute('data-unified', unified)
        node.setAttribute('data-skincode', value.skinCode)
        node.setAttribute('data-nonqualified', value.nonQualified)
        const emojiImage = document.createElement('span')
        emojiImage.classList.add(`emoji-image`)
        emojiImage.classList.add(`emoji-image-${unified}`)
        emojiImage.textContent = `:${value.shortName}:`
        node.appendChild(emojiImage)
        return node
    }

    static value(domNode: HTMLElement): EmojiEmbedValue {
        return {
            shortName: domNode.dataset.shortname!,
            skin: domNode.dataset.skin!,
            name: domNode.dataset.name!,
            baseString: domNode.dataset.basestring!,
            unified: domNode.dataset.unified!,
            skinCode: domNode.dataset.skincode!,
            nonQualified: domNode.dataset.nonqualified!
        }
    }
}

export class Emoji {
    static _getShortCodeWithSkinTone(unified: string): EmojiEmbedValue {
        let skin = '1'
        let baseString = normalizeVariationSelectorEmoji(unified)
        let skinCode = ''
        // If skin tone data is present in unified string, set it
        if (unified.indexOf('-1F3FB') > -1) {
            baseString = unified.replace('-1F3FB', '')
            skin = '2'
            skinCode = '1F3FB'
        } else if (unified.indexOf('-1F3FC') > -1) {
            baseString = unified.replace('-1F3FC', '')
            skin = '3'
            skinCode = '1F3FC'
        } else if (unified.indexOf('-1F3FD') > -1) {
            baseString = unified.replace('-1F3FD', '')
            skin = '4'
            skinCode = '1F3FD'
        } else if (unified.indexOf('-1F3FE') > -1) {
            baseString = unified.replace('-1F3FE', '')
            skin = '5'
            skinCode = '1F3FE'
        } else if (unified.indexOf('-1F3FF') > -1) {
            baseString = unified.replace('-1F3FF', '')
            skin = '6'
            skinCode = '1F3FF'
        }
        // Find emoji data by unified string, or by non-qualified string, in that order
        let emojiData: EmojiData | undefined = find(
            data,
            (emojiDataPoint: EmojiData) => {
                return (
                    emojiDataPoint.unified === baseString ||
                    emojiDataPoint.non_qualified === baseString
                )
            }
        )
        // If no emoji is found, log an error and return the default fallback emoji, currently a question mark
        if (!emojiData) {
            bugsnag.notify(
                {
                    name: 'No Emoji Found',
                    message: `No emoji match found for ${baseString}`
                },
                {
                    metadata: {
                        baseString,
                        unified,
                        skin,
                        skinCode
                    }
                }
            )
            emojiData = FALLBACK_EMOJI_DATA
        }
        return {
            name: emojiData.name || emojiData.short_name,
            nonQualified: emojiData.non_qualified || '',
            shortName: emojiData.short_name,
            skin,
            baseString,
            unified,
            skinCode
        }
    }

    public static getEmoji(
        emojiString: string,
        type: 'native' | 'unified'
    ): EmojiEmbedValue {
        let unifiedString = emojiString
        // Convert native emoji to a unified string to search through emoji-data
        if (type === 'native') {
            unifiedString = jsesc(emojiString, {
                es6: true,
                escapeEverything: true
            })
            unifiedString = unifiedString.replace(/{|}/g, '')
            unifiedString = unifiedString.substr(2)
            unifiedString = unifiedString.replace(/\\u/g, '-')
        }

        return this._getShortCodeWithSkinTone(unifiedString)
    }
    constructor(private quill: Quill, enabled: boolean) {
        if (enabled) {
            this._setupClipboardMatcher()
            this._setupEditorChangeEvent()
        }
    }

    _setupClipboardMatcher() {
        this.quill.clipboard.addMatcher(
            Node.TEXT_NODE,
            (node, delta: DeltaStatic) => {
                return this._convertEmojiOnPaste(delta)
            }
        )
    }
    _setupEditorChangeEvent() {
        this.quill.on(
            QuillEvents.EDITOR_CHANGE,
            async (
                eventName: string,
                delta: DeltaStatic,
                oldDelta: DeltaStatic,
                source: Sources
            ) => {
                if (
                    eventName === QuillEvents.TEXT_CHANGE &&
                    source === QuillSources.USER &&
                    delta &&
                    delta.ops
                ) {
                    let hasEmoji = false
                    let emojiLength = 0
                    const emojiDelta = new Delta()
                    let docIndex = 0
                    delta.ops.forEach((op) => {
                        if (op.insert !== undefined) {
                            // 1. If inserted text is an emoji...
                            if (
                                typeof op.insert === 'string' &&
                                op.insert.length >= 2 &&
                                op.insert.match(EMOJI_REGEX)
                            ) {
                                hasEmoji = true
                                const match = EMOJI_REGEX.exec(op.insert)
                                emojiLength = match![0].length
                                // 2. Convert the emoji to an emoji embed in both our new delta and the outgoing op
                                emojiDelta.insert(
                                    {
                                        'emoji-embed': Emoji.getEmoji(
                                            match![0],
                                            'native'
                                        )
                                    },
                                    op.attributes
                                )
                                op.insert = {
                                    'emoji-embed': Emoji.getEmoji(
                                        match![0],
                                        'native'
                                    )
                                }
                                docIndex += emojiLength
                            } else {
                                docIndex += op.insert.length
                                emojiDelta.insert(op.insert)
                            }
                        } else if (op.retain !== undefined) {
                            docIndex += op.retain
                            emojiDelta.retain(op.retain)
                        } else if (op.delete !== undefined) {
                            docIndex -= op.delete
                            emojiDelta.delete(op.delete)
                        }
                    })
                    if (hasEmoji) {
                        // Update editor contents
                        this.quill.updateContents(
                            emojiDelta,
                            QuillSources.SILENT
                        )
                        // Delete the converted emoji
                        this.quill.deleteText(
                            docIndex - (emojiLength - 1),
                            emojiLength,
                            QuillSources.SILENT
                        )
                        // Update the editor
                        this.quill.update()
                        const curSelection = this.quill.getSelection()
                        const selectionLength =
                            curSelection && curSelection.length
                                ? curSelection.length
                                : 0
                        // Update the selection
                        this.quill.setSelection({
                            index: docIndex - (emojiLength - 1),
                            length: selectionLength
                        })
                    }
                }
            }
        )
    }
    _convertEmojiOnPaste(delta: DeltaStatic) {
        // 1. If pasted delta has an emoji...
        if (
            delta &&
            delta.ops &&
            delta.ops.length &&
            delta.ops[0].insert &&
            typeof delta.ops[0].insert === 'string' &&
            delta.ops[0].insert.match(EMOJI_REGEX)
        ) {
            let index = 0
            let match = null
            const emojiDelta = new Delta()
            // 2. Loop through those emojis and convert them to embeds
            while ((match = EMOJI_REGEX.exec(delta.ops[0].insert)) !== null) {
                emojiDelta.retain(match.index - index)
                emojiDelta.delete(match[0].length)
                emojiDelta.insert({
                    'emoji-embed': Emoji.getEmoji(match[0], 'native')
                })
                index = EMOJI_REGEX.lastIndex
            }
            return delta.compose(emojiDelta)
        } else {
            return delta
        }
    }
}
