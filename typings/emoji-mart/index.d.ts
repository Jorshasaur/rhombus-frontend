import React from 'react'
import { Picker, EmojiSkin } from 'emoji-mart'
declare module 'emoji-mart' {
    export type CategoryKeys = 'search' | 'recent' | 'people' | 'nature' | 'foods' | 'activity' | 'places' | 'objects' | 'symbols' | 'flags' | 'custom'
    export interface EmojiData {
        native: string
    }
    export class NimbleEmojiIndex {
        constructor(data: any)
        search(searchString?: string): EmojiData[]
    }
    interface Category {
        name: string
        id: string
        emojis: Object[]
    }
    interface CustomEmoji {
            name: string,
            short_names: string[],
            emoticons: string[],
            keywords: string[],
            imageUrl: string,
    }
    export interface Emoji {}
    export type I18n = {
        search: string,
        notfound: string,
        categories: {
            [key: string]: string
        }
    }
    export type EmojiProps = {
        native?: boolean
        skin: number
        size?: number
        set?: string
        sheetSize?: number
        forceSize?: boolean
        tooltip?: boolean
        backgroundImageFn?: BackgroundImageFn
        onOver: HandleEmojiOver
        onLeave: HandleEmojiLeave
        onClick: HandleEmojiClick
    }
    export type Icons = Object
    export type Color = string
    export type Categories = Object
    export type HandleAnchorClick = (category: string, i: number) => void
    export type HandleSearch = (searchData?: EmojiData[]) => void
    export type Data = Object
    export type EmojisToShowFilter = (emoji: EmojiData) => boolean
    export type HasStickyPosition = () => boolean
    export type BackgroundImageFn = (set: string, sheetSize: number) => {}
    export type HandleEmojiOver = (emoji: Emoji) => void | null
    export type HandleEmojiLeave = (emoji: Emoji) => void | null
    export type HandleEmojiClick = (emoji: Emoji, event: React.MouseEvent) => void | null
    export type HandleSkinChange = (skin: EmojiSkin) => void
    export type NotFound = () => Emoji
    export type NotFoundEmoji = string
    export class NimblePicker extends React.Component {
        scroll: any
        handleSearch: HandleSearch
        handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>): void
        setAnchorsRef(ref: any): void
        setSearchRef(ref: any): void
        setScrollRef(ref: any): void
        setCategoryRef(ref: any): void
        setPreviewRef(ref: any): void
        handleAnchorClick(category: string, i: number): void
        handleScroll(): void
        getCategories(): Category[]
        hasStickyPosition: HasStickyPosition
        handleEmojiLeave: HandleEmojiLeave
        handleEmojiOver: HandleEmojiOver
        handleEmojiClick: HandleEmojiClick
        handleSkinChange: HandleSkinChange
        RECENT_CATEGORY: Category
        CUSTOM_CATEGORY: {
            emojis: CustomEmoji[]
        }
        state: {
            skin: number
            anchorClicked: boolean
        }
        data: Data
        i18n: I18n
        categories: Categories
        icons: Icons
        props: {
            emojiSize: number
            sheetSize?: number
            native?: boolean
            autoFocus?: boolean
            color?: Color
            emoji?: string
            include?: CategoryKeys[]
            exclude?: CategoryKeys[]
            set?: string
            data?: object
            title?: string
            perLine: number
            emojisToShowFilter?: EmojisToShowFilter
            onClick?(emoji: EmojiData, event: Event): void
            onSelect(emoji: EmojiData): void
            searchData?: EmojiData[]
            style?: object
            showPreview?: boolean
            showSkinTones?: boolean
            onSkinChange?: (skin: number) => {},
            i18n?: I18n,
            skin?: number,
            backgroundImageFn?: BackgroundImageFn,
            emojiTooltip?: boolean,
            recent?: string[]
            custom?: CustomEmoji[]
            notFound?: NotFound
            notFoundEmoji: NotFoundEmoji
            searchText: string
        }
    }
    export class Preview extends React.Component {}
}
