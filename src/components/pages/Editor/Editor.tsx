// Quill CSS
import '!style-loader!css-loader!quill-cursors/dist/quill-cursors.css'
import { Alert, Modal, Toast } from '@invisionapp/helios'
import cx from 'classnames'
import FontFaceObserver from 'fontfaceobserver'
import Cookie from 'js-cookie'
import { debounce, endsWith, find, get, result, startsWith } from 'lodash'
import PubSub from 'pubsub-js'
import Delta from 'quill-delta'
// Libs
import React from 'react'
import DocumentTitle from 'react-document-title'
import { RouteComponentProps } from 'react-router-dom'
import { AnyAction } from 'redux'
import setImmediatePromise from 'set-immediate-promise'
import { DndProvider } from 'react-dnd'
import ReactDndHTML5Backend from 'react-dnd-html5-backend'
import analytics from '../../../analytics/analytics'
import styles from '../../../assets/css/App.module.css'
import '../../../assets/css/common/emoji.module.css'
import '../../../assets/css/common/quill.css'
import bugsnag from '../../../bugsnag'
import { GET_UPDATED_THREADS_DELAY } from '../../../constants/comments'
import { BLOCK_EMBED_BLOT_NAME } from '../../../constants/embeds'
import {
    IS_END_TO_END_TEST,
    MAIN_EDITOR_ID,
    RHOMBUS_PRIVACY_COOKIE_KEY,
    UPDATING_DOCUMENT_DEBOUNCE
} from '../../../constants/general'
import { MENTION_TYPES } from '../../../constants/mentions'
import {
    DEFAULT_PAGE_REFRESH_MESSAGE,
    PAGE_REFRESH_MESSAGE_WITH_USER,
    UNSAVED_CHANGES_MESSAGE
} from '../../../constants/messages'
import { KEEP_ALIVE_REQUEST_INTERVAL, SOCKET } from '../../../constants/network'
import { COMMENT_MARKING_MODULE_NAME } from '../../../constants/quill-modules'
import { BANNER_HEIGHT } from '../../../constants/styles'
import {
    DOCUMENT_CHANGE_UPDATE,
    DOCUMENT_EVENT_RESET
} from '../../../constants/topics'
import {
    closePlusMenu,
    fetchAllThreads,
    fetchCurrentDocument,
    fetchFeatureFlags,
    fetchTeamMembers,
    fetchUser,
    formatSelection as formatSelectionAction,
    openPlusMenu,
    setMembers,
    setPermissions,
    setTitle,
    setUpdatedAt
} from '../../../data/actions'
import {
    BannerColor,
    BannerPosition,
    BannerState,
    BannerType
} from '../../../data/reducers/banner'
import { CurrentDocumentState } from '../../../data/reducers/currentDocument'
import { MentionsState } from '../../../data/reducers/mentions'
import { PermissionsState } from '../../../data/reducers/permissions'
import * as selectionReducer from '../../../data/reducers/selection'
import { UserState } from '../../../data/reducers/user'
import PagesApiService from '../../../data/services/PagesApiService'
import store from '../../../data/store'
import GlobalUndo from '../../../data/undo/GlobalUndo'
import QuillUndo from '../../../data/undo/QuillUndo'
import { UploadManager } from '../../../data/Uploader'
import * as url from '../../../data/url'
import addDeltaReplay from '../../../dev/deltaReplay'
import { isDevMode } from '../../../dev/devMode'
import {
    FILE_CREATE_METHOD,
    getLargeEmbedWidth
} from '../../../helpers/EmbedHelper'
import { ElementCoordinates } from '../../../interfaces/elementCoordinates'
import { Member } from '../../../interfaces/member'
import { Permissions } from '../../../interfaces/permissions'
import { SelectionType } from '../../../interfaces/selectionType'
import { UnfollowMethod } from '../../../interfaces/unfollowMethod'
import * as QuillRegistry from '../../../QuillRegistry'
import * as OTClientRegistry from '../../../OTClientRegistry'
import NotFound from '../../errors/NotFound'
// Quill Sync Engine
import { OTEditorClient } from '../../ot/OTClient'
// Quill Core + Plugins
import Quill, { createQuillInstance } from '../../quill/entries/Editor'
import { GlobalCommentMarkingModule } from '../../quill/modules/CommentMarking'
import { markModifier } from '../../quill/modules/CommentMarking/modifier'
import FileBlotCreator from '../../quill/modules/FileBlotCreator'
import getFileEmbedOptions from '../../quill/modules/FileEmbedOptions'
import { updateQuillPermissions } from '../../quill/modules/Permissions'
import QuillEvents from '../../quill/modules/QuillEvents'
import QuillSources from '../../quill/modules/QuillSources'
import quillProvider from '../../quill/provider'
import { QuillSocketIOAdapter } from '../../quill/QuillSocketIOAdapter'
import { getCachedContents } from '../../quill/utils'
import getTitle from '../../quill/utils/getTitle'
import insertMention from '../../quill/utils/insertMention'
import Authors from './Authors/AuthorsContainer'
import Comments from './Comments/CommentsContainer'
import DocumentHistory from './DocumentHistory/DocumentHistoryContainer'
import EmojiPicker from './EmojiPicker/EmojiPickerContainer'
import ExpandedImageContainer from './ExpandedImage/ExpandedImageContainer'
import FloatingToolbar from './FloatingToolbar/FloatingToolbarContainer'
import { formatSelection, insertLink } from './formatting'
import insertDivider from './formatting/insertDivider'
import LineControls from './LineControls/LineControlsContainer'
import LoggedOutModal from './LoggedOutModal/LoggedOutModal'
import MentionsList from './Mentions/MentionsList/MentionsList'
import Placeholder from './Placeholder/PlaceholderContainer'
import PlusMenuContainer from './PlusMenu/PlusMenuContainer'
import { PrivacyDisclaimer } from './PrivacyDisclaimer/PrivacyDisclaimer'
import ReconnectManager from './ReconnectManager'

