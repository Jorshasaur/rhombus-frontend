import Quill from 'quill/core'
import React from 'react'
import ReactDOM from 'react-dom'
import DocumentMention from '../../../components/pages/Editor/Mentions/DocumentMention/DocumentMention'
import store from '../../../data/store'
import { preloadImage } from '../utils'
import { ErrorBoundary } from '../../../bugsnag'

const Embed = Quill.import('blots/embed')

export class DocumentMentionBlot extends Embed {
    public static blotName = 'document-mention'
    public static tagName = 'span'
    public static className = 'document-mention'
    domNode: HTMLElement

    static create(value: string) {
        const node: HTMLElement = super.create(value) as HTMLElement
        node.setAttribute('data-document-mention', 'true')
        node.setAttribute('data-rhombus', 'true')
        const state = store.getState()
        const members = state.currentDocument.members
        // Preload images
        members.forEach((member) => {
            if (member.avatarUrl) {
                preloadImage(member.avatarUrl)
            }
        })
        ReactDOM.render(
            <ErrorBoundary>
                <DocumentMention documentName="Doc" members={members} />
            </ErrorBoundary>,
            node
        )
        return node
    }
    static value(domNode: HTMLElement) {
        return {
            documentMention: domNode.getAttribute('data-document-mention')
        }
    }

    deleteAt(index: number, length: number) {
        ReactDOM.unmountComponentAtNode(this.domNode.children[0])
        super.deleteAt(index, length)
    }
}
