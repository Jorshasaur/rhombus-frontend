import { Dispatch } from 'react-redux'
import { Action, AnyAction } from 'redux'
import analytics from '../../analytics/analytics'
import { updateQuillPermissions } from '../../components/quill/modules/Permissions'
import { Asset } from '../../interfaces/asset'
import { Document } from '../../interfaces/document'
import { DocumentContents } from '../../interfaces/documentContents'
import { ElementCoordinates } from '../../interfaces/elementCoordinates'
import { Member } from '../../interfaces/member'
import { Permissions } from '../../interfaces/permissions'
import { SelectionType } from '../../interfaces/selectionType'
import { Thread } from '../../interfaces/thread'
import { UnfollowMethod } from '../../interfaces/unfollowMethod'
import { User } from '../../interfaces/user'
import { TypeKeys } from '../ActionTypes'
import { RootState } from '../reducers'
import { BannerColor, BannerPosition, BannerType } from '../reducers/banner'
import { FeatureFlags } from '../reducers/featureFlags'
import { MouseOverBlotData } from '../reducers/mouseover'
import PagesApiService from '../services/PagesApiService'

export const clearSelection = (): AnyAction => {
    return {
        type: TypeKeys.CLEAR_SELECTION
    }
}

export const formatSelection = (
    format: string,
    value: boolean | string | number
): AnyAction => ({
    type: TypeKeys.FORMAT_SELECTION,
    data: {
        format,
        value
    }
})

export const selectionIndexChanged = (index: number): AnyAction => ({
    type: TypeKeys.SELECTION_INDEX_CHANGED,
    data: {
        index
    }
})

export const selectionChanged = (
    editorId: string | null,
    mainEditor: boolean,
    activeEmbed: string | null,
    index: number,
    selectionLength: number,
    selectionType: SelectionType,
    blotName: string,
    text: string | null,
    top?: number,
    right?: number,
    bottom?: number,
    left?: number,
    width?: number,
    height?: number,
    format?: Object,
    isFirstLine?: boolean
): AnyAction => ({
    type: TypeKeys.SELECTION_CHANGED,
    data: {
        editorId,
        mainEditor,
        activeEmbed,
        index,
        selectionLength,
        selectionType,
        blotName,
        top,
        right,
        bottom,
        left,
        width,
        height,
        ...format,
        text,
        isFirstLine
    }
})

export const setTeamMembers = (teamMembers: Member[]): AnyAction => {
    return {
        type: TypeKeys.SET_TEAM_MEMBERS,
        data: {
            teamMembers
        }
    }
}

export const setCurrentDocument = (
    document: Document,
    contents: DocumentContents,
    members: Member[],
    assets: Asset[],
    permissions: Permissions,
    isSubscribed: boolean
): AnyAction => {
    return {
        type: TypeKeys.SET_CURRENT_DOCUMENT,
        data: {
            document,
            contents,
            members,
            assets,
            permissions,
            isSubscribed
        }
    }
}

export const setMissingDocument = (): AnyAction => ({
    type: TypeKeys.SET_MISSING_DOCUMENT
})

export const setUserCannotView = (): AnyAction => ({
    type: TypeKeys.SET_USER_CANNOT_VIEW
})

export const setCommentOnlyPermissions = (): AnyAction => ({
    type: TypeKeys.SET_PERMISSIONS,
    data: {
        canEdit: false,
        canComment: true
    }
})

export const setPermissions = (
    canEdit: boolean,
    canComment: boolean
): AnyAction => ({
    type: TypeKeys.SET_PERMISSIONS,
    data: {
        canEdit,
        canComment
    }
})

export const setArchivedDocument = (success: boolean): AnyAction => {
    return {
        type: TypeKeys.SET_ARCHIVED_DOCUMENT,
        data: {
            success
        }
    }
}

export const setMembers = (members: Member[]): AnyAction => ({
    type: TypeKeys.SET_MEMBERS,
    data: {
        members
    }
})

export const setElementCoordinates = (
    elementName: string,
    elementCoordinates: ElementCoordinates
): AnyAction => ({
    type: TypeKeys.SET_ELEMENT_COORDINATES,
    data: {
        elementName,
        elementCoordinates
    }
})

export const setAssets = (assets: Asset[]): AnyAction => ({
    type: TypeKeys.SET_ASSETS,
    data: {
        assets
    }
})

