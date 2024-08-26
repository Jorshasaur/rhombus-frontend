import axios, { AxiosError, AxiosRequestConfig, CancelToken } from 'axios'
import axiosRetry from 'axios-retry'
import bugsnag from '../../bugsnag'
import {
    ACCESS_FAILURE,
    GENERIC_FAILURE
} from '../../components/pages/Editor/Blots/ServiceErrorEmbed/ServiceErrorMessages'
import { Asset } from '../../interfaces/asset'
import { Document } from '../../interfaces/document'
import { DocumentContents } from '../../interfaces/documentContents'
import { DocumentHistoryRevision } from '../../interfaces/documentHistoryRevision'
import { ExternalDocument } from '../../interfaces/externalDocument'
import { Member } from '../../interfaces/member'
import { Permissions } from '../../interfaces/permissions'
import { Revision, RawJSON1ServerRevision } from '../../interfaces/revision'
import { Thread } from '../../interfaces/thread'
import { User } from '../../interfaces/user'
import { AXIOS_RETRY } from '../../constants/network'
import { Pane } from '../panes/Advil'
import { FeatureFlags } from '../reducers/featureFlags'
import {
    CreateFreehandResponse,
    FreehandDocumentSuccess,
    FreehandMetaData,
    FreehandResponse,
    FreehandsResponse
} from './FreehandResponseTypes'

export interface AssetRequest {
    fileName: string
}

interface AssetsResponse {
    assets: Asset[]
}

interface DocumentResponse {
    document: Document
}

interface UnarchiveDocumentResponse {
    success: boolean
}
interface ArchiveDocumentResponse {
    success: boolean
}

interface SuccessResponse {
    success: boolean
}

interface DocumentResponseWithContents {
    document: Document
    contents: DocumentContents
    permissions: Permissions
    isSubscribed: boolean
}

interface DocumentsResponse {
    documents: Document[]
}

interface UserResponse {
    user: User
}

interface MembershipsResponse {
    members: Member[]
}

interface RevisionsResponse {
    revisions: Revision[]
}

interface PanesRevisionsResponse {
    revisions: RawJSON1ServerRevision[]
}

interface ThumbnailResponse {
    externalDocument: ExternalDocument
}

interface CreateThreadResponse {
    commentId: string
    threadId: string
}

interface CreateCommentResponse {
    commentId: string
    threadId: string
}

interface ResolveThreadResponse {
    success: boolean
    message: string
}

interface KeepAliveResponse {
    success: boolean
    status?: number
}

interface GetDocumentAtRevisionResponse {
    success: boolean
    contents: DocumentContents
}

export interface SubmitOperationData {
    documentId: string
    revision: number
    operation: any
    submissionId: string
}
export interface SubmitPaneOperationData extends SubmitOperationData {
    paneId: string
    type: string
}

export interface GetThreadsResponse {
    message: string
    success: boolean
    threads: Thread[]
}

export interface CommentMention {
    token: string
    userId: number
}

export interface NewPaneResponse {
    id: string
}

interface PaneContentsResponse {
    revision: number
    contents: Pane
}

// retry 3 times if an error ocurred.
axiosRetry(axios, {
    retries: AXIOS_RETRY,
    retryDelay: (i) => {
        return i * 1000
    }
})

axios.interceptors.response.use(undefined, function(error: AxiosError) {
    const { response, config } = error
    const newResponse: any = {}
    const newConfig: any = {
        url: config.url,
        method: config.method,
        headers: config.headers
    }

    if (config.url != null && !config.url.includes('conversations')) {
        newConfig.data = config.data
    }

    if (response != null) {
        // @todo: Only ignore 404 when a document is missing
        if (response.status === 404) {
            return Promise.reject(error)
        }

        newResponse.status = response.status
        newResponse.statusText = response.statusText
        newResponse.headers = response.headers

        if (response.data != null && response.data.message) {
            newResponse.dataMessage = response.data.message
        }
    }

    bugsnag.notify(error, {
        metadata: {
            response: newResponse,
            config: newConfig
        }
    })

    return Promise.reject(error)
})

export class PagesApiService {
    defaults: AxiosRequestConfig
    public documentId: string

    constructor() {
        this.defaults = {
            headers: {
                'Request-Source': 'rhombus_ui'
            }
        }
    }

