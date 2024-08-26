import EmbedContainer, { EmbedContainerAppState } from '../EmbedContainer'
import { DOCUMENT_CHANGE_UPDATE } from '../../../../../constants/topics'
import { JIRA_PATTERN } from '../../../../../constants/clipboard'
import URI from 'urijs'
import PubSub from 'pubsub-js'

export interface JiraEmbedContainerAppState extends EmbedContainerAppState {
    originalLink: string
    ticketNumber?: string
}

export default class JiraEmbedContainer extends EmbedContainer {
    state: JiraEmbedContainerAppState

    async receivedNewState() {
        const uri = URI(this.state.originalLink)
        const ticketNumber = this.getTicketNumber(uri)

        if (this.state.ticketNumber != null) {
            return
        }

        if (ticketNumber == null) {
            return
        }

        PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)

        this.setState({
            ticketNumber
        })
    }

    private getTicketNumber(uri: uri.URI): void | string {
        return uri.path().match(JIRA_PATTERN)?.[0]
    }
}
