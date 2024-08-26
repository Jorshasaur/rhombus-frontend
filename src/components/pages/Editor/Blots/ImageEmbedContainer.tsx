import FileEmbedContainer, {
    FileEmbedContainerAppState
} from './FileEmbedContainer'
import { BlotSize } from '../../../../interfaces/blotSize'

interface ImageEmbedContainerAppState extends FileEmbedContainerAppState {
    dataUrl?: string
    index: number
    navigationHeight: number
}

const SMALL_SIZE_RATIO = 0.85

export default class ImageEmbedContainer extends FileEmbedContainer {
    state: ImageEmbedContainerAppState
    async receivedNewState() {
        super.receivedNewState()
        const { embedData, size } = this.state
        if (!embedData.width || !embedData.height) {
            const imageUrl = this.getImageUrl()
            if (imageUrl) {
                const { width, height } = await this.getImageSize(imageUrl)
                this.setEmbedDataValue({ width, height })
                this.setSize(this.getSize(width, height))
            }
        } else if (!size) {
            this.setSize(this.getSize(embedData.width, embedData.height))
        }
    }

    getSize(width: number, height: number) {
        if (width / height < SMALL_SIZE_RATIO) {
            return BlotSize.Small
        }
        return BlotSize.Medium
    }

    setDataUrl(dataUrl: string) {
        const newState = { dataUrl } as Partial<ImageEmbedContainerAppState>
        this.setState(newState)
    }

    setIndex(index: number, navigationHeight: number) {
        const newState = { index, navigationHeight } as Partial<
            ImageEmbedContainerAppState
        >
        this.setState(newState)
    }

    getImageUrl(): string | undefined {
        if (this.state.asset != null) {
            return this.state.asset.url
        } else if (this.state.dataUrl != null) {
            return this.state.dataUrl
        } else if (this.state.embedData != null) {
            return this.state.embedData.url
        }
        return
    }

    getImageSize(url: string): Promise<{ width: number; height: number }> {
        return new Promise((resolve, reject) => {
            const img = new Image()
            img.addEventListener('load', () => {
                resolve({
                    width: img.width,
                    height: img.height
                })
            })
            img.src = url
        })
    }
}