export const setAsset = (asset: Asset): AnyAction => ({
    type: TypeKeys.SET_ASSET,
    data: {
        asset
    }
})

export const fetchAsset = (id: string) => {
    return async (dispatch: Dispatch<Function>) => {
        const asset = await PagesApiService.getAsset(id)
        dispatch(setAsset(asset!))
    }
}

export const fetchTeamMembers = () => {
    return async (dispatch: Dispatch<Function>) => {
        const teamMembers = await PagesApiService.getAllTeamMembers()
        dispatch(setTeamMembers(teamMembers))
    }
}

export const setThreads = (threads: Thread[]): AnyAction => ({
    type: TypeKeys.SET_THREADS,
    data: {
        threads
    }
})

export const fetchAllThreads = () => {
    return async (dispatch: Dispatch<Function>) => {
        const threads = await PagesApiService.getAllThreads()
        dispatch(setThreads(threads))
    }
}

export const fetchCurrentDocument = (documentId: string) => {
    return async (dispatch: Dispatch<Function>) => {
        try {
            const {
                document,
                contents,
                permissions,
                isSubscribed
            } = await PagesApiService.getCurrentDocumentWithContents(documentId)
            const members = await PagesApiService.getDocumentMemberships()
            const assets = await PagesApiService.getAssets()
            dispatch(
                setCurrentDocument(
                    document,
                    contents,
                    members,
                    assets,
                    permissions,
                    isSubscribed
                )
            )
            updateQuillPermissions({
                ...permissions,
                isArchived: document.isArchived
            })
        } catch (err) {
            if (err?.response?.status === 403) {
                dispatch(setUserCannotView())
            } else if (err?.response?.status === 404) {
                dispatch(setMissingDocument())
            }
        }
    }
}

export const archiveDocument = (documentId: string) => {
    return async (dispatch: Dispatch<Function>) => {
        try {
            const { success } = await PagesApiService.archiveDocument(
                documentId
            )
            dispatch(setArchivedDocument(success))
        } catch (e) {
            dispatch(setArchivedDocument(false))
        }
    }
}

export const setUser = (user: User): AnyAction => ({
    type: TypeKeys.SET_USER,
    data: {
        user
    }
})

export const fetchUser = () => {
    return async (dispatch: Dispatch<Function>) => {
        const user = await PagesApiService.getCurrentUser()
        dispatch(setUser(user))
    }
}

export const setMentionList = (
    showMentionsList: boolean,
    type: string,
    editorId?: string,
    initialIndex?: number,
    currentIndex?: number,
    top?: number,
    left?: number,
    mentionText?: string
): AnyAction => ({
    type: TypeKeys.SET_MENTION_LIST,
    data: {
        showMentionsList,
        type,
        editorId,
        initialIndex,
        currentIndex,
        top,
        left,
        mentionText
    }
})

export const setMentionMembers = (members: Member[]): AnyAction => ({
    type: TypeKeys.SET_MENTION_MEMBERS,
    data: {
        members
    }
})

export const updateSelectedMentionMember = (
    selectedMemberIndex?: number
): AnyAction => ({
    type: TypeKeys.SET_SELECTED_MEMBER_INDEX,
    data: {
        selectedMemberIndex
    }
})

export const clearMentionList = (): AnyAction => ({
    type: TypeKeys.CLEAR_MENTION_LIST
})

export const setTitle = (title: string): AnyAction => ({
    type: TypeKeys.SET_TITLE,
    data: {
        title
    }
})

export const setUpdatedAt = (updatedAt: Date): AnyAction => ({
    type: TypeKeys.SET_UPDATED_AT,
    data: {
        updatedAt
    }
})

export const setDocumentUpdating = (isUpdating: boolean): AnyAction => {
    return {
        type: TypeKeys.SET_DOCUMENT_UPDATING,
        data: {
            isUpdating
        }
    }
}
export const openPlusMenu = (insertTop: number): AnyAction => {
    return {
        type: TypeKeys.OPEN_PLUS_MENU,
        data: { insertTop }
    }
}

