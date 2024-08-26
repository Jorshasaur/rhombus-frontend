import { EventEmitter } from 'events'
import PubSub from 'pubsub-js'
import ReconnectManager from '../../components/pages/Editor/ReconnectManager'
import { DOCUMENT_EVENT_RECONNECT } from '../../constants/topics'
import { bannerActionCreators, bannerSelectors } from '../../data/banner'
import { permissionsActionCreators } from '../../data/permissions'
import { BannerType } from '../../data/reducers/banner'
import store from '../../data/store'

class MockEmitter extends EventEmitter {}

describe('ReconnectManager', () => {
    beforeEach(() => {
        store.dispatch = jest.fn()
    })

    it('should handle disconnect and reconnect quillServerAdapter events', () => {
        const quillServerAdapter: any = {
            on: jest.fn()
        }
        PubSub.subscribe = jest.fn()

        new ReconnectManager(quillServerAdapter)
        expect(quillServerAdapter.on).toHaveBeenCalledWith(
            'reconnect',
            expect.any(Function)
        )
        expect(quillServerAdapter.on).toHaveBeenCalledWith(
            'disconnect',
            expect.any(Function)
        )
        expect(PubSub.subscribe).toHaveBeenCalledWith(
            DOCUMENT_EVENT_RECONNECT,
            expect.any(Function)
        )
    })

    it('should show warning and error messages on disconnect', () => {
        jest.useFakeTimers()

        bannerActionCreators.showConnectionLostWarning = jest.fn()
        bannerActionCreators.showConnectionLostError = jest.fn()
        permissionsActionCreators.setCommentOnlyPermissions = jest.fn()

        const quillServerAdapter: any = new MockEmitter()

        const reconnectManager = new ReconnectManager(quillServerAdapter)
        reconnectManager.updateQuillPermissions = jest.fn()

        quillServerAdapter.emit('disconnect')

        // it should first show warning message
        jest.runOnlyPendingTimers()

        expect(
            bannerActionCreators.showConnectionLostWarning
        ).toHaveBeenCalled()

        // and then it should show error message and set comment only permissions after another timeout
        jest.runOnlyPendingTimers()

        expect(bannerActionCreators.showConnectionLostError).toHaveBeenCalled()

        expect(
            permissionsActionCreators.setCommentOnlyPermissions
        ).toHaveBeenCalled()

        expect(reconnectManager.updateQuillPermissions).toHaveBeenCalled()
    })

    it('should show reconnect success message', () => {
        jest.useFakeTimers()

        permissionsActionCreators.setDocumentPermissions = jest.fn()
        bannerActionCreators.showReconnectSuccess = jest.fn()
        bannerActionCreators.hideBanner = jest.fn()

        const quillServerAdapter: any = new MockEmitter()

        const reconnectManager = new ReconnectManager(quillServerAdapter)
        reconnectManager.updateQuillPermissions = jest.fn()

        // it should show message after CONNECTION_LOST_WARN message
        bannerSelectors.getType = jest.fn(() => {
            return BannerType.CONNECTION_LOST_WARN
        })

        quillServerAdapter.emit('reconnect')

        expect(reconnectManager.updateQuillPermissions).toHaveBeenCalled()
        expect(
            permissionsActionCreators.setDocumentPermissions
        ).toHaveBeenCalled()

        expect(bannerActionCreators.showReconnectSuccess).toHaveBeenCalledTimes(
            1
        )

        jest.runOnlyPendingTimers()

        expect(bannerActionCreators.hideBanner).toHaveBeenCalled()

        // it should show message after CONNECTION_LOST_ERROR message
        bannerSelectors.getType = jest.fn(() => {
            return BannerType.CONNECTION_LOST_ERROR
        })

        quillServerAdapter.emit('reconnect')

        expect(bannerActionCreators.showReconnectSuccess).toHaveBeenCalledTimes(
            2
        )

        // it should show message after TRYING_RECONNECT message
        bannerSelectors.getType = jest.fn(() => {
            return BannerType.TRYING_RECONNECT
        })

        quillServerAdapter.emit('reconnect')

        expect(bannerActionCreators.showReconnectSuccess).toHaveBeenCalledTimes(
            3
        )

        // it should not show message when there wasn't reconnect banner before
        bannerSelectors.getType = jest.fn(() => {
            return
        })

        quillServerAdapter.emit('reconnect')

        expect(bannerActionCreators.showReconnectSuccess).toHaveBeenCalledTimes(
            3
        )
        expect(
            permissionsActionCreators.setDocumentPermissions
        ).toHaveBeenCalledTimes(4)
        expect(reconnectManager.updateQuillPermissions).toHaveBeenCalledTimes(4)
    })

    it('should handle forceReconnect', () => {
        jest.useFakeTimers()

        const mockEmitter = new MockEmitter()
        PubSub.subscribe = jest.fn((name, fn) => {
            mockEmitter.on(name, fn)
        })

        const quillServerAdapter: any = {
            on: jest.fn(),
            reconnect: jest.fn()
        }
        bannerActionCreators.showTryingReconnect = jest.fn()
        bannerActionCreators.showConnectionLostError = jest.fn()

        new ReconnectManager(quillServerAdapter)

        mockEmitter.emit(DOCUMENT_EVENT_RECONNECT)

        expect(bannerActionCreators.showTryingReconnect).toHaveBeenCalled()
        expect(quillServerAdapter.reconnect).toHaveBeenCalled()

        jest.runOnlyPendingTimers()

        expect(bannerActionCreators.showConnectionLostError).toHaveBeenCalled()
    })
})
