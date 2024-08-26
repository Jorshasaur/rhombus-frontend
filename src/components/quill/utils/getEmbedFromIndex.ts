import quillProvider from '../provider'
import { Embed } from '../../../interfaces/Embed'

export default function getEmbedFromIndex(index: number): Embed | undefined {
    const quill = quillProvider.getQuill()
    const [blot] = quill.getLine(index) as [Embed | null, number]
    if (blot?.isEmbed) {
        return blot
    }
    return
}