export const closePlusMenu = (): AnyAction => {
    return {
        type: TypeKeys.CLOSE_PLUS_MENU
    }
}
export const setEmojiPicker = (
    showEmojiPicker: boolean,
    initialIndex?: number,
    bottom?: number,
    left?: number,
    emojiText?: string,
    editorId?: string
): AnyAction => {
    return {
        type: TypeKeys.SET_EMOJI_PICKER,
        data: {
            showEmojiPicker,
            initialIndex,
            bottom,
            left,
            emojiText,
            editorId
        }
    }
}

export const clearEmojiPicker = (): AnyAction => ({
    type: TypeKeys.CLEAR_EMOJI_PICKER
})

export const showBanner = (
    type: BannerType,
    color: BannerColor = BannerColor.DANGER,
    position: BannerPosition = BannerPosition.Bottom
): AnyAction => ({
    type: TypeKeys.SHOW_BANNER,
    data: { type, color, position }
})

export const hideBanner = (): AnyAction => ({ type: TypeKeys.HIDE_BANNER })

export const setMouseOver = (
    index: number,
    blotName: string,
    blotType: SelectionType,
    blotData: MouseOverBlotData,
    top: number,
    height: number,
    id: string
): AnyAction => ({
    type: TypeKeys.SET_MOUSEOVER,
    data: { index, blotName, blotType, blotData, top, height, id }
})

export const setMouseOverIndex = (index: number): AnyAction => ({
    type: TypeKeys.SET_MOUSEOVER_INDEX,
    data: {
        index
    }
})

export const resetMouseOver = (): AnyAction => ({
    type: TypeKeys.RESET_MOUSEOVER
})

export const beginDragging = (): AnyAction => ({
    type: TypeKeys.SET_DRAGGING,
    data: { dragging: true }
})

export const endDragging = (): AnyAction => ({
    type: TypeKeys.SET_DRAGGING,
    data: { dragging: false }
})

export const unarchiveDocument = () => {
    return async (dispatch: Dispatch<Function>, getState: () => RootState) => {
        await PagesApiService.unarchiveDocument()
        const { id } = getState().currentDocument
        analytics.track(analytics.DOCUMENT_RESTORED, {
            documentId: id,
            documentType: 'rhombus'
        })
    }
}

export const changePlaceholder = (
    showFirstLine: boolean,
    showSecondLine: boolean,
    firstLineHeight: number
): AnyAction => ({
    type: TypeKeys.CHANGE_PLACEHOLDER,
    data: {
        showFirstLinePlaceholder: showFirstLine,
        showSecondLinePlaceholder: showSecondLine,
        firstLineHeight
    }
})

export const userLoggedOut = () => ({
    type: TypeKeys.USER_LOGGED_OUT
})

export const userLoggedIn = () => ({
    type: TypeKeys.USER_LOGGED_IN
})

export const keepAlive = () => {
    return async (dispatch: Dispatch<Function>) => {
        const alive = await PagesApiService.keepAlive()
        if (!alive.success && alive.status === 401) {
            dispatch(userLoggedOut())
        } else if (alive.success) {
            dispatch(userLoggedIn())
        }
    }
}

export const setDocumentIsSubscribed = (isSubscribed: boolean): AnyAction => ({
    type: TypeKeys.SET_DOCUMENT_IS_SUBSCRIBED,
    data: {
        isSubscribed
    }
})

export const subscribeToDocument = () => {
    return async (dispatch: Dispatch<Function>) => {
        dispatch(setDocumentIsSubscribed(true))
        await PagesApiService.subscribeToDocument()
    }
}

export const unsubscribeFromDocument = (unfollowMethod: UnfollowMethod) => {
    return async (dispatch: Dispatch<Action>, getState: () => RootState) => {
        dispatch(setDocumentIsSubscribed(false))
        await PagesApiService.unsubscribeFromDocument()
        const { teamId, id } = getState().currentDocument
        analytics.track(analytics.DOCUMENT_UNFOLLOWED, {
            documentId: id,
            teamId,
            method: analytics.DOCUMENT_UNFOLLOWED_METHODS[unfollowMethod]
        })
    }
}

export const setFeatureFlags = (featureFlags: FeatureFlags): AnyAction => ({
    type: TypeKeys.SET_FEATURE_FLAGS,
    data: featureFlags
})

export const fetchFeatureFlags = async () => {
    return async (dispatch: Dispatch<Function>) => {
        const featureFlags = await PagesApiService.getFeatureFlags()
        dispatch(setFeatureFlags(featureFlags))
    }
}
