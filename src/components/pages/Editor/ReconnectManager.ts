import PubSub from 'pubsub-js'
import {
    CONNECTION_LOST_MESSAGE_TIMEOUT,
    HIDE_SUCCESS_BANNER_TIMEOUT
} from '../../../constants/styles'
import { DOCUMENT_EVENT_RECONNECT } from '../../../constants/topics'
import { bannerActionCreators, bannerSelectors } from '../../../data/banner'
import { documentSelectors } from '../../../data/document'
import {
    permissionsActionCreators,
    permissionsSelectors
} from '../../../data/permissions'
import { BannerType } from '../../../data/reducers/banner'
import store from '../../../data/store'
import { UploadManager } from '../../../data/Uploader'
import { updateQuillPermissions } from '../../quill/modules/Permissions'
import { QuillSocketIOAdapter } from '../../quill/QuillSocketIOAdapter'

export default class ReconnectManager {
    private connectionLostTimeout: any
    private forceReconnectToken?: string

    constructor(private quillServerAdapter: QuillSocketIOAdapter) {
        this.attach()
    }

    attach() {
        this.forceReconnectToken = PubSub.subscribe(
            DOCUMENT_EVENT_RECONNECT,
            this.forceReconnect
        )
        this.quillServerAdapter.on('reconnect', this.handleReconnect)
        this.quillServerAdapter.on('disconnect', this.handleDisconnect)
    }

    detach() {
        if (this.forceReconnectToken != null) {
            PubSub.unsubscribe(this.forceReconnectToken)
        }
        this.quillServerAdapter.off('reconnect', this.handleReconnect)
        this.quillServerAdapter.off('disconnect', this.handleDisconnect)
    }

    forceReconnect = () => {
        store.dispatch(bannerActionCreators.showTryingReconnect())

        this.quillServerAdapter.reconnect()
        this.connectionLostTimeout = setTimeout(() => {
            store.dispatch(bannerActionCreators.showConnectionLostError())
        }, CONNECTION_LOST_MESSAGE_TIMEOUT)
    }

    handleDisconnect = () => {
        this.connectionLostTimeout = setTimeout(() => {
            store.dispatch(bannerActionCreators.showConnectionLostWarning())

            this.connectionLostTimeout = setTimeout(() => {
                store.dispatch(bannerActionCreators.showConnectionLostError())
                store.dispatch(
                    permissionsActionCreators.setCommentOnlyPermissions()
                )
                this.updateQuillPermissions()
            }, CONNECTION_LOST_MESSAGE_TIMEOUT)
        }, CONNECTION_LOST_MESSAGE_TIMEOUT)
    }

    updateQuillPermissions() {
        const state = store.getState()
        const {
            canEdit,
            canComment
        } = permissionsSelectors.getDocumentPermissions(state)!

        updateQuillPermissions({
            canEdit,
            canComment,
            isArchived: documentSelectors.getIsArchived(state)
        })
    }

    handleReconnect = () => {
        clearTimeout(this.connectionLostTimeout)

        store.dispatch(permissionsActionCreators.setDocumentPermissions())
        this.updateQuillPermissions()

        UploadManager.retryFailedUploads()

        const bannerType = bannerSelectors.getType(store.getState())

        if (
            bannerType === BannerType.CONNECTION_LOST_WARN ||
            bannerType === BannerType.CONNECTION_LOST_ERROR ||
            bannerType === BannerType.TRYING_RECONNECT
        ) {
            store.dispatch(bannerActionCreators.showReconnectSuccess())

            setTimeout(() => {
                store.dispatch(bannerActionCreators.hideBanner())
            }, HIDE_SUCCESS_BANNER_TIMEOUT)
        }
    }
}
