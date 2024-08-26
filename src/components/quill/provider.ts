import Quill from '../quill/entries/Editor'

let quill: Quill | null = null

export const quillProvider = {
    getQuill(): Quill {
        return quill!
    },

    setQuill(aQuill: Quill) {
        quill = aQuill
    }
}

export default quillProvider
