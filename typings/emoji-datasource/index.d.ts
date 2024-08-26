declare module 'emoji-datasource' {
    let data: Array<EmojiData>
    export default data

    export interface EmojiData {
        name: string
        unified: string
        non_qualified: string | null
        docomo: string | null
        au: string
        softbank: string
        google: string
        image: string
        sheet_x: number
        sheet_y: number
        short_name: string
        short_names: string[]
        text: string | null
        texts: string[] | null
        category: string
        sort_order: number
        added_in: string
        has_img_apple: boolean
        has_img_google: boolean
        has_img_twitter: boolean
        has_img_emojione: boolean
        has_img_facebook: boolean
        has_img_messenger: boolean
        skin_variations?: { [key: string]: EmojiData }
        obsoletes?: string
        obsoleted_by?: string
    }
}
