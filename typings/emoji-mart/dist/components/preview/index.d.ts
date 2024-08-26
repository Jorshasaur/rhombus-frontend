declare module 'emoji-mart/dist/components/preview' {
    import {
        Data,
        I18n,
        BackgroundImageFn,
        HandleSkinChange
    } from 'emoji-mart'
    export default class Preview extends React.Component {
        props: {
            data: Data
            title?: string
            emoji?: string
            showSkinTones?: boolean
            emojiProps: {
                native?: boolean
                skin: number
                size?: number
                set?: string
                sheetSize?: number
                forceSize?: boolean
                tooltip?: boolean
                backgroundImageFn?: BackgroundImageFn
            }
            skinsProps: {
                skin: number
                onChange: HandleSkinChange
            }
        }
    }
}