const Inline = Quill.import('blots/inline')

Inline.order = [
    'cursor',
    'inline',
    'mark',
    'author', // Must be lower
    'underline',
    'strike',
    'italic',
    'bold',
    'script',
    'link',
    'code' // Must be higher
]

interface EditorProps extends RouteComponentProps<any>, React.Props<any> {
    unarchiveDocument: () => Promise<void>
    bold: boolean
    blockquote: boolean
    codeBlock: boolean
    formatSelection: typeof formatSelectionAction
    header: number
    selection: selectionReducer.SelectionState
    index: number | null
    italic: boolean
    selectionLength: number
    selectionType: SelectionType
    setMembers: typeof setMembers
    fetchCurrentDocument: typeof fetchCurrentDocument
    fetchUser: typeof fetchUser
    fetchTeamMembers: typeof fetchTeamMembers
    fetchAllThreads: typeof fetchAllThreads
    fetchFeatureFlags: typeof fetchFeatureFlags
    setTitle: typeof setTitle
    setUpdatedAt: typeof setUpdatedAt
    showBanner: (
        type: BannerType,
        color?: BannerColor,
        position?: BannerPosition
    ) => AnyAction
    setPermissions: typeof setPermissions
    link: string
    list: string
    navigationHeight: number
    strike: boolean
    text: string
    underline: boolean
    isFirstLine: boolean
    currentDocument: CurrentDocumentState
    user: UserState
    mentions: MentionsState
    clearMentionList: any
    title: string
    updatedAt: Date
    missingDocument: boolean
    permissions: PermissionsState
    showEmojiPicker: boolean
    hasUnsavedComments: boolean
    hasCommentError: boolean
    keepAlive: () => Promise<void>
    loggedIn: boolean
    setDocumentUpdating: (isUpdating: boolean) => AnyAction
    banner: BannerState
    activeImageId: string
    setDocumentIsSubscribed: (isSubscribed: boolean) => AnyAction
    unsubscribeFromDocument: (unfollowMethod: UnfollowMethod) => Promise<void>
    setElementCoordinates: (
        elementName: string,
        elementCoordinates: ElementCoordinates
    ) => AnyAction
    showPlusMenu: boolean
    closePlusMenu: typeof closePlusMenu
    openPlusMenu: typeof openPlusMenu
    historyOpen: boolean
}

interface State {
    needsRefresh: boolean
    refreshMessage: string
    showPrivacyDisclaimer: boolean
    keepAlivePending: boolean
    subscribedToDocument: boolean
    quillScrollTop: number
}

const colors = ['#FF3366', '#596ACA', '#4EAE53', '#FFA726', '#939AA9']

export default class Editor extends React.Component<EditorProps, State> {
    private quill: Quill
    private documentId: string
    private shortId: string
    private members: Member[] = []
    private quillServerAdapter: QuillSocketIOAdapter
    private reconnectManager: ReconnectManager
    private otEditorClient: OTEditorClient
    private resetDocToken?: string
    private updateCursorToken?: string
    private keepAlive: any
    private editorRef: HTMLDivElement

