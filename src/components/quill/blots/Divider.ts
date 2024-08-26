import { BlockEmbed } from 'quill'
import Quill from 'quill/core'

const Block: typeof BlockEmbed = Quill.import('blots/block')
export class Divider extends Block {
    public static blotName = 'divider'
    public static tagName = 'hr'

    static create(value: boolean) {
        const node: HTMLElement = super.create(value) as HTMLElement
        node.setAttribute('contenteditable', 'false')
        return node
    }
}
