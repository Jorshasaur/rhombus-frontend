const tempAssets: { [id: string]: TempAsset } = {}

export enum TempAssetType {
    COPY
}

interface TempAsset {
    url: string
    type: TempAssetType
}

export default {
    addAsset(id: string, url: string, type: TempAssetType) {
        tempAssets[id] = {
            url,
            type
        }
    },

    getAsset(id: string): TempAsset | undefined {
        return tempAssets[id]
    }
}