    constructor(props: EditorProps) {
        super(props)

        this.state = {
            needsRefresh: false,
            refreshMessage: DEFAULT_PAGE_REFRESH_MESSAGE,
            showPrivacyDisclaimer:
                Cookie.get(RHOMBUS_PRIVACY_COOKIE_KEY) !== 'true' &&
                !IS_END_TO_END_TEST,
            keepAlivePending: false,
            subscribedToDocument: false,
            quillScrollTop: 0
        }

        const { slugAndShortId } = this.props.match.params

        try {
            const { documentId, shortId } = url.getIds(slugAndShortId)

            this.documentId = documentId
            this.shortId = shortId
        } catch (e) {
            console.log('Editor Constructor ', e)
        }
    }

    async componentDidMount() {
        this.keepAlive = setInterval(
            this.props.keepAlive,
            KEEP_ALIVE_REQUEST_INTERVAL
        )

        // load initial data
        const initialDataPromise = this.fetchInitialData()

        // fetch feature flags
        // needs to happen before quill registers to make sure the right
        // blots are loaded based on feature flag
        const featureFlagPromise = this.props.fetchFeatureFlags()

        await Promise.all([initialDataPromise, featureFlagPromise])

        if (!this.props.missingDocument) {
            this.members = this.props.currentDocument.members

            // Fetch Team Members
            this.props.fetchTeamMembers()

            // Track document viewed
            this.trackDocumentViewed()

            // Fetch Comment Threads
            this.props.fetchAllThreads()
            const { user, currentDocument, permissions } = this.props
            const color = colors[Math.floor(Math.random() * colors.length)]

            // update url
            this.updateUrl(currentDocument.title)

            // Only load Quill if user has permission
            if (this._hasPermissions()) {
                // setup quill
                this.setupQuill(user, currentDocument, color, permissions)
                // setup Quill Socket.IO adapter
                this.setupQuillSocketIOAdapter(
                    user,
                    currentDocument,
                    color,
                    permissions
                )

                // init reconnect manager
                this.reconnectManager = new ReconnectManager(
                    this.quillServerAdapter
                )

                // listen for quill text change
                // @ts-ignore
                this.quill.on(QuillEvents.TEXT_CHANGE, this.handleTextChange)
                this.resetDocToken = PubSub.subscribe(
                    DOCUMENT_EVENT_RESET,
                    this.handleResetDoc
                )
                this.updateCursorToken = PubSub.subscribe(
                    DOCUMENT_CHANGE_UPDATE,
                    this.updateCursors.bind(this)
                )
                window.addEventListener(
                    'resize',
                    debounce(this._updateSize, 50)
                )

                if (this.quill && this.quill.scrollingContainer) {
                    this.quill.scrollingContainer.addEventListener(
                        'scroll',
                        this.updateQuillScrollTop
                    )
                }
            }

            // wait for needed fonts for authors calculations
            await this.loadFonts()

            // Set authors on content load
            PubSub.publish(DOCUMENT_CHANGE_UPDATE, null)
        }
    }

    componentDidUpdate(prevProps: EditorProps) {
        if (this.props.loggedIn !== prevProps.loggedIn && this.props.loggedIn) {
            this.quillServerAdapter.connect()
        } else if (
            this.props.loggedIn !== prevProps.loggedIn &&
            !this.props.loggedIn
        ) {
            analytics.track(analytics.SSO_EXPIRATION_MESSAGE_PRESENTED)
            this.quillServerAdapter.disconnect()
        }

        if (prevProps.banner.type == null && this.props.banner.type != null) {
            const { banner } = this.props
            if (
                banner.type != null &&
                banner.position === BannerPosition.Bottom
            ) {
                this.quill.scrollingContainer.scrollTop += BANNER_HEIGHT
            }
        }
    }

    updateQuillScrollTop = () => {
        this.setState({
            quillScrollTop: this.quill.scrollingContainer.scrollTop
        })
    }

    trackDocumentViewed() {
        analytics.identifyUser()
        analytics.track(analytics.DOCUMENT_VIEWED, {
            documentId: this.documentId
        })
    }

    async fetchInitialData() {
        await Promise.all([
            this.props.fetchCurrentDocument(this.documentId),
            this.props.fetchUser()
        ])
        return setImmediatePromise()
    }

