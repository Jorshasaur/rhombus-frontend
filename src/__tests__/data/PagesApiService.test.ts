import Axios from 'axios'
import * as sinon from 'sinon'
import {
    ACCESS_FAILURE,
    GENERIC_FAILURE
} from '../../components/pages/Editor/Blots/ServiceErrorEmbed/ServiceErrorMessages'
import { PagesApiService } from '../../data/services/PagesApiService'
import { threads } from '../mockData/threads'
import { assertFirstCallArgs, assertSecondCallArgs } from '../utils'

describe('PagesApiService', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })

    it('should call endpoint correct on pages-bff for getDocuments', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { documents: [] } })

        const service = new PagesApiService()
        const documents = await service.getDocuments()

        expect(documents).toEqual([])
        assertFirstCallArgs(
            apiCall,
            '/rhombus-bff/v1/documents',
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getDocumentMemberships', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { members: [] } })

        const service = new PagesApiService()
        service.documentId = '1'
        const members = await service.getDocumentMemberships()

        expect(members).toEqual([])
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}/memberships`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getCurrentDocumentWithContents', async () => {
        const apiCall = sandbox.stub(Axios, 'get').resolves({ data: {} })

        const service = new PagesApiService()
        const documentData = await service.getCurrentDocumentWithContents('1')

        expect(documentData).toEqual({})
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig({
                params: {
                    includeContents: true
                }
            })
        )
    })

    it('should call endpoint correct on pages-bff for getCurrentDocument', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { document: {} } })

        const service = new PagesApiService()
        const documentData = await service.getCurrentDocument('1')

        expect(documentData).toEqual({})
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getRevisionsSinceRevision', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { revisions: [] } })

        const service = new PagesApiService()
        const revision = 1
        const revisions = await service.getRevisionsSinceRevision(revision)

        expect(revisions).toEqual([])
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}/revisionsSinceRevision/${revision}`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getCurrentUser', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { user: { id: 1 } } })

        const service = new PagesApiService()
        const user = await service.getCurrentUser()

        expect(user).toEqual({ id: 1 })
        assertFirstCallArgs(
            apiCall,
            '/rhombus-bff/v1/users/whoami',
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for createDocument', async () => {
        const apiCall = sandbox
            .stub(Axios, 'post')
            .resolves({ data: { document: { id: 1 } } })

        const service = new PagesApiService()
        const document = await service.createDocument()

        expect(document).toEqual({ id: 1 })
        assertFirstCallArgs(
            apiCall,
            '/rhombus-bff/v1/documents/new',
            { title: 'Untitled' },
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for requestAssetsUpload', async () => {
        const apiCall = sandbox
            .stub(Axios, 'post')
            .resolves({ data: { assets: [] } })

        const service = new PagesApiService()
        const assetRequests = [{ fileName: 'test.png' }]
        const assets = await service.requestAssetsUpload(assetRequests)

        expect(assets).toEqual([])
        const url = `/rhombus-bff/v1/documents/${service.documentId}/assets/request-upload`
        assertFirstCallArgs(
            apiCall,
            url,
            { assets: assetRequests },
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for finishAssetsUpload', async () => {
        const apiCall = sandbox
            .stub(Axios, 'post')
            .resolves({ data: { assets: [] } })

        const service = new PagesApiService()
        const assetIds = ['1']
        const assets = await service.finishAssetsUpload(assetIds)

        expect(assets).toEqual([])
        const url = `/rhombus-bff/v1/documents/${service.documentId}/assets/finish-upload`
        assertFirstCallArgs(
            apiCall,
            url,
            { assetIds },
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getAssets', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { assets: [] } })

        const service = new PagesApiService()
        const assets = await service.getAssets()

        expect(assets).toEqual([])
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}/assets/`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getAsset', async () => {
        const apiCall = sandbox.stub(Axios, 'get').resolves({ data: {} })

        const service = new PagesApiService()
        const assetId = '1'
        const asset = await service.getAsset(assetId)

        expect(asset).toEqual({})
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}/assets/${assetId}`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should get an external document from from pages-bff', async () => {
        const externalDocument = { thumbnailUrl: 'img.png' }
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { externalDocument } })

        const service = new PagesApiService()
        const thumbnailService = 'freehand-public'
        const thumbnailServiceAssetId = 'ABC123'
        const thumbnail = await service.getExternalDocument(
            thumbnailService,
            thumbnailServiceAssetId
        )

        expect(thumbnail).toEqual({ ...externalDocument })
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/documents/${service.documentId}/assets/external-document/${thumbnailService}/${thumbnailServiceAssetId}`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for getAllTeamMembers', async () => {
        const members = [
            {
                id: 1,
                userId: 3,
                teamId: 0,
                name: 'A team member',
                email: 'noone@nowhere',
                avatarId: 'Nope',
                avatarUrl: 'howdy.jpg'
            }
        ]
        const apiCall = sandbox.stub(Axios, 'get').resolves({ data: members })
        const service = new PagesApiService()
        const memberResponse = await service.getAllTeamMembers()
        expect(memberResponse).toHaveLength(1)
        expect(memberResponse[0].userId).toEqual(3)
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/teams/members`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })
    it('should correctly call createComment on pages-bff', async () => {
        const threadId = '1234'
        const comment = 'This is a new comment'
        const data = {
            commentId: 'cjgcqsmin00039tt399ghfgyt',
            threadId,
            message: 'Comment saved!'
        }
        const apiCall = sandbox.stub(Axios, 'post').resolves({ data })

        const service = new PagesApiService()
        const newCommentResponse = await service.createComment(
            threadId,
            comment
        )

        expect(newCommentResponse).toEqual(data)
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v2/documents/${service.documentId}/conversations/threads/${threadId}/comments`,
            { comment },
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should correctly call getAllThreads on pages-bff', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { threads } })

        const service = new PagesApiService()
        const assets = await service.getAllThreads()

        expect(assets).toEqual(threads)
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v2/documents/${service.documentId}/conversations`,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should correctly call resolveThread on pages-bff', async () => {
        const apiCall = sandbox
            .stub(Axios, 'post')
            .resolves({ data: { success: true } })

        const service = new PagesApiService()
        const result = await service.resolveThread('123')

        expect(result.success).toEqual(true)
        const url = `/rhombus-bff/v2/documents/${service.documentId}/conversations/threads/123/resolve`
        // @ts-ignore Allow access to private method
        assertFirstCallArgs(apiCall, url, {}, service._getRequestConfig())
    })

    it('should correctly call KeepAlive on pages-bff', async () => {
        const apiCall = sandbox.stub(Axios, 'get').resolves()

        const service = new PagesApiService()
        const result = await service.keepAlive()
        expect(result.success).toEqual(true)
        const url = `/rhombus-bff/v1/keep-alive`
        // @ts-ignore Allow access to private method
        assertFirstCallArgs(apiCall, url, service._getRequestConfig())
    })

    it('should correctly fail KeepAlive on pages-bff', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .rejects({ response: { status: 401 } })

        const service = new PagesApiService()
        const result = await service.keepAlive()
        expect(result.success).toEqual(false)
        expect(result.status).toEqual(401)
        const url = `/rhombus-bff/v1/keep-alive`
        // @ts-ignore Allow access to private method
        assertFirstCallArgs(apiCall, url, service._getRequestConfig())
    })

    it('should correctly call subscribe on pages-bff', async () => {
        Axios.post = jest.fn(() => {
            return { data: { success: true } }
        })

        const service = new PagesApiService()
        const document = await service.subscribeToDocument()

        const url = `/rhombus-bff/v1/documents/${service.documentId}/subscribe`

        expect(document).toEqual({ success: true })
        // @ts-ignore Allow access to private method
        expect(Axios.post).toBeCalledWith(url, {}, service._getRequestConfig())
    })

    it('should correctly call unsubscribe on pages-bff', async () => {
        Axios.post = jest.fn(() => {
            return { data: { success: true } }
        })

        const service = new PagesApiService()
        const document = await service.unsubscribeFromDocument()

        const url = `/rhombus-bff/v1/documents/${service.documentId}/unsubscribe`

        expect(document).toEqual({ success: true })
        // @ts-ignore Allow access to private method
        expect(Axios.post).toBeCalledWith(url, {}, service._getRequestConfig())
    })

    it('should successfully get revisions from pages-bff', async () => {
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { success: true } })
        const service = new PagesApiService()
        const revisionsResponse = await service.getRevisions()

        const url = `/rhombus-bff/v2/documents/${service.documentId}/revisions`

        expect(revisionsResponse).toEqual({ success: true })
        // @ts-ignore Allow access to private method
        assertFirstCallArgs(
            apiCall,
            url,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })
    it('should successfully get the content at a revision from pages-bff', async () => {
        const revisionNumber = 53
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { success: true } })
        const service = new PagesApiService()
        const content = await service.getContentAtRevision(revisionNumber)

        const url = `/rhombus-bff/v2/documents/${service.documentId}/revisions/${revisionNumber}`

        expect(content).toEqual({ success: true })
        // @ts-ignore Allow access to private method
        assertFirstCallArgs(
            apiCall,
            url,
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    it('should call endpoint correct on pages-bff for duplicatePane', async () => {
        const apiCall = sandbox.stub(Axios, 'post').resolves({ data: {} })

        const service = new PagesApiService()
        const documentData = await service.duplicatePane('1', '5')

        expect(documentData).toEqual({})
        assertFirstCallArgs(
            apiCall,
            `/rhombus-bff/v1/panes/1/duplicate`,
            { documentId: '5' },
            // @ts-ignore Allow access to private method
            service._getRequestConfig()
        )
    })

    describe('getFreehand', () => {
        it('should call endpoints correctly on pages-bff', async () => {
            const slugType = 'private'
            const slug = 'slug'

            const freehandDataResponse = {
                success: true,
                content: new ArrayBuffer(1),
                name: 'name',
                updatedAt: 'updatedAt',
                assets: {
                    '49f85e74-a7b8-44e1-a7e0-f2d700d9f795':
                        'http://google.com/some-image.png'
                }
            }

            const apiCall = sandbox
                .stub(Axios, 'get')
                .onFirstCall()
                .resolves({ data: freehandDataResponse.content })
                .onSecondCall()
                .resolves({
                    data: {
                        success: freehandDataResponse.success,
                        name: freehandDataResponse.name,
                        updatedAt: freehandDataResponse.updatedAt
                    }
                })
                .onThirdCall()
                .resolves({
                    data: freehandDataResponse.assets
                })

            const service = new PagesApiService()
            const freehandData = await service.getFreehand(slugType, slug)

            expect(freehandData).toEqual(freehandDataResponse)
            assertFirstCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig({
                    responseType: 'arraybuffer'
                })
            )
            assertSecondCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand_meta_data/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig()
            )
        })

        it('should return an error message on for a permission error', async () => {
            const slugType = 'private'
            const slug = 'slug'

            const freehandDataResponse = {
                success: false,
                error: ACCESS_FAILURE
            }

            const apiCall = sandbox.stub(Axios, 'get').resolves({
                data: freehandDataResponse
            })

            const service = new PagesApiService()
            const freehandData = await service.getFreehand(slugType, slug)

            expect(freehandData).toEqual(freehandDataResponse)
            assertFirstCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig({
                    responseType: 'arraybuffer'
                })
            )
            assertSecondCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand_meta_data/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig()
            )
        })

        it('should return an empty success-like state on a 404', async () => {
            const slugType = 'private'
            const slug = 'slug'

            const freehandDataResponse = {
                success: true,
                content: null,
                name: null,
                id: '',
                updatedAt: null
            }

            const apiCall = sandbox.stub(Axios, 'get').rejects({
                response: { status: 404 }
            })

            const service = new PagesApiService()
            const freehandData = await service.getFreehand(slugType, slug)

            expect(freehandData).toEqual(freehandDataResponse)
            assertFirstCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig({
                    responseType: 'arraybuffer'
                })
            )
            assertSecondCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand_meta_data/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig()
            )
        })

        it('should return a generic error message on other errors', async () => {
            const slugType = 'private'
            const slug = 'slug'

            const freehandDataResponse = {
                success: false,
                error: GENERIC_FAILURE
            }

            const apiCall = sandbox.stub(Axios, 'get').rejects({
                response: { status: 500 }
            })

            const service = new PagesApiService()
            const freehandData = await service.getFreehand(slugType, slug)

            expect(freehandData).toEqual(freehandDataResponse)
            assertFirstCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig({
                    responseType: 'arraybuffer'
                })
            )
            assertSecondCallArgs(
                apiCall,
                `/rhombus-bff/v1/documents/${service.documentId}/assets/freehand_meta_data/${slugType}/${slug}`,
                // @ts-ignore Allow access to private method
                service._getRequestConfig()
            )
        })
    })
})
