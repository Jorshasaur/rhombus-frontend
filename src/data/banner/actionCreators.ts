import { Dispatch, Action } from 'redux'
import { showBanner, hideBanner } from '../actions'
import { BannerType, BannerColor } from '../reducers/banner'

const showTryingReconnect = () => (dispatch: Dispatch<Action>) => {
    dispatch(showBanner(BannerType.TRYING_RECONNECT, BannerColor.WARNING))
}

const showConnectionLostError = () => (dispatch: Dispatch<Action>) => {
    dispatch(showBanner(BannerType.CONNECTION_LOST_ERROR, BannerColor.DANGER))
}

const showConnectionLostWarning = () => (dispatch: Dispatch<Action>) => {
    dispatch(showBanner(BannerType.CONNECTION_LOST_WARN, BannerColor.WARNING))
}

const showReconnectSuccess = () => (dispatch: Dispatch<Action>) => {
    dispatch(showBanner(BannerType.RECONNECT, BannerColor.SUCCESS))
}

export default {
    hideBanner,
    showTryingReconnect,
    showConnectionLostError,
    showConnectionLostWarning,
    showReconnectSuccess
}
