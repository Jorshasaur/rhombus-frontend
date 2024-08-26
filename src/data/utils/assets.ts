import { Store } from 'react-redux'
import { RootState } from '../reducers'
import { Asset } from '../../interfaces/asset'

export function getAsset(store: Store<RootState>, id: string): Asset {
    const state = store.getState()
    return state.assets[id]
}
