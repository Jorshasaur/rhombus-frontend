import EmbedInteractionAnalytics from '../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import { EmbedModal, EmbedModalProps } from './EmbedModal'
import { startCase } from 'lodash'
import { BlockEmbedService } from '../../../../interfaces/blockEmbed'

export const createNewTabTracker = (service: BlockEmbedService) => () => {
    new EmbedInteractionAnalytics()
        .onOpenedInNewTab()
        .withProperties({
            subType: `EmbedType.is${startCase(service)}`
        })
        .track()
}

export const createModalOpenHandler = (
    getEmbedModalData: () => EmbedModalProps
) => (e: React.MouseEvent<HTMLElement>) => {
    e.preventDefault()
    e.stopPropagation()
    document.body.style.overflow = 'hidden'
    EmbedModal.show(getEmbedModalData())
    new EmbedInteractionAnalytics().onExpandedFullScreen().track()
}

export const createModalCloseHandler = () => (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
) => {
    document.body.style.overflow = 'visible'
    EmbedModal.hide()
    new EmbedInteractionAnalytics().onClosedFullScreen().track()
    event.stopPropagation()
}
