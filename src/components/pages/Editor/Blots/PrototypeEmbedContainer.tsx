import PubSub from 'pubsub-js'
import URI from 'urijs'
import { DOCUMENT_CHANGE_UPDATE } from '../../../../constants/topics'
import ExternalDocument from '../../../../data/ExternalDocument'
import { isOnTeam } from '../../../../helpers/EmbedHelper'
import { BlotSize } from '../../../../interfaces/blotSize'
import EmbedContainer, { EmbedContainerAppState } from './EmbedContainer'

interface PrototypeData {
    name: string
    width: number
    height: number
    thumbnailUrl: string
    updatedAt: string
}

export interface PrototypeEmbedContainerAppState
    extends EmbedContainerAppState {
    placeholder: string
    triggered?: boolean
    url: string
    prototype: PrototypeData
    unviewable: boolean
}

export default class PrototypeEmbedContainer extends EmbedContainer {
    state: PrototypeEmbedContainerAppState

    async receivedNewState() {
        if (!this.state.placeholder && !this.state.triggered) {
            // Convert original link to play url
            const uri = URI(this.state.originalLink!)
            if (!isOnTeam(uri)) {
                this.setState({
                    triggered: true
                })
                this.setDataAttribute('unviewable', 'true')
                return
            }

            const presentationSegment = uri.segment(1)
            const id = presentationSegment.substring(
                presentationSegment.lastIndexOf('-') + 1
            )

            const prototype = await ExternalDocument.getDocument(
                'invision-presentation',
                id
            ).catch((error: Error) => {
                return
            })

            PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)

            this.setSize(this.state.size || BlotSize.Medium)

            this.setState({
                prototype,
                triggered: true
            })
        }
    }
}
