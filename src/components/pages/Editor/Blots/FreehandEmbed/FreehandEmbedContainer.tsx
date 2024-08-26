import { includes, last, omit, startsWith } from 'lodash'
import PubSub from 'pubsub-js'
import URI from 'urijs'
import FreehandPlaceholderImage from '../../../../../assets/images/embeds/freehand-placeholder.png'
import { INVISION_DOMAINS } from '../../../../../constants/clipboard'
import { DOCUMENT_CHANGE_UPDATE } from '../../../../../constants/topics'
import PagesApiService from '../../../../../data/services/PagesApiService'
import { isOnTeam } from '../../../../../helpers/EmbedHelper'
import { BlotSize } from '../../../../../interfaces/blotSize'
import EmbedContainer, { EmbedContainerAppState } from '../EmbedContainer'
import { CROSS_TEAM_FAILURE } from '../ServiceErrorEmbed/ServiceErrorMessages'

export interface FreehandEmbedContainerAppState extends EmbedContainerAppState {
    id?: number
    name?: string
    placeholder?: string
    triggered?: boolean
    thumbnailUrl?: string
    updatedAt?: string
    content?: ArrayBuffer
    assets?: {
        [uuid: string]: string
    }
    updateAvailable?: boolean
}

export default class FreehandEmbedContainer extends EmbedContainer {
    state: FreehandEmbedContainerAppState

    async receivedNewState() {
        if (
            this.state.updateAvailable ||
            (!this.state.placeholder && !this.state.triggered)
        ) {
            const uri = URI(this.state.originalLink!)

            if (this.isInvalidDomain(uri)) {
                return
            }

            if (!isOnTeam(uri)) {
                this.setState({
                    triggered: true,
                    unviewable: true,
                    unviewableReason: CROSS_TEAM_FAILURE
                })
                this.setDataAttribute('unviewable', 'true')
                return
            }

            if (
                new URL(this.state.originalLink ?? '').searchParams.get(
                    'createdInRhombus'
                ) === 'true' &&
                this.getEmbedData().openInEditMode == null
            ) {
                this.setEmbedDataValue('openInEditMode', 'true')
            }

            const slugType = startsWith(uri.path(), '/public/freehand/')
                ? 'public'
                : 'private'
            const slug = last(uri.segment(-1).split('-'))
            if (!slug) {
                return
            }
            const placeholder = FreehandPlaceholderImage
            const freehandData = await PagesApiService.getFreehand(
                slugType,
                slug
            )

            if (freehandData.success) {
                this.setSize(this.state.size || BlotSize.Medium)
                if (freehandData.id !== '') {
                    this.setEmbedData({ id: freehandData.id })
                }
            } else {
                this.setDataAttribute('unviewable', 'true')
                this.setState({
                    unviewableReason: freehandData.error
                })
            }

            PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)

            this.setState({
                ...omit(freehandData, 'success'),
                unviewable: !freehandData.success,
                placeholder,
                triggered: true,
                updateAvailable: false
            })
        }
    }

    private isInvalidDomain(uri: uri.URI) {
        return !includes(INVISION_DOMAINS, uri.domain())
    }
}
