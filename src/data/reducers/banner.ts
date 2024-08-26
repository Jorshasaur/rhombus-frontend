import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export enum BannerType {
    RESET_DOC,
    CONNECTION_LOST_WARN,
    CONNECTION_LOST_ERROR,
    TRYING_RECONNECT,
    RECONNECT
}

export enum BannerPosition {
    Top,
    Bottom
}

export enum BannerColor {
    PRIMARY = 'primary',
    SECONDARY = 'secondary',
    SUCCESS = 'success',
    WARNING = 'warning',
    DANGER = 'danger',
    GRAY = 'gray',
    INFO = 'info'
}

export interface BannerState {
    type?: BannerType
    color?: BannerColor
    position?: BannerPosition
}

export const initialState = {}

export default function banner(
    state: BannerState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SHOW_BANNER:
            // It should not be possible to transition from RESET_DOC
            // directly to another banner state
            if (state.type === BannerType.RESET_DOC) {
                return state
            } else {
                return {
                    type: data.type,
                    color: data.color,
                    position: data.position
                }
            }
        case TypeKeys.HIDE_BANNER:
            return initialState
        default:
            return state
    }
}
