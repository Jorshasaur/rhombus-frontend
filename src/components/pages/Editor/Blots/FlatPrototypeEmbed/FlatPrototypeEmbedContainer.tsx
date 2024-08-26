import URI from 'urijs'
import PrototypePlaceholderImage from '../../../../../assets/images/embeds/prototype-placeholder.png'
import PagesApiService from '../../../../../data/services/PagesApiService'
import { isOnTeam } from '../../../../../helpers/EmbedHelper'
import { BlotSize } from '../../../../../interfaces/blotSize'
import { calculateAspectRatio } from '../../../../../lib/utils'
import EmbedContainer, { EmbedContainerAppState } from '../EmbedContainer'
import { CROSS_TEAM_FAILURE } from '../ServiceErrorEmbed/ServiceErrorMessages'

export interface PrototypeData {
    isMobile: boolean
    width: number
    height: number
    thumbnail: string
    name: string
    updatedAt?: string
    success: boolean
    error?: string
}

interface PrototypeImageDimensions {
    aspect: number
    height: number
    width: number
}

export interface FlatPrototypeEmbedContainerAppState
    extends EmbedContainerAppState {
    triggered?: boolean
    url?: string
    prototype: PrototypeData
    imageDimensions: PrototypeImageDimensions
}

export const defaultFlatPrototype: PrototypeData = {
    isMobile: false,
    thumbnail: PrototypePlaceholderImage,
    height: 0,
    width: 0,
    name: 'Prototype',
    success: true
}
export default class FlatPrototypeEmbedContainer extends EmbedContainer {
    state: FlatPrototypeEmbedContainerAppState

    getPlaceholderDimensions(path: string) {
        return new Promise((resolve) => {
            const image = new Image()
            image.onload = () => {
                const aspect = calculateAspectRatio(image.width, image.height)
                resolve({
                    aspect,
                    height: image.height,
                    width: image.width
                })
            }
            image.src = path
        })
    }
    async getPrototypeInfo(
        uri: ReturnType<typeof URI>
    ): Promise<PrototypeData> {
        let response = defaultFlatPrototype
        try {
            const presentationSegment = uri.segment(1)
            const hash = presentationSegment.substring(
                presentationSegment.lastIndexOf('-') + 1
            )
            switch (uri.segment(0)) {
                case 'console':
                    if (uri.segment(2)) {
                        response = await PagesApiService.getFlatPrototypeByScreen(
                            hash,
                            uri.segment(2)
                        )
                    } else {
                        response = await PagesApiService.getFlatPrototypeByHash(
                            hash
                        )
                    }
                    break
                case 'overview':
                    response = await PagesApiService.getFlatPrototypeByHash(
                        hash
                    )
                    break
                case 'public':
                    response = await PagesApiService.getFlatPrototypeByShareKey(
                        uri.segment(2)
                    )
                    break
                default:
                    break
            }
            return {
                ...defaultFlatPrototype,
                ...response
            }
        } catch (error) {
            return response
        }
    }
    getPlayUrl(uri: ReturnType<typeof URI>) {
        const playUrl = uri.clone()

        switch (playUrl.segment(0)) {
            case 'overview':
                playUrl.segment(0, 'console')
                playUrl.segment(2, '')
                playUrl.segment(3, '')
                break
            case 'public':
            case 'console':
            default:
                break
        }

        return playUrl.toString()
    }
    async receivedNewState() {
        if (!this.state.triggered) {
            const uri = URI(this.state.originalLink!).normalize()

            if (!isOnTeam(uri)) {
                this.setState({
                    triggered: true,
                    unviewable: true,
                    unviewableReason: CROSS_TEAM_FAILURE
                })
                this.setDataAttribute('unviewable', 'true')
                return
            }
            const playUrl = this.getPlayUrl(uri)
            const prototype = await this.getPrototypeInfo(uri)

            if (!prototype.success) {
                this.setDataAttribute('unviewable', 'true')
                this.setState({ unviewableReason: prototype.error })
            }

            const imageDimensions = await this.getPlaceholderDimensions(
                prototype.thumbnail
            )

            this.setSize(this.state.size || BlotSize.Medium)

            this.setState({
                prototype,
                unviewable: !prototype.success,
                imageDimensions,
                triggered: true,
                url: playUrl
            })
        }
    }
}
