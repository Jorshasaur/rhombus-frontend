import { find } from 'lodash'
import Quill from 'quill/core'
import React from 'react'
import ReactDOM from 'react-dom'
import Mention from '../../../components/pages/Editor/Mentions/Mention/Mention'
import store from '../../../data/store'
import { preloadImage } from '../utils'
import { ErrorBoundary } from '../../../bugsnag'

const Embed = Quill.import('blots/embed')
interface MentionValue {
    id: number
    userId: number
    name: string
    email: string
}
export class MentionBlot extends Embed {
    public static blotName = 'mention'
    public static tagName = 'span'
    public static className = 'mention'
    domNode: HTMLElement

    static create(value: MentionValue) {
        const node: HTMLElement = super.create(value) as HTMLElement
        // Check to make sure userId exists
        if (value.userId) {
            node.setAttribute('data-user-id', value.userId.toString())
            node.setAttribute('data-name', value.name)
            node.setAttribute('data-email', value.email)
            node.setAttribute('data-rhombus', 'true')
            const state = store.getState()
            const member = find(
                state.currentDocument.teamMembers,
                (teamMember) => {
                    return teamMember.userId === +value.userId
                }
            )
            const avatarUrl = member ? member.avatarUrl : ''
            // Preload images
            if (avatarUrl.length) {
                preloadImage(avatarUrl)
            }
            ReactDOM.render(
                <ErrorBoundary>
                    <Mention
                        email={value.email || ''}
                        name={value.name || ''}
                        avatarUrl={avatarUrl}
                    />
                </ErrorBoundary>,
                node
            )
        }
        return node
    }
    static value(domNode: HTMLElement): MentionValue {
        const userId = parseInt(domNode.getAttribute('data-user-id')!, 10)

        return {
            id: userId,
            userId,
            name: domNode.getAttribute('data-name')!,
            email: domNode.getAttribute('data-email')!
        }
    }

    deleteAt(index: number, length: number) {
        ReactDOM.unmountComponentAtNode(this.domNode.children[0])
        super.deleteAt(index, length)
    }
}
