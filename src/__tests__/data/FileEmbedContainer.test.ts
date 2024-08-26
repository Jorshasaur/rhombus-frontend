import FileEmbedContainer from '../../components/pages/Editor/Blots/FileEmbedContainer'
import PagesApiService from '../../data/services/PagesApiService'
import store from '../../data/store'
import setImmediatePromise from 'set-immediate-promise'
import tempAssets, { TempAssetType } from '../../data/tempAssets'

jest.mock('../../quillData/ImageSelectors')

describe('FileEmbedContainer', () => {
    const fileEmbedData = {
        embedData: {
            id: '123',
            fileName: 'test.sketch'
        },
        uuid: '1',
        service: 'file',
        version: 1,
        authorId: '1'
    }

    it('should set asset from redux store', async () => {
        const setStateSpy = jest.spyOn(FileEmbedContainer.prototype, 'setState')

        store.getState = jest.fn(() => {
            return {
                permissions: {
                    canEdit: true
                },
                assets: {
                    '123': {
                        id: '123',
                        url: 'http://asset'
                    }
                }
            }
        })

        new FileEmbedContainer(fileEmbedData)

        await setImmediatePromise()

        expect(setStateSpy).toBeCalledWith({
            asset: {
                id: '123',
                url: 'http://asset'
            }
        })
    })

    it('should set asset from get asset', async () => {
        const setStateSpy = jest.spyOn(FileEmbedContainer.prototype, 'setState')

        store.getState = jest.fn(() => {
            return {
                permissions: {
                    canEdit: true
                },
                assets: {}
            }
        })

        PagesApiService.getAsset = jest.fn(() => {
            return {
                id: '123',
                url: 'http://asset'
            }
        })

        new FileEmbedContainer(fileEmbedData)

        await setImmediatePromise()

        expect(setStateSpy).toBeCalledWith({
            asset: {
                id: '123',
                url: 'http://asset'
            }
        })
    })

    it('should copy asset', async () => {
        FileEmbedContainer.prototype.setEmbedDataValue = jest.fn()

        const setStateSpy = jest.spyOn(FileEmbedContainer.prototype, 'setState')

        PagesApiService.copyAsset = jest.fn(() => {
            return {
                id: 'copy-asset',
                url: 'http://asset'
            }
        })

        PagesApiService.getAsset = jest.fn(() => {
            return {
                success: false
            }
        })

        store.getState = jest.fn(() => {
            return {
                permissions: {
                    canEdit: true
                },
                currentDocument: {
                    id: '1'
                },
                assets: {}
            }
        })

        const container = new FileEmbedContainer(fileEmbedData)

        await setImmediatePromise()

        expect(PagesApiService.copyAsset).toBeCalled()
        expect(container.setEmbedDataValue).toBeCalledWith('id', 'copy-asset')
        expect(setStateSpy).toBeCalledWith({
            asset: {
                id: 'copy-asset',
                url: 'http://asset'
            }
        })
    })

    it('should copy asset from url', async () => {
        FileEmbedContainer.prototype.setEmbedDataValue = jest.fn()

        const setStateSpy = jest.spyOn(FileEmbedContainer.prototype, 'setState')

        PagesApiService.copyAssetFromUrl = jest.fn(() => {
            return {
                id: 'copy-asset',
                url: 'http://asset'
            }
        })

        PagesApiService.getAsset = jest.fn(() => {
            return {
                success: false
            }
        })

        store.getState = jest.fn(() => {
            return {
                permissions: {
                    canEdit: true
                },
                currentDocument: {
                    id: '1'
                },
                assets: {}
            }
        })

        const embedData = {
            embedData: {},
            uuid: 'copy-asset',
            service: 'file',
            version: 1,
            authorId: '1'
        }

        const assetUrl =
            'https://assets.local.invision.works/assets/A_UUhjcVpLdFltdXhqSXV6QjyYr_vsDt0SMmyr9f2xb3ORlm7AW3i5gbp-x-OeXrdoadnaeU_lrWaJJnkJQ3hCdbfJgfX7p5Yt7HLCi_hALSwTT7JqejdIKcJhvUYPrXHhx'
        tempAssets.addAsset('copy-asset', assetUrl, TempAssetType.COPY)

        const container = new FileEmbedContainer(embedData)

        await setImmediatePromise()

        expect(PagesApiService.copyAssetFromUrl).toBeCalled()
        expect(container.setEmbedDataValue).toBeCalledWith('id', 'copy-asset')
        expect(setStateSpy).toBeCalledWith({
            asset: {
                id: 'copy-asset',
                url: 'http://asset'
            }
        })
    })
})