    setupQuill(
        user: UserState,
        currentDocument: CurrentDocumentState,
        color: string,
        permissions: PermissionsState
    ) {
        /**
         * * Things we've learned about Quill
         * We may be able to add a before update life-cycle hook to Quill by extending the update method in the scroll blot:
         * https://github.com/quilljs/quill/blob/develop/blots/scroll.js#L148-L165
         */
        const QuillInstance = createQuillInstance()
        this.quill = new QuillInstance('#quill-container', {
            modules: {
                keyboard: {
                    editorId: currentDocument.id,
                    emoji: {
                        picker: true,
                        shortcode: true
                    },
                    mentions: true,
                    markdown: {
                        header: true,
                        bold: true,
                        code: true,
                        divider: true,
                        strike: true,
                        italic: true,
                        link: true,
                        codeBlock: true,
                        list: true,
                        underline: true,
                        blockquote: true
                    }
                },
                permissions: {
                    ...permissions,
                    canEdit: permissions.canEdit && !currentDocument.isArchived
                },
                clipboard: {
                    matchVisual: false,
                    handleEmbeds: true,
                    editorId: currentDocument.id
                },
                toolbar: true,
                'multi-cursor': true,
                authorship: {
                    enabled: true,
                    authorId: user.userId,
                    color
                },
                history: {
                    userOnly: true,
                    documentId: currentDocument.id
                },
                emoji: true,
                'emoji-picker-manager': {
                    enabled: true
                },
                'file-paste': true,
                'file-drop': true,
                'mentions-manager': {
                    editorId: currentDocument.id
                },
                'selection-manager': {
                    enabled: true,
                    editorId: currentDocument.id,
                    mainEditor: true
                },
                'mouseover-manager':
                    (permissions.canEdit || permissions.canComment) &&
                    !currentDocument.isArchived,
                'authors-manager': true,
                [COMMENT_MARKING_MODULE_NAME]: true,
                placeholder: { enabled: true }
            },
            scrollingContainer: '#app',
            theme: 'snow'
        })
        quillProvider.setQuill(this.quill)
        QuillRegistry.registerEditor(currentDocument.id, this.quill)
        GlobalUndo.register(currentDocument.id, new QuillUndo(this.quill))
        GlobalCommentMarkingModule.initialize(this.quill.scrollingContainer)

        // inject quill to window
        if (IS_END_TO_END_TEST) {
            window.quill = this.quill
            window.Parchment = Quill.import('parchment')
            window.PagesApiService = PagesApiService
            window.UploadManager = UploadManager
            window.hasUnsavedComments = () => this.props.hasUnsavedComments
            window.store = store
            window.updateQuillPermissions = updateQuillPermissions
            window.documentId = this.documentId
            window.getLargeEmbedWidth = getLargeEmbedWidth
            window.Delta = Delta
            window.QuillRegistry = QuillRegistry
            window.OTClientRegistry = OTClientRegistry
        }

        // inject quill to window in development
        if (process.env.NODE_ENV === 'development') {
            window.quill = this.quill
            window.Parchment = Quill.import('parchment')
            window.Delta = Delta
        }

        // disable quill before set contents
        // this way we prevent user from writing if there is some problem with initial setContents
        this.quill.disable()

        this.quill.setContents(new Delta(currentDocument.contents.delta))

        // This adds the delta replay tool when running locally
        if (isDevMode()) {
            addDeltaReplay(this.quill)
        }
    }

    showResetDocMessage = () => {
        this.props.showBanner(
            BannerType.RESET_DOC,
            BannerColor.DANGER,
            BannerPosition.Top
        )
        this.quill.disable()
        this.quillServerAdapter.disconnect()
    }

    handleResetDoc = async () => {
        // disable editor
        this.quill.disable()

        // fetch document data
        await this.props.fetchCurrentDocument(this.documentId)
        await setImmediatePromise()

        // set new contents to quill
        const { currentDocument } = this.props
        this.quill.setContents(new Delta(currentDocument.contents.delta))

        // reset ot editor client
        this.otEditorClient.resetClientWithRevision(
            currentDocument.contents.revision + 1
        )

        // set new contents to server adapter
        this.quillServerAdapter.setDocumentContents(currentDocument.contents)
        this.quillServerAdapter.connect()
    }

    serverAdapterReady = () => {
        updateQuillPermissions({
            canEdit: this.props.permissions.canEdit,
            canComment: this.props.permissions.canComment,
            isArchived: this.props.currentDocument.isArchived
        })
    }

