import { BlockEmbedService } from '../../../../../interfaces/blockEmbed'
import { matchEmbedUrl } from '../../../../quill/modules/matchEmbedUrl'

interface ModalCopy {
    title: string
    subtitle: string
    exampleUrl: null | string
    tip: string
}

export const useModalCopy = (service: BlockEmbedService): ModalCopy => {
    switch (service) {
        case 'invision':
        case 'prototype':
            return {
                title: 'an InVision Prototype',
                subtitle:
                    'Add a clickable, interactive InVision prototype to your doc.',
                exampleUrl: null,
                tip: 'Paste a prototype link directly in the doc'
            }
        case 'freehand':
            return {
                title: 'an InVision Freehand',
                subtitle: 'Add a zoomable, pannable Freehand to your doc.',
                exampleUrl: null,
                tip: 'Paste a Freehand link directly in the doc'
            }
        case 'spotify':
            return {
                title: 'music from Spotify',
                subtitle:
                    'Play a Spotify playlist, song, or album from your doc.',
                exampleUrl:
                    'https://open.spotify.com/track/1DrlLvlYd1FIjNavRm6NdX',
                tip: 'Paste a Spotify link directly in the doc'
            }
        case 'youtube':
            return {
                title: 'YouTube video',
                subtitle: 'Play a YouTube video within your doc.',
                exampleUrl: 'https://www.youtube.com/watch?v=0fKBhvDjuy0',
                tip: 'Paste a YouTube link directly in the doc'
            }
        case 'vimeo':
            return {
                title: 'Vimeo video',
                subtitle: 'Play a Vimeo video within your doc.',
                exampleUrl: 'https://vimeo.com/133693532',
                tip: 'Paste a Vimeo link directly in the doc'
            }
        case 'soundcloud':
            return {
                title: 'music from SoundCloud',
                subtitle: 'Play a Soundcloud song or playlist from your doc.',
                exampleUrl:
                    'https://soundcloud.com/jkf-w/edward-tufte-offering',
                tip: 'Paste a Soundcloud link directly in the doc'
            }
        case 'marvel':
            return {
                title: 'Marvel prototype',
                subtitle:
                    'Add a clickable, interactive Marvel prototype to your doc.',
                exampleUrl: 'https://marvelapp.com/100cjb3',
                tip: 'Paste a Marvel link directly in the doc'
            }
        case 'codepen':
            return {
                title: 'a CodePen',
                subtitle: 'Insert an interactive CodePen.',
                exampleUrl: 'https://codepen.io/Ramnk7/pen/byqNLY',
                tip: 'Paste a CodePen link directly in the doc'
            }
        default:
            throw new Error('service not recognized')
    }
}

const urlRegEx = /(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,})/i
export const isValidLink = (url: string) => urlRegEx.test(url)
export const isDisabled = (url: string, embedType: BlockEmbedService) => {
    if (embedType === 'prototype' && matchEmbedUrl(url) === 'invision') {
        return false
    }

    return (
        url.length === 0 ||
        !isValidLink(url) ||
        matchEmbedUrl(url) !== embedType
    )
}
