import AnalyticsBuilder from './AnalyticsBuilder'

const PAGINATED_METHOD = {
    click: 'Click',
    keyboard: 'Keyboard'
}
const PAGINATED_DIRECTION = {
    left: 'Left',
    right: 'Right'
}

class EmbedExpandedFullScreenAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.ExpandedFullScreen'
}
class EmbedClosedFullScreenAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.ClosedFullScreen'
}
class EmbedOpenedinNewTabAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.OpenedinNewTab'
}
class EmbedAccessRequestedAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.AccessRequested'
}
class EmbedDownloadedAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.Downloaded'
}
class EmbedResizedAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.Resized'
}
class EmbedDeletedAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.Deleted'
}
class EmbedExpandedAnalytics extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.Expanded'
}

class EmbedInteraction extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.Interacted'

    public panned() {
        return this.withProperties({
            interaction: 'EmbedAction.FreehandPanned'
        })
    }

    public zoomed() {
        return this.withProperties({
            interaction: 'EmbedAction.FreehandZoomed'
        })
    }
}

class EmbedExpandedPagination extends AnalyticsBuilder {
    protected eventName = 'App.Rhombus.Embed.Paginated'

    public clickLeft = () => {
        return this.withProperty(
            PAGINATED_METHOD.click,
            PAGINATED_DIRECTION.left
        )
    }

    public clickRight = () => {
        return this.withProperty(
            PAGINATED_METHOD.click,
            PAGINATED_DIRECTION.right
        )
    }
    public keyboardLeft = () => {
        return this.withProperty(
            PAGINATED_METHOD.keyboard,
            PAGINATED_DIRECTION.left
        )
    }
    public keyboardRight = () => {
        return this.withProperty(
            PAGINATED_METHOD.keyboard,
            PAGINATED_DIRECTION.right
        )
    }
}

export default class EmbedInteractionAnalytics {
    public onExpandedFullScreen = () => new EmbedExpandedFullScreenAnalytics()

    public onClosedFullScreen = () => new EmbedClosedFullScreenAnalytics()

    public onOpenedInNewTab = () => new EmbedOpenedinNewTabAnalytics()

    public onAccessRequested = () => new EmbedAccessRequestedAnalytics()

    public onDownloaded = () => new EmbedDownloadedAnalytics()

    public onResized = () => new EmbedResizedAnalytics()

    public onDeleted = () => new EmbedDeletedAnalytics()

    public onExpanded = () => new EmbedExpandedAnalytics()

    public onPaginated = () => new EmbedExpandedPagination()
    public onZoomed = () => new EmbedInteraction().zoomed()
    public onPanned = () => new EmbedInteraction().panned()
}
