import PagesApiService from './services/PagesApiService'

export default class ExternalDocument {
    public static async getDocument(service: string, serviceAssetId: string) {
        return new ExternalDocument(
            service,
            serviceAssetId
        ).getExternalDocument()
    }

    constructor(private service: string, private serviceAssetId: string) {}

    public async getExternalDocument() {
        const externalDocument = await PagesApiService.getExternalDocument(
            this.service,
            this.serviceAssetId
        )
        return externalDocument
    }
}
