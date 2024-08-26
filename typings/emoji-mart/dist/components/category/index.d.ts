declare module 'emoji-mart/dist/components/category' {
    import {
        Emoji,
        HasStickyPosition,
        Data,
        I18n,
        CustomEmoji,
        BackgroundImageFn,
        HandleEmojiOver,
        HandleEmojiLeave,
        HandleEmojiClick,
        EmojiProps,
        HandleSkinChange
    } from 'emoji-mart'
    export default class Category extends React.Component {
        getEmojis: () => Emoji[]
        setContainerRef: () => void
        setLabelRef: () => void
        data: Data
        props: {
            id: string
            name: string
            emojis: Emoji[]
            perLine: number
            native?: boolean
            hasStickyPosition: HasStickyPosition
            data: Data
            i18n: I18n
            recent?: string[]
            custom?: CustomEmoji[]
            notFound?: any,
            notFoundEmoji: string
            emojiProps: EmojiProps
            searchText: string
            anchorClicked: boolean
        }
    }
}

