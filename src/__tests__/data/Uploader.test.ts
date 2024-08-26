import Axios from 'axios'
import * as sinon from 'sinon'
import Uploader, { UploadManager } from '../../data/Uploader'
import PagesApiService from '../../data/services/PagesApiService'
import ApiHelper from '../../helpers/ApiHelper'
import { assertFirstCallArgs, assertSecondCallArgs } from '../utils'

describe('Uploader', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })

    it('should upload given files', async () => {
        const apiCall = sandbox.stub(Axios, 'post').resolves({ data: {} })

        const pagesApiRes = [
            {
                id: '1',
                url: 'http://assets-api/1',
                fileName: 'a.png'
            },
            {
                id: '1',
                url: 'http://assets-api/2',
                fileName: 'b.png'
            }
        ]
        sandbox
            .stub(PagesApiService, 'requestAssetsUpload')
            .resolves(pagesApiRes)
        sandbox
            .stub(PagesApiService, 'finishAssetsUpload')
            .resolves(pagesApiRes)

        const files = [
            new File(['a'], 'a.png', { type: 'image/jpeg' }),
            new File(['b'], 'b.png', { type: 'image/jpeg' })
        ]
        const assets = await new Uploader(files).upload()

        expect(assets).toEqual(pagesApiRes)

        const options = {
            headers: {
                'Content-Type': 'image/jpeg'
            }
        }
        assertFirstCallArgs(apiCall, 'http://assets-api/1', files[0], options)
        assertSecondCallArgs(apiCall, 'http://assets-api/2', files[1], options)
    })

    it('Restarts whole sequence if requestAssetsUpload fails and upload restarted', async () => {
        const files = [new File(['a'], 'a.png', { type: 'image/jpeg' })]

        const requestAssetsUploadSpy = sandbox
            .stub(PagesApiService, 'requestAssetsUpload')
            .rejects()

        const uploader = new Uploader(files)

        try {
            await uploader.doUploadProcess()
        } catch (e) {
            // it will reject
        } finally {
            sandbox.assert.calledOnce(requestAssetsUploadSpy)
        }

        try {
            await uploader.doUploadProcess()
        } catch (e) {
            // it will reject
        } finally {
            sandbox.assert.calledTwice(requestAssetsUploadSpy)
        }
    })

    it('Goes back to uploadAssets if uploadAssets fails and upload restarted', async () => {
        const files = [new File(['a'], 'a.png', { type: 'image/jpeg' })]

        const pagesApiRes = [
            {
                id: '1',
                url: 'http://assets-api/1',
                fileName: 'a.png'
            }
        ]

        const requestAssetsUploadSpy = sandbox
            .stub(PagesApiService, 'requestAssetsUpload')
            .resolves(pagesApiRes)

        const uploadAssetsSpy = sandbox
            .stub(ApiHelper, 'uploadAssets')
            .rejects()

        const uploader = new Uploader(files)

        try {
            await uploader.doUploadProcess()
        } catch (e) {
            // it will reject
        } finally {
            sandbox.assert.calledOnce(requestAssetsUploadSpy)
            sandbox.assert.calledOnce(uploadAssetsSpy)
        }

        try {
            await uploader.doUploadProcess()
        } catch (e) {
            // it will reject
        } finally {
            sandbox.assert.calledOnce(requestAssetsUploadSpy)
            sandbox.assert.calledTwice(uploadAssetsSpy)
        }
    })

    it('Goes back to finishUploads if finishUploads fails and upload restarted', async () => {
        const files = [new File(['a'], 'a.png', { type: 'image/jpeg' })]

        const pagesApiRes = [
            {
                id: '1',
                url: 'http://assets-api/1',
                fileName: 'a.png'
            }
        ]

        const requestAssetsUploadSpy = sandbox
            .stub(PagesApiService, 'requestAssetsUpload')
            .resolves(pagesApiRes)

        const uploadAssetsSpy = sandbox
            .stub(ApiHelper, 'uploadAssets')
            .resolves()

        const finishAssetsUploadSpy = sandbox
            .stub(PagesApiService, 'finishAssetsUpload')
            .rejects()

        const uploader = new Uploader(files)

        try {
            await uploader.doUploadProcess()
        } catch (e) {
            // it will reject
        } finally {
            sandbox.assert.calledOnce(requestAssetsUploadSpy)
            sandbox.assert.calledOnce(uploadAssetsSpy)
            sandbox.assert.calledOnce(finishAssetsUploadSpy)
        }

        try {
            await uploader.doUploadProcess()
        } catch (e) {
            // it will reject
        } finally {
            sandbox.assert.calledOnce(requestAssetsUploadSpy)
            sandbox.assert.calledOnce(uploadAssetsSpy)
            sandbox.assert.calledTwice(finishAssetsUploadSpy)
        }
    })
})

describe('UploaderManagerClass', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })

    it('should upload given files', async () => {
        const files = [new File(['a'], 'a.png', { type: 'image/jpeg' })]

        const assetsRes = [
            {
                id: '1',
                url: 'http://assets-api/1',
                fileName: 'a.png'
            }
        ]

        sandbox.stub(Uploader.prototype, 'upload').resolves(assetsRes)

        const uploadFinishedSpy = sandbox.spy(UploadManager, 'uploadFinished')

        await UploadManager.uploadFiles(files)

        sinon.assert.calledOnce(uploadFinishedSpy)
    })

    it('should allow for failed upload retries', async () => {
        const files = [new File(['a'], 'a.png', { type: 'image/jpeg' })]

        const assetsRes = [
            {
                id: '1',
                url: 'http://assets-api/1',
                fileName: 'a.png'
            }
        ]

        let resolveUploadPromise: any
        const uploadPromise = new Promise((resolve) => {
            resolveUploadPromise = resolve
        })

        const uploadSpy = sandbox
            .stub(Uploader.prototype, 'upload')
            .callsFake(() => uploadPromise)

        const uploadFinishedSpy = sandbox.spy(UploadManager, 'uploadFinished')

        UploadManager.uploadFiles(files)

        uploadSpy.callsFake(() => resolveUploadPromise(assetsRes))

        await UploadManager.retryFailedUploads()

        sinon.assert.calledTwice(uploadSpy)
        sinon.assert.calledOnce(uploadFinishedSpy)
    })
})
