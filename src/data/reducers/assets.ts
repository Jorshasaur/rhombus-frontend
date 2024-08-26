import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import { Asset } from '../../interfaces/asset'

export interface AssetsState {
    [id: string]: Asset
}

export const initialState = {}

const setAssetsReduce = (
    assetsById: AssetsState,
    asset: Asset
): AssetsState => {
    assetsById[asset.id] = asset
    return assetsById
}

export default function assetsReducer(
    state: AssetsState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_CURRENT_DOCUMENT:
        case TypeKeys.SET_ASSETS:
            const assets = data.assets as Asset[]
            return assets.reduce(setAssetsReduce, Object.assign({}, state))
        case TypeKeys.SET_ASSET:
            const newState = Object.assign({}, state)
            const asset = data.asset as Asset
            newState[asset.id] = asset
            return newState
        default:
            return state
    }
}