    handleDocumentPermissionsChanged = (permissions: Permissions) => {
        this.props.setPermissions(permissions.canEdit, permissions.canComment)
        this.quillServerAdapter.updatePermissions(permissions.canEdit)
        updateQuillPermissions({
            canEdit: permissions.canEdit,
            canComment: permissions.canComment,
            isArchived: this.props.currentDocument.isArchived
        })
    }

    handleSubscribedToDocument = () => {
        this.props.setDocumentIsSubscribed(true)
        this.setState({ subscribedToDocument: true })
    }

    handleUnfollow = () => {
        this.props.unsubscribeFromDocument('toast')
        this.setState({ subscribedToDocument: false })
    }

    setupQuillSocketIOAdapter(
        user: UserState,
        currentDocument: CurrentDocumentState,
        color: string,
        permissions: PermissionsState
    ) {
        this.quillServerAdapter = new QuillSocketIOAdapter(
            currentDocument.id,
            currentDocument.contents,
            {
                userId: user.userId,
                userName: user.email,
                color,
                canEdit: permissions.canEdit
            }
        )

        this.otEditorClient = new OTEditorClient(
            currentDocument.contents.revision + 1,
            this.quillServerAdapter,
            this.quill
        )
        this.otEditorClient.addModifier(markModifier)

        this.quillServerAdapter.on('operation', () => {
            this.handleUpdatedAt()
        })

        this.quillServerAdapter.on(
            'ack',
            debounce(() => {
                this.props.setDocumentUpdating(false)
            }, UPDATING_DOCUMENT_DEBOUNCE)
        )

        this.quillServerAdapter.on('ack', () => {
            this.handleUpdatedAt()
        })

        this.quillServerAdapter.on('reconnect', () => {
            this.props.fetchAllThreads()
        })

        this.quillServerAdapter.on('update', async (connectedData: any) => {
            if (
                connectedData.event === 'update' &&
                connectedData.users.length > 0
            ) {
                // hasInvalidConnectedUsers checks the members against the connected users, and it sets
                // the isViewing boolean on this.members
                if (this.hasInvalidConnectedUsers(connectedData)) {
                    // If the connected data list doesn't match members, then we try to refresh members
                    this.refreshMembershipList(connectedData)
                } else {
                    this.props.setMembers(this.members)
                }
            }
        })

        this.quillServerAdapter.on('comments-updated', () => {
            setTimeout(() => {
                this.props.fetchAllThreads()
            }, GET_UPDATED_THREADS_DELAY)
        })

        this.quillServerAdapter.on('reset-doc', this.showResetDocMessage)
        this.quillServerAdapter.on('ready', this.serverAdapterReady)

        this.quillServerAdapter.on(SOCKET.documentArchived, () => {
            this.props.fetchCurrentDocument(this.documentId)
        })

        this.quillServerAdapter.on(SOCKET.documentUnarchived, () => {
            this.props.fetchCurrentDocument(this.documentId)
        })

        this.quillServerAdapter.on(
            SOCKET.subscribedToDocument,
            this.handleSubscribedToDocument
        )

        this.quillServerAdapter.on(
            SOCKET.documentPermissionsChanged,
            this.handleDocumentPermissionsChanged
        )

        this.otEditorClient.on(
            'apply-operation-error',
            (error: Error, operation: Delta) => {
                // If the error has to do with an unknown blot type, then display a message prompting the user to refresh
                if (
                    startsWith(error.message, '[Parchment] Unable to create') &&
                    endsWith(error.message, 'blot')
                ) {
                    let documentRefreshMessage
                    // If the delta has an insert with a user, get it's value
                    const author: number = result(
                        find(
                            operation.ops!,
                            (op) =>
                                op.insert &&
                                op.attributes &&
                                op.attributes.author
                        ),
                        'attributes.author'
                    )
                    // If author exists, get the users name from the current document's members and update the refresh prompt message
                    if (author) {
                        const members = this.props.currentDocument.members
                        const updatingMemberName = result(
                            find(members, { userId: author }),
                            'name'
                        )
                        if (updatingMemberName) {
                            documentRefreshMessage = `${updatingMemberName} ${PAGE_REFRESH_MESSAGE_WITH_USER}`
                        }
                    }

                    this.setState({
                        needsRefresh: true,
                        refreshMessage:
                            documentRefreshMessage || this.state.refreshMessage
                    })

                    bugsnag.notify(error, {
                        metadata: {
                            incomingOperation: operation
                        }
                    })
                    this.quillServerAdapter.dispose()
                    this.quill.disable()
                } else {
                    throw error
                }
            }
        )

        window.addEventListener('beforeunload', this.handleUserLeave)

        // inject otEditorClient to window
        if (IS_END_TO_END_TEST) {
            window.otEditorClient = this.otEditorClient
        }
    }

