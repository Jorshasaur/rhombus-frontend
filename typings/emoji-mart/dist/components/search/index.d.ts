declare module 'emoji-mart/dist/components/search' {
    import {
        HandleSearch,
        Data,
        I18n,
        EmojisToShowFilter,
        CategoryKeys,
        CustomEmoji
    } from 'emoji-mart'
    export default class Search extends React.Component {
        props: {
            onSearch: HandleSearch
            data: Data
            i18n: I18n
            emojisToShowFilter?: EmojisToShowFilter
            include?: CategoryKeys[]
            exclude?: CategoryKeys[]
            custom: CustomEmoji[]
            autoFocus?: boolean
        }
    }
}