    private _getRequestConfig(options: AxiosRequestConfig = {}) {
        if (process.env.NODE_ENV === 'development') {
            Object.assign(options, {
                baseURL: window.INVISION_ENV.PAGES_WEB
            })
        }
        return Object.assign(options, this.defaults)
    }

    public async getDocuments() {
        const res = await axios.get<DocumentsResponse>(
            '/rhombus-bff/v1/documents',
            this._getRequestConfig()
        )
        return res.data.documents
    }

    public async archiveDocument(documentId: string) {
        const res = await axios.post<ArchiveDocumentResponse>(
            `/rhombus-bff/v1/documents/${documentId}/archive`,
            {},
            this._getRequestConfig()
        )
        return res.data
    }

    public async getDocumentMemberships() {
        const res = await axios.get<MembershipsResponse>(
            `/rhombus-bff/v1/documents/${this.documentId}/memberships`,
            this._getRequestConfig()
        )
        return res.data.members
    }
    public async unarchiveDocument() {
        const res = await axios.post<UnarchiveDocumentResponse>(
            `/rhombus-bff/v1/documents/${this.documentId}/unarchive`,
            {},
            this._getRequestConfig()
        )

        return res.data
    }
    public async getCurrentDocument(documentId?: string) {
        if (documentId != null) {
            this.documentId = documentId
        }

        const res = await axios.get<DocumentResponse>(
            `/rhombus-bff/v1/documents/${this.documentId}`,
            this._getRequestConfig()
        )
        return res.data.document
    }

    public async getCurrentDocumentWithContents(documentId?: string) {
        if (documentId != null) {
            this.documentId = documentId
        }

        const options: AxiosRequestConfig = {
            params: {
                includeContents: true
            }
        }

        const res = await axios.get<DocumentResponseWithContents>(
            `/rhombus-bff/v1/documents/${this.documentId}`,
            this._getRequestConfig(options)
        )
        return res.data
    }

    public async getPaneContents(paneId: string) {
        const options: AxiosRequestConfig = {
            params: {
                documentId: this.documentId
            }
        }
        const res = await axios.get<PaneContentsResponse>(
            `/rhombus-bff/v1/panes/${paneId}`,
            this._getRequestConfig(options)
        )
        return res.data
    }

    public async getRevisionsSinceRevision(revision: number) {
        const res = await axios.get<RevisionsResponse>(
            `/rhombus-bff/v1/documents/${this.documentId}/revisionsSinceRevision/${revision}`,
            this._getRequestConfig()
        )
        return res.data.revisions
    }

    public async getPanesRevisionsSinceRevision(
        paneId: string,
        revision: number
    ) {
        const options: AxiosRequestConfig = {
            params: {
                documentId: this.documentId
            }
        }
        const res = await axios.get<PanesRevisionsResponse>(
            `/rhombus-bff/v1/panes/${paneId}/revisionsSinceRevision/${revision}`,
            this._getRequestConfig(options)
        )
        return res.data.revisions
    }

    public async getCurrentUser() {
        const res = await axios.get<UserResponse>(
            '/rhombus-bff/v1/users/whoami',
            this._getRequestConfig()
        )
        return res.data.user
    }

    public async createDocument(title: string = 'Untitled') {
        const res = await axios.post<DocumentResponse>(
            '/rhombus-bff/v1/documents/new',
            { title },
            this._getRequestConfig()
        )
        return res.data.document
    }

    public async requestAssetsUpload(
        assetRequests: AssetRequest[]
    ): Promise<Asset[]> {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/request-upload`

        const res = await axios.post<AssetsResponse>(
            url,
            { assets: assetRequests },
            this._getRequestConfig()
        )
        return res.data.assets
    }

    public async finishAssetsUpload(assetIds: string[]): Promise<Asset[]> {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/finish-upload`

        const res = await axios.post<AssetsResponse>(
            url,
            { assetIds },
            this._getRequestConfig()
        )
        return res.data.assets
    }

    public async copyAsset(assetId: string): Promise<Asset> {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/copy`
        const res = await axios.post<Asset>(
            url,
            { assetId },
            this._getRequestConfig()
        )
        return res.data
    }

    public async copyAssetFromUrl(assetUrl: string) {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/copy-from-url`
        const res = await axios.post<Asset>(
            url,
            { assetUrl },
            this._getRequestConfig()
        )
        return res.data
    }

