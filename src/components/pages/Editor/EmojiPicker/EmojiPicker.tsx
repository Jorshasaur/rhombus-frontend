import { EmojiData, NimbleEmojiIndex } from 'emoji-mart'
import data from 'emoji-mart/data/emojione.json'
import PubSub from 'pubsub-js'
import React from 'react'
import { AnyAction } from 'redux'
import sprite from '../../../../assets/images/emoji/sprite.png'
import { EMBED_INSERT } from '../../../../constants/topics'
import { EmojiPickerState } from '../../../../data/reducers/emojiPicker'
import { Emoji } from '../../../quill/modules/Emoji'
import QuillSources from '../../../quill/modules/QuillSources'
import quillProvider from '../../../quill/provider'
import { CustomNimblePicker } from './CustomNimblePicker'
import './EmojiPicker.css'
import { getEditor } from '../../../../QuillRegistry'

interface Props extends EmojiPickerState {
    clearEmojiPicker: () => AnyAction
}
interface State {
    searchData?: EmojiData[]
    mounted: boolean
}
const backgroundImageFn = () => sprite
export class EmojiPicker extends React.Component<Props, State> {
    token: string
    pickerRef: CustomNimblePicker | null
    constructor(props: Props) {
        super(props)

        this.state = {
            mounted: false
        }
        this.token = PubSub.subscribe(EMBED_INSERT, this.subscriber.bind(this))
        document.addEventListener('mousedown', this._handleClickOutside)
    }
    subscriber = (msg: string, pubSubData: string) => {
        switch (pubSubData) {
            case 'emoji-embed':
                this._handleExternalInsert()
                break
            default:
                break
        }
    }

    componentDidMount() {
        const { emojiText } = this.props
        this.setState({ mounted: true })
        if (emojiText) {
            this._updateSearch()
        }
    }
    componentDidUpdate(prevProps: Props, prevState: State) {
        const { emojiText } = this.props
        if (emojiText !== prevProps.emojiText) {
            this._updateSearch()
        }
    }
    componentWillUnmount() {
        PubSub.unsubscribe(this.token)
        document.removeEventListener('mousedown', this._handleClickOutside)
    }
    render() {
        const { bottom, left, emojiText } = this.props
        const { mounted } = this.state
        const pickerLeft = this.pickerRef
            ? left - this.pickerRef.scroll.clientWidth / 2
            : left - 140
        const topPosition = this._calculateTopPosition(bottom)
        return (
            <CustomNimblePicker
                ref={this._setRef}
                set="emojione"
                title="Select an emoji"
                emojiSize={24}
                backgroundImageFn={backgroundImageFn}
                onSelect={this._insertEmoji}
                exclude={['recent', 'custom']}
                perLine={7}
                data={data}
                searchData={this.state.searchData}
                notFoundEmoji="sleuth_or_spy"
                emojiTooltip={true}
                searchText={emojiText}
                style={{
                    opacity: `${mounted ? 1 : 0}`,
                    position: 'absolute',
                    top: topPosition,
                    left: `${pickerLeft > 0 ? pickerLeft : 0}px`,
                    transition: 'opacity .3s ease',
                    zIndex: 500
                }}
            />
        )
    }
    private _calculateTopPosition = (bottom: number) => {
        const viewportHeight = window.innerHeight
        const emojiWindowHeight = 387
        const halfHeight = viewportHeight * 0.5
        if (
            bottom >= viewportHeight - emojiWindowHeight &&
            halfHeight > emojiWindowHeight
        ) {
            return `${bottom - emojiWindowHeight}px`
        }
        return `${bottom + 15}px`
    }
    private _setRef = (el: CustomNimblePicker) => {
        if (el) {
            this.pickerRef = el
        }
    }
    private _updateSearch = () => {
        const { emojiText } = this.props
        const emojiIndex = new NimbleEmojiIndex(data)
        const searchData = emojiIndex.search(emojiText)
        this.setState({ searchData })
    }
    private _insertEmoji = (emoji: EmojiData) => {
        let quill = quillProvider.getQuill()
        if (this.props.editorId) {
            quill = getEditor(this.props.editorId) || quill
        }
        // Get emoji data from the native emoji
        const emojiData = Emoji.getEmoji(emoji.native, 'native')
        const { initialIndex, emojiText, clearEmojiPicker } = this.props

        if (typeof initialIndex === 'number') {
            quill.deleteText(
                initialIndex,
                emojiText.length + 1,
                QuillSources.USER
            )

            quill.insertEmbed(
                initialIndex,
                'emoji-embed',
                emojiData,
                QuillSources.USER
            )
            // Get the scroll position of the window
            const scrollTop = quill.scrollingContainer.scrollTop
            quill.setSelection(initialIndex + 1, QuillSources.USER)
            // Restore scroll position
            quill.scrollingContainer.scrollTop = scrollTop
            clearEmojiPicker()
        }
    }
    private _handleExternalInsert = () => {
        if (this.state.searchData && this.state.searchData.length) {
            this._insertEmoji(this.state.searchData[0])
        }
    }
    private _handleClickOutside = (event: MouseEvent) => {
        const { clearEmojiPicker, showEmojiPicker } = this.props
        if (
            this.pickerRef &&
            event.target &&
            !this.pickerRef.scroll.contains(event.target as HTMLElement) &&
            showEmojiPicker &&
            !this._isInEmojiPicker(event.target as HTMLElement)
        ) {
            clearEmojiPicker()
        }
    }
    private _isInEmojiPicker(child: HTMLElement) {
        if (
            child.classList &&
            child.classList.length &&
            child.classList.contains('emoji-mart')
        ) {
            return true
        }
        let node = child.parentNode as HTMLElement
        while (node) {
            if (
                node.classList &&
                node.classList.length &&
                node.classList.contains('emoji-mart')
            ) {
                return true
            }
            node = node.parentNode as HTMLElement
        }
        return false
    }
}