    hasPendingEdits() {
        return (
            (this.otEditorClient && !this.otEditorClient.isSynchronized()) ||
            (UploadManager && !UploadManager.allUploadsCompleted()) ||
            this.props.hasUnsavedComments ||
            !OTClientRegistry.isSynchronized()
        )
    }

    handleUserLeave = (e: BeforeUnloadEvent): string | void => {
        // clear user's cursor
        this.removeUsersCursor(this.props.user.userId)

        if (this.hasPendingEdits()) {
            const message = UNSAVED_CHANGES_MESSAGE

            // Custom message is no longer supported in Chrome, Safari and Firefox
            // see https://stackoverflow.com/questions/37782104/javascript-onbeforeunload-not-showing-custom-message

            var e = e || window.event

            if (e) {
                e.returnValue = message
            }

            return message
        }
    }

    loadFonts() {
        const fonts = [
            'Eina Semibold',
            'Eina Semibold Italic',
            'Source Code Pro Regular',
            'Maison Neue Regular',
            'Maison Neue Demi Italic'
        ]

        const observers = fonts.map((font) => {
            var observer = new FontFaceObserver(font)
            return observer.load()
        })

        const promises = Promise.all(observers).catch(() => {
            // ignore error
            // when user has slow network FontFaceObserver throws error after 3s timeout
        })
        return promises
    }

    componentWillUnmount() {
        // @ts-ignore
        this.quill.off(QuillEvents.TEXT_CHANGE, this.handleTextChange)

        window.removeEventListener('beforeunload', this.handleUserLeave)
        window.removeEventListener('resize', debounce(this._updateSize, 150))
        this.quill.scrollingContainer.removeEventListener(
            'scroll',
            this.updateQuillScrollTop
        )
        if (this.resetDocToken != null) {
            PubSub.unsubscribe(this.resetDocToken)
        }
        if (this.updateCursorToken != null) {
            PubSub.unsubscribe(this.updateCursors)
        }

        if (this.reconnectManager != null) {
            this.reconnectManager.detach()
        }

        clearInterval(this.keepAlive)
    }

    render() {
        // Render 404 Component
        if (this.props.missingDocument) {
            return this._renderNotFound()
        }

        // Render the application if user has permission, if not, redirect to request-access
        const { loaded } = this.props.permissions
        if (loaded && !this._hasPermissions()) {
            window.location.assign(`/request-access/rhombus/${this.documentId}`)
        }

        return this._renderDocument()
    }

    private _renderNotFound = () => {
        return <NotFound />
    }

    private _renderAlert = (
        status: 'danger' | 'warning',
        message: string,
        top: number = 0
    ) => {
        const { loaded } = this.props.permissions
        return (
            loaded && (
                <Alert
                    style={{
                        top: `${top}px`,
                        zIndex: 1
                    }}
                    className={styles.permissionsError}
                    status={status}>
                    {message}
                </Alert>
            )
        )
    }

