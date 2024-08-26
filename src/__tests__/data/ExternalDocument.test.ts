import Axios from 'axios'
import * as sinon from 'sinon'
import ExternalDocument from '../../data/ExternalDocument'

describe('ThumbnailCreator', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })
    it('should get an external document', async () => {
        const externalDocument = { thumbnailUrl: 'img.png' }
        const apiCall = sandbox
            .stub(Axios, 'get')
            .resolves({ data: { externalDocument } })

        const thumbnailService = 'freehand-public'
        const thumbnailServiceAssetId = 'ABC123'

        const externalDocumentResponse = await ExternalDocument.getDocument(
            thumbnailService,
            thumbnailServiceAssetId
        )

        expect(apiCall.called).toBe(true)
        expect(externalDocumentResponse).toEqual({ ...externalDocument })
    })
})
