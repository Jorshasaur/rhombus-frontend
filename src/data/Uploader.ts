import PagesApiService, { AssetRequest } from './services/PagesApiService'
import { Asset } from '../interfaces/asset'
import { remove } from 'lodash'
import ApiHelper from '../helpers/ApiHelper'

export default class Uploader {
    private inProgress: boolean = false
    private doneGettingAssetUploadUrls: boolean = false
    private assetsForUpload: Asset[]
    private doneUploadingAssets: boolean = false
    private finishedUploading: boolean = false
    private resolve: Function
    private completedPromise: Promise<Asset[]> = new Promise((resolve) => {
        this.resolve = resolve
    })

    constructor(private files: File[]) {}

    public async upload() {
        if (this.inProgress) {
            return this.completedPromise
        }

        this.inProgress = true

        try {
            this.doUploadProcess()
        } catch (e) {
            console.log('Failed upload. Will retry', e)
            // swallow errors to allow for retry
        } finally {
            this.inProgress = false
        }

        return this.completedPromise
    }

    public async doUploadProcess() {
        if (!this.doneGettingAssetUploadUrls) {
            const assetRequests = this.getAssetRequests()
            this.assetsForUpload = await PagesApiService.requestAssetsUpload(
                assetRequests
            )
            this.doneGettingAssetUploadUrls = true
        }

        if (!this.doneUploadingAssets && this.assetsForUpload) {
            await ApiHelper.uploadAssets(this.assetsForUpload, this.files)
            this.doneUploadingAssets = true
        }

        if (!this.finishedUploading && this.assetsForUpload) {
            const finishedAssets = await this.finishUploads(
                this.assetsForUpload
            )
            this.finishedUploading = true
            this.resolve(finishedAssets)
        }
    }

    private async finishUploads(assets: Asset[]) {
        const assetIds = assets.map((asset) => {
            return asset.id
        })
        return PagesApiService.finishAssetsUpload(assetIds)
    }

    private getAssetRequests(): AssetRequest[] {
        return this.files.map(
            (file): AssetRequest => {
                return { fileName: file.name }
            }
        )
    }
}

class UploadManagerClass {
    uploaders: Uploader[]

    constructor() {
        this.uploaders = []
    }

    allUploadsCompleted() {
        return this.uploaders.length === 0
    }

    uploadFinished = (assets: Asset[], uploader: Uploader) => {
        remove(this.uploaders, uploader)
        return assets
    }

    public async uploadFiles(files: File[]) {
        const uploader = new Uploader(files)
        this.uploaders.push(uploader)
        return uploader.upload().then((assets: Asset[]) => {
            return this.uploadFinished(assets, uploader)
        })
    }

    public async retryFailedUploads() {
        const retryPromises = this.uploaders.map((uploader: Uploader) => {
            return uploader.upload()
        })
        return Promise.all(retryPromises)
    }
}

export const UploadManager = new UploadManagerClass()
