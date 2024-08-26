declare module 'emoji-mart/dist/components/anchors' {
    import {
        Data,
        I18n,
        Color,
        Categories,
        HandleAnchorClick,
        Icons
    } from 'emoji-mart'
    export default class Anchors extends React.Component {
        props: {
            data: Data
            i18n: I18n
            color?: Color
            categories: Categories
            onAnchorClick: HandleAnchorClick
            icons: Icons
        }
    }
}