    public async getAssets(): Promise<Asset[]> {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/`
        const res = await axios.get<AssetsResponse>(
            url,
            this._getRequestConfig()
        )
        return res.data.assets
    }

    public async getAsset(id: string) {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/${id}`
        try {
            const res = await axios.get<Asset>(url, this._getRequestConfig())
            return res.data
        } catch (err) {
            return
        }
    }

    public async getExternalDocument(
        service: string,
        serviceAssetId: string
    ): Promise<ExternalDocument> {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/external-document/${service}/${serviceAssetId}`
        const res = await axios.get<ThumbnailResponse>(
            url,
            this._getRequestConfig()
        )
        return res.data.externalDocument
    }

    public async getFreehand(
        slugType: 'private' | 'public',
        slug: string
    ): Promise<FreehandResponse> {
        const freehandUrl = `/rhombus-bff/v1/documents/${this.documentId}/assets/freehand/${slugType}/${slug}`

        const freehandMetaDataUrl = `/rhombus-bff/v1/documents/${this.documentId}/assets/freehand_meta_data/${slugType}/${slug}`
        try {
            const [content, metaData] = await Promise.all([
                axios.get<ArrayBuffer>(
                    freehandUrl,
                    this._getRequestConfig({
                        responseType: 'arraybuffer'
                    })
                ),
                axios.get<FreehandMetaData>(
                    freehandMetaDataUrl,
                    this._getRequestConfig()
                )
            ])

            if (!metaData.data.success) {
                return {
                    success: false,
                    error: ACCESS_FAILURE
                }
            }

            const freehandAssetsUrl = `/rhombus-bff/v1/documents/${this.documentId}/assets/freehand_assets/${metaData.data.id}`

            const { data: assets } = await axios.get<any>(
                freehandAssetsUrl,
                this._getRequestConfig()
            )

            return {
                ...metaData.data,
                content: content.data,
                assets
            }
        } catch (error) {
            if (error.response.status === 404) {
                return {
                    success: true,
                    content: null,
                    name: null,
                    id: '',
                    updatedAt: null
                }
            }

            return {
                success: false,
                error: GENERIC_FAILURE
            }
        }
    }

    public async getFreehands(): Promise<FreehandsResponse> {
        const freehandsUrl = `/rhombus-bff/v1/freehands/documents`

        try {
            const res = await axios.get<FreehandDocumentSuccess[]>(
                freehandsUrl,
                this._getRequestConfig()
            )

            return {
                success: true,
                freehands: res.data
            }
        } catch (error) {
            return {
                success: false,
                error: GENERIC_FAILURE
            }
        }
    }

    public async createFreehand(name: string): Promise<CreateFreehandResponse> {
        const url = `/rhombus-bff/v1/freehands/create`

        try {
            const res = await axios.post<FreehandDocumentSuccess>(
                url,
                { name },
                this._getRequestConfig()
            )

            return {
                success: true,
                freehand: res.data
            }
        } catch (error) {
            return {
                success: false,
                error: GENERIC_FAILURE
            }
        }
    }

    public async submitOperation(
        data: SubmitOperationData,
        cancelToken?: CancelToken
    ): Promise<any> {
        const url = `/rhombus-bff/v1/operations/submit`

        let options = {}
        if (cancelToken != null) {
            options = { cancelToken }
        }

        return axios.post<any>(url, { data }, this._getRequestConfig(options))
    }

    public async submitPanesOperation(
        data: SubmitPaneOperationData,
        cancelToken?: CancelToken
    ): Promise<any> {
        const url = `/rhombus-bff/v1/operations/submit`

        let options = {}
        if (cancelToken != null) {
            options = { cancelToken }
        }

        return axios.post<any>(url, { data }, this._getRequestConfig(options))
    }

    public async getAllTeamMembers(): Promise<Member[]> {
        const url = `/rhombus-bff/v1/teams/members`
        const res = await axios.get<Member[]>(url, this._getRequestConfig())
        return res.data
    }

    public async getAllThreads(): Promise<Thread[]> {
        const url = `/rhombus-bff/v2/documents/${this.documentId}/conversations`
        const res = await axios.get<GetThreadsResponse>(
            url,
            this._getRequestConfig()
        )
        return res.data.threads
    }

    public async createThread(markId: string, comment: string) {
        const url = `/rhombus-bff/v2/documents/${this.documentId}/conversations/threads`
        const res = await axios.post<CreateThreadResponse>(
            url,
            { markId, comment },
            this._getRequestConfig()
        )

        return res.data
    }

    public async createComment(threadId: string, comment: string) {
        const url = `/rhombus-bff/v2/documents/${this.documentId}/conversations/threads/${threadId}/comments`
        const res = await axios.post<CreateCommentResponse>(
            url,
            { comment },
            this._getRequestConfig()
        )

        return res.data
    }

    public async resolveThread(threadId: string) {
        const url = `/rhombus-bff/v2/documents/${this.documentId}/conversations/threads/${threadId}/resolve`
        const res = await axios.post<ResolveThreadResponse>(
            url,
            {},
            this._getRequestConfig()
        )
        return res.data
    }

    public async keepAlive(): Promise<KeepAliveResponse> {
        try {
            await axios.get(
                '/rhombus-bff/v1/keep-alive',
                this._getRequestConfig()
            )
            return {
                success: true
            }
        } catch (err) {
            return {
                success: false,
                status: err.response && err.response.status
            }
        }
    }

    public async subscribeToDocument() {
        const res = await axios.post<SuccessResponse>(
            `/rhombus-bff/v1/documents/${this.documentId}/subscribe`,
            {},
            this._getRequestConfig()
        )
        return res.data
    }

    public async unsubscribeFromDocument() {
        const res = await axios.post<SuccessResponse>(
            `/rhombus-bff/v1/documents/${this.documentId}/unsubscribe`,
            {},
            this._getRequestConfig()
        )

        return res.data
    }

    public async getFeatureFlags() {
        const res = await axios.get<FeatureFlags>(
            `/rhombus-bff/v1/feature-flags`,
            this._getRequestConfig()
        )
        return res.data
    }

    // TODO: Combine the following three flat prototype calls into one: https://invisionapp.atlassian.net/browse/SLATE-1359

    private async _fetchPrototype(url: string) {
        try {
            const res = await axios.get<any>(url, this._getRequestConfig())
            return res.data
        } catch (error) {
            switch (error.response.status) {
                case 404:
                    return {}
                case 403:
                    return {
                        success: false,
                        error: ACCESS_FAILURE
                    }
                default:
                    return {
                        success: false,
                        error: GENERIC_FAILURE
                    }
            }
        }
    }

    public async getFlatPrototypeByScreen(hash: string, screenHash: string) {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/flat-prototype/${hash}/screen/${screenHash}`

        return this._fetchPrototype(url)
    }
    public async getFlatPrototypeByHash(hash: string) {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/flat-prototype/${hash}`

        return this._fetchPrototype(url)
    }
    public async getFlatPrototypeByShareKey(shareKey: string) {
        const url = `/rhombus-bff/v1/documents/${this.documentId}/assets/flat-prototype/share/${shareKey}`

        return this._fetchPrototype(url)
    }

    public async getRevisions() {
        const res = await axios.get<DocumentHistoryRevision[]>(
            `/rhombus-bff/v2/documents/${this.documentId}/revisions`,
            this._getRequestConfig()
        )
        return res.data
    }

    public async getContentAtRevision(revision: number) {
        const res = await axios.get<GetDocumentAtRevisionResponse>(
            `/rhombus-bff/v2/documents/${this.documentId}/revisions/${revision}`,
            this._getRequestConfig()
        )
        return res.data
    }
    public async createPane() {
        const url = `/rhombus-bff/v1/panes`
        const res = await axios.post<NewPaneResponse>(
            url,
            { documentId: this.documentId },
            this._getRequestConfig()
        )

        return res.data
    }

    public async duplicatePane(paneId: string, newDocumentId: string) {
        const url = `/rhombus-bff/v1/panes/${paneId}/duplicate`
        const res = await axios.post<NewPaneResponse>(
            url,
            { documentId: newDocumentId },
            this._getRequestConfig()
        )

        return res.data
    }
}

export default new PagesApiService()
