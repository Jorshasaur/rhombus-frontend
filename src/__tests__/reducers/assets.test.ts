import assets, { initialState } from '../../data/reducers/assets'
import { TypeKeys } from '../../data/ActionTypes'

const newAssets = [
    {
        id: '39aa0bc9-94bd-4662-adad-c9d4558aca8c',
        fileName: 'image.png',
        url:
            'https://assets.local.invision.works/assets/df900ab0-c2ba-4d67-8b15-5840f2facd08'
    },
    {
        id: '34e2f6b9-5dd5-4f57-b022-1b3fdb7e4e16',
        fileName: 'DSCF8303.jpg',
        url:
            'https://assets.local.invision.works/assets/1382ffc6-a8a0-4673-ba96-97fd87612ecc'
    }
]

const assetsState = {
    '39aa0bc9-94bd-4662-adad-c9d4558aca8c': {
        id: '39aa0bc9-94bd-4662-adad-c9d4558aca8c',
        fileName: 'image.png',
        url:
            'https://assets.local.invision.works/assets/df900ab0-c2ba-4d67-8b15-5840f2facd08'
    },
    '34e2f6b9-5dd5-4f57-b022-1b3fdb7e4e16': {
        id: '34e2f6b9-5dd5-4f57-b022-1b3fdb7e4e16',
        fileName: 'DSCF8303.jpg',
        url:
            'https://assets.local.invision.works/assets/1382ffc6-a8a0-4673-ba96-97fd87612ecc'
    }
}

const newAsset = {
    id: '39aa0bc9-94bd-4662-adad-c9d4558acb7a',
    fileName: 'image.png',
    url: 'https://assets.local.invision.works/assets/df900ab0-c2ba-4d67-8b15'
}

const newAssetState = {
    '39aa0bc9-94bd-4662-adad-c9d4558acb7a': {
        fileName: 'image.png',
        id: '39aa0bc9-94bd-4662-adad-c9d4558acb7a',
        url:
            'https://assets.local.invision.works/assets/df900ab0-c2ba-4d67-8b15'
    }
}

describe('assets reducer', () => {
    it('should return the initial state', () => {
        expect(
            assets(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })

    it('should set a documents assets', () => {
        expect(
            assets(undefined, {
                type: TypeKeys.SET_ASSETS,
                data: {
                    assets: newAssets
                }
            })
        ).toEqual(assetsState)
    })

    it('should set a documents asset', () => {
        expect(
            assets(undefined, {
                type: TypeKeys.SET_ASSET,
                data: {
                    asset: newAsset
                }
            })
        ).toEqual(newAssetState)
    })
})