    private _renderDocument = () => {
        const {
            isFirstLine,
            selectionLength,
            title,
            navigationHeight,
            mentions,
            showEmojiPicker,
            unarchiveDocument,
            hasCommentError,
            selectionType,
            loggedIn,
            banner
        } = this.props
        const { members, isArchived } = this.props.currentDocument
        const {
            needsRefresh,
            refreshMessage,
            showPrivacyDisclaimer,
            keepAlivePending,
            subscribedToDocument
        } = this.state
        const canEdit = this.props.permissions.canEdit && !isArchived
        const canComment = this.props.permissions.canComment && !isArchived

        let topOffset = navigationHeight
        if (banner.type != null && banner.position === BannerPosition.Bottom) {
            topOffset += BANNER_HEIGHT
        }

        if (this.quill) {
            this.quill.root.spellcheck = !canComment
        }

        return (
            <React.Fragment>
                <DocumentTitle title={title}>
                    <DndProvider backend={ReactDndHTML5Backend}>
                        <div
                            style={{
                                marginTop: topOffset + 'px',
                                minHeight: `calc(100vh - ${topOffset}px)`
                            }}
                            className={cx(
                                styles.editor,
                                { [styles.noEdit]: !canEdit },
                                { 'editor-archived': isArchived }
                            )}
                            ref={(element) => {
                                element &&
                                    this.setEditorRefWithCoordinates(element)
                            }}>
                            <Authors />
                            <div
                                className={styles.editorContainer}
                                id={MAIN_EDITOR_ID}>
                                <Placeholder />
                                {isArchived && (
                                    <Alert
                                        className={styles.archivedAlert}
                                        status="info">
                                        This document is archived.{' '}
                                        <a onClick={unarchiveDocument}>
                                            Restore it
                                        </a>{' '}
                                        to keep editing.
                                    </Alert>
                                )}
                                {!loggedIn && (
                                    <div className={styles.modalContainer}>
                                        <Modal
                                            aria-label="You've been logged out."
                                            open={true}
                                            onRequestClose={() => {}}
                                            closeOnEsc={true}>
                                            <LoggedOutModal
                                                pendingEdits={this.hasPendingEdits()}
                                                keepAlivePending={
                                                    keepAlivePending
                                                }
                                                retry={this._dispatchKeepAlive}
                                            />
                                        </Modal>
                                    </div>
                                )}
                                {hasCommentError && (
                                    <Toast
                                        className="toast"
                                        status="danger"
                                        style={{
                                            top: `90px`
                                        }}
                                        placement="top-center">
                                        There was an error sending a comment.
                                    </Toast>
                                )}

                                {subscribedToDocument && (
                                    <Toast
                                        className={
                                            styles.subscribedToDocumentToast
                                        }
                                        status="info"
                                        placement="top-center">
                                        You’re following this document. We’ll
                                        email you whenever it’s updated.
                                        <a onClick={this.handleUnfollow}>
                                            Unfollow
                                        </a>
                                    </Toast>
                                )}

                                {showPrivacyDisclaimer && <PrivacyDisclaimer />}
                                {needsRefresh &&
                                    this._renderAlert(
                                        'warning',
                                        refreshMessage
                                    )}
                                {selectionLength > 0 &&
                                    (canEdit || canComment) &&
                                    !needsRefresh && (
                                        <FloatingToolbar
                                            insertLink={this.insertLink}
                                            // @ts-ignore
                                            formatSelection={
                                                this.formatSelection
                                            }
                                            onDividerClick={this.insertDivider}
                                            canEdit={
                                                canEdit &&
                                                !isFirstLine &&
                                                selectionType ===
                                                    SelectionType.Text
                                            }
                                            canComment={
                                                (canEdit || canComment) &&
                                                selectionType ===
                                                    SelectionType.Text
                                            }
                                            scrollTop={
                                                this.quill.scrollingContainer
                                                    .scrollTop
                                            }
                                        />
                                    )}
                                {mentions.showMentionsList &&
                                    mentions.type === MENTION_TYPES.editor && (
                                        <MentionsList
                                            top={mentions.top + 28}
                                            left={mentions.left}
                                            // @ts-ignore
                                            onMemberClick={
                                                this.clickMentionsMember
                                            }
                                            members={members}
                                            searchResults={mentions.members}
                                            searchTerm={mentions.mentionText}
                                            selectedItem={
                                                mentions.selectedMemberIndex
                                            }
                                        />
                                    )}
                                {showEmojiPicker && <EmojiPicker />}
                                {(canEdit || canComment) && !needsRefresh && (
                                    <LineControls
                                        onUploadFiles={this.uploadFiles}
                                        onPlusClicked={this.props.openPlusMenu}
                                    />
                                )}
                                <div
                                    id="quill-container"
                                    className="quill-container"
                                    data-editor-id={this.documentId}
                                    data-main-editor={true}
                                />
                                <PlusMenuContainer
                                    quill={this.quill}
                                    index={this.props.index}
                                    onClosePlusMenu={this.props.closePlusMenu}
                                    showPlusMenu={this.props.showPlusMenu}
                                    quillScrollTop={this.state.quillScrollTop}
                                />
                            </div>
                            <Comments />
                        </div>
                    </DndProvider>
                </DocumentTitle>
                {this.props.historyOpen && (
                    <DocumentHistory
                        prepareRevert={() => {
                            this.quillServerAdapter.prepareRevert()
                        }}
                        editorQuill={this.quill}
                    />
                )}
                {this.props.activeImageId && <ExpandedImageContainer />}
            </React.Fragment>
        )
    }
    private clickMentionsMember = (member: Member) => {
        const quill = QuillRegistry.getEditor(this.props.mentions.editorId!)
        if (!quill) {
            return
        }
        insertMention(
            quill,
            this.props.mentions.initialIndex!,
            this.props.mentions.currentIndex!,
            'mention',
            member
        )
    }
    private getEmbedOptions = (file: File) => {
        return getFileEmbedOptions(file, this.quill)
    }
    private _updateSize = () => {
        const {
            top,
            right,
            bottom,
            left,
            width,
            height,
            x,
            y
        } = this.editorRef.getBoundingClientRect() as DOMRect
        this.props.setElementCoordinates('editor', {
            top,
            right,
            bottom,
            left,
            width,
            height,
            x,
            y
        })
    }
    private setEditorRefWithCoordinates(element: HTMLDivElement) {
        this.editorRef = element
        this._updateSize()
    }
    private uploadFiles = (files: File[]) => {
        FileBlotCreator.createBlotFromFiles(
            files,
            this.quill,
            BLOCK_EMBED_BLOT_NAME,
            { getEmbedOptions: this.getEmbedOptions },
            FILE_CREATE_METHOD.plusButton
        )
    }

