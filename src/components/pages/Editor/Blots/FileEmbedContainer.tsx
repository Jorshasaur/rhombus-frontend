import urlModule from 'url'
import PagesApiService from '../../../../data/services/PagesApiService'
import store from '../../../../data/store'
import tempAssets from '../../../../data/tempAssets'
import { getAsset } from '../../../../data/utils/assets'
import { Asset } from '../../../../interfaces/asset'
import { isAssetUrl } from '../../../../lib/utils'
import EmbedContainer, { EmbedContainerAppState } from './EmbedContainer'

export interface FileEmbedContainerAppState extends EmbedContainerAppState {
    dataUrl?: string
    asset?: Asset
}

export default class FileEmbedContainer extends EmbedContainer {
    state: FileEmbedContainerAppState

    async receivedNewState() {
        const { embedData, asset, uuid } = this.state
        if (asset == null && embedData != null && embedData.url == null) {
            if (embedData.id != null) {
                let newAsset = getAsset(store, embedData.id) as
                    | Asset
                    | undefined
                if (newAsset == null) {
                    newAsset = await PagesApiService.getAsset(embedData.id)
                    if (newAsset == null || newAsset.id == null) {
                        await this.copyAsset(embedData.id)
                        return
                    }
                }
                this.setState({ asset: newAsset })
            } else if (this.state.dataUrl == null) {
                const tempAsset = tempAssets.getAsset(uuid)
                if (tempAsset != null && isAssetUrl(tempAsset.url)) {
                    await this.copyAssetFromUrl(tempAsset.url)
                }
            }
        }
    }

    async copyAssetFromUrl(assetUrl: string) {
        const assetUrlPath = urlModule
            .parse(assetUrl)
            .path!.replace('/assets/', '')
        const asset = await PagesApiService.copyAssetFromUrl(assetUrlPath)
        if (asset != null && asset.id) {
            this.setState({ asset: asset })
            this.setEmbedDataValue('id', asset.id)
        }
    }

    async copyAsset(assetId: string) {
        const reduxState = store.getState()
        if (reduxState.currentDocument.id) {
            const newAsset = await PagesApiService.copyAsset(assetId)
            if (newAsset != null && newAsset.id) {
                this.setState({ asset: newAsset })
                this.setEmbedDataValue('id', newAsset.id)
            }
        }
    }
}
