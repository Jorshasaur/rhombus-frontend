import quill from 'quill/core'
import { ImageDataStore } from '../data/images/interfaces'
import ImageEmbedContainer from '../components/pages/Editor/Blots/ImageEmbedContainer'
import { IMAGE_EMBED_CLASS_NAME } from '../constants/embeds'

const Parchment = quill.import('parchment')
const imageEmbedClass = '.' + IMAGE_EMBED_CLASS_NAME

export function getImageIdsInDocument() {
    const imageEmbeds = document.querySelectorAll(imageEmbedClass)
    return Array.from(imageEmbeds)
        .map(
            (imageEmbed: HTMLDivElement) =>
                imageEmbed.dataset && imageEmbed.dataset.imageId
        )
        .filter((id: string) => id !== undefined) as string[]
}

export function getImageData(imageId: string) {
    const imageEmbedSelector = [
        `${imageEmbedClass}[data-image-id="${imageId}"]`
    ].join(' ')
    const imageEmbed = document.querySelector(imageEmbedSelector)
    if (imageEmbed) {
        const embed = Parchment.find(imageEmbed.parentNode)
        if (embed && embed.provider) {
            const provider = embed.provider as ImageEmbedContainer
            const url = provider.getImageUrl()
            const { state } = provider
            const imageData: ImageDataStore = {
                id: imageId,
                assetId: state.asset && state.asset.id,
                authorId: state.authorId,
                url: url!,
                createdAt: state.createdAt
            }
            if (state.embedData && state.embedData) {
                imageData.width = state.embedData.width
                imageData.height = state.embedData.height
            }

            return imageData
        }
    }
    return null
}