    private handleTextChange = (
        delta: Delta,
        oldContents: Delta,
        source: string
    ) => {
        this.handleTitleChange()
        this.handleUpdatedAt()

        if (source === QuillSources.USER) {
            this.props.setDocumentUpdating(true)
        }

        // Check if a new Delta contains a link, and update the state for that selection
        const link = get(delta, ['ops', 1, 'attributes', 'link'])
        if (
            link &&
            this.props.selectionLength > 0 &&
            source === QuillSources.USER
        ) {
            this.props.formatSelection('link', link)
        }
    }

    private updateUrl(title: string) {
        this.props.history.replace({
            pathname: url.getPath(title, this.shortId),
            search: this.props.location.search
        })
    }

    // Update state only if it's been over a minute since
    // last update on the document has happened.
    private handleUpdatedAt() {
        const updatedAt = new Date()
        const differenceInSeconds =
            (updatedAt.getTime() - this.props.updatedAt.getTime()) / 1000

        if (differenceInSeconds > 60) {
            this.props.setUpdatedAt(updatedAt)
        }
    }

    private handleTitleChange() {
        const contents = getCachedContents(this.quill)
        const title = getTitle(contents)
        if (title !== this.props.title) {
            this.updateUrl(title)
            this.props.setTitle(title)
        }
    }

    private insertDivider = () => {
        insertDivider(this.props.selection)
    }
    private insertLink = () => {
        insertLink(this.props.selection)
    }

    private formatSelection = (
        format: string,
        newValue: boolean | string | number
    ) => {
        formatSelection(this.props.selection, format, newValue)
        this.props.formatSelection(format, newValue)
    }

    private hasInvalidConnectedUsers(
        connectedList: {
            users: Member[]
        } = { users: [] }
    ): boolean {
        let isInvalid = true
        const membersCopy = this.members.slice()
        const connectedCopy = connectedList.users.slice()

        for (var k = membersCopy.length - 1; k > -1; k--) {
            this.members[k].isViewing = false
            for (var m = connectedCopy.length - 1; m > -1; m--) {
                if (+membersCopy[k].userId === +connectedCopy[m]) {
                    this.members[k].isViewing = true
                    membersCopy.splice(k, 1)
                    connectedCopy.splice(m, 1)
                    break
                }
            }

            if (this.members[k].isViewing === false) {
                this.removeUsersCursor(this.members[k].userId)
            }
        }

        if (connectedCopy.length === 0) {
            isInvalid = false
        }

        return isInvalid
    }

    private removeUsersCursor(userId: number) {
        // instantiate quill's cursors module
        const cursor = this.quill.getModule('multi-cursor')

        // remove user's cursor
        return cursor.removeCursor(userId)
    }

    private updateCursors() {
        if (this.quill) {
            const cursor = this.quill.getModule('multi-cursor')
            cursor.update()
        }
    }

    private async refreshMembershipList(connectedList: { users: Member[] }) {
        this.members = await PagesApiService.getDocumentMemberships()

        if (!this.hasInvalidConnectedUsers(connectedList)) {
            this.props.setMembers(this.members)
        }

        // If the members list and connected lists still don't match then we don't continue
    }
    private _hasPermissions = () => {
        const { canEdit, canComment } = this.props.permissions
        return canEdit || canComment
    }
    private _dispatchKeepAlive = () => {
        analytics.track(analytics.SSO_LOGIN_STATUS_CHECKED)

        this.setState({ keepAlivePending: true }, async () => {
            await this.props.keepAlive()
            this.setState({ keepAlivePending: false })
        })
    }
}
