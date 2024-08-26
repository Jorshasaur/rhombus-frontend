import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'
import PagesApiService from '../services/PagesApiService'
import { Dispatch } from 'react-redux'
import {
    getMarkType,
    GlobalCommentMarkingModule
} from '../../components/quill/modules/CommentMarking'
import analytics from '../../analytics/analytics'
import { capitalize } from 'lodash'

export const createNewCommentThread = (
    id: string,
    index: number,
    length: number
): AnyAction => ({
    type: TypeKeys.CREATE_NEW_COMMENT_THREAD,
    data: {
        id,
        index,
        length
    }
})

export const cancelNewCommentThread = (id: string) => ({
    type: TypeKeys.CANCEL_NEW_COMMENT_THREAD_THREAD,
    data: {
        id
    }
})

export const newCommentDispatched = (
    id: string,
    markId: string,
    commentId: string,
    comment: string,
    source: string,
    userId: number
) => ({
    type: TypeKeys.NEW_COMMENT_DISPATCHED,
    data: {
        commentId,
        id,
        comment,
        source,
        userId,
        markId
    }
})
export const newCommentTryAgainDispatched = (
    id: string,
    markId: string,
    commentId: string,
    text: string
) => ({
    type: TypeKeys.NEW_COMMENT_TRY_AGAIN,
    data: {
        id,
        markId,
        commentId,
        text
    }
})
export const newThreadPosted = (
    id: string,
    markId: string,
    commentId: string,
    tempId: string
) => ({
    type: TypeKeys.NEW_COMMENT_POSTED,
    data: {
        id,
        markId,
        commentId,
        tempId
    }
})
export const newCommentPosted = (
    id: string,
    markId: string,
    commentId: string,
    tempId: string
) => ({
    type: TypeKeys.NEW_COMMENT_POSTED,
    data: {
        id,
        markId,
        commentId,
        tempId
    }
})
export const newCommentError = (
    id: string,
    markId: string,
    tempId: string
) => ({
    type: TypeKeys.NEW_COMMENT_ERROR,
    data: {
        id,
        markId,
        tempId
    }
})

export const postNewThread = (
    markId: string,
    comment: string,
    source: string,
    userId: number,
    tempId: string
) => {
    return async (dispatch: Dispatch<Function>) => {
        dispatch(
            newCommentDispatched(
                markId,
                markId,
                tempId,
                comment,
                source,
                userId
            )
        )
        try {
            const { commentId, threadId } = await PagesApiService.createThread(
                markId,
                source
            )

            dispatch(newCommentPosted(threadId, markId, commentId, tempId))

            // track comment submitted
            const markType = getMarkType(markId)
            analytics.track(analytics.COMMENT_SUBMITTED, {
                documentId: PagesApiService.documentId,
                medium: `CommentMediumis.${capitalize(markType)}`,
                threadId
            })

            // Re-highlight comment thread to ensure mark persists
            GlobalCommentMarkingModule.highlight(markId)
        } catch (e) {
            dispatch(newCommentError(markId, markId, tempId))
        }
    }
}

export const postNewComment = (
    id: string,
    markId: string,
    comment: string,
    source: string,
    userId: number,
    tempId: string
) => {
    return async (dispatch: Dispatch<Function>) => {
        dispatch(
            newCommentDispatched(id, markId, tempId, comment, source, userId)
        )
        try {
            const { commentId, threadId } = await PagesApiService.createComment(
                id,
                source
            )

            dispatch(newCommentPosted(threadId, markId, commentId, tempId))

            // track comment submitted
            const markType = getMarkType(markId)
            analytics.track(analytics.COMMENT_SUBMITTED, {
                documentId: PagesApiService.documentId,
                medium: `CommentMediumis.${capitalize(markType)}`,
                id
            })

            // Re-highlight comment thread to ensure mark persists
            GlobalCommentMarkingModule.highlight(markId)
        } catch (e) {
            dispatch(newCommentError(id, markId, tempId))
        }
    }
}

export const retryNewThread = (
    markId: string,
    tempId: string,
    comment: string
) => {
    return async (dispatch: Dispatch<Function>) => {
        dispatch(newCommentTryAgainDispatched(markId, markId, tempId, comment))
        try {
            const { commentId, threadId } = await PagesApiService.createThread(
                markId,
                comment
            )
            dispatch(newCommentPosted(threadId, markId, commentId, tempId))

            // Re-highlight comment thread to ensure mark persists
            GlobalCommentMarkingModule.highlight(markId)
        } catch (e) {
            dispatch(newCommentError(markId, markId, tempId))
        }
    }
}

export const retryNewComment = (
    id: string,
    markId: string,
    tempId: string,
    comment: string
) => {
    return async (dispatch: Dispatch<Function>) => {
        dispatch(newCommentTryAgainDispatched(id, markId, tempId, comment))
        try {
            const { commentId, threadId } = await PagesApiService.createComment(
                id,
                comment
            )
            dispatch(newCommentPosted(threadId, markId, commentId, tempId))

            // Re-highlight comment thread to ensure mark persists
            GlobalCommentMarkingModule.highlight(markId)
        } catch (e) {
            dispatch(newCommentError(id, markId, tempId))
        }
    }
}
export const highlightCommentThread = (markId: string): AnyAction => ({
    type: TypeKeys.HIGHLIGHT_COMMENT_THREAD,
    data: {
        markId
    }
})

export const unhighlightCommentThread = (): AnyAction => ({
    type: TypeKeys.UNHIGHLIGHT_COMMENT_THREAD
})

export const selectCommentThread = (markId: string): AnyAction => ({
    type: TypeKeys.SELECT_COMMENT_THREAD,
    data: {
        markId
    }
})

export const deselectCommentThread = (): AnyAction => ({
    type: TypeKeys.DESELECT_COMMENT_THREAD,
    data: {}
})

export const resolveThread = (id: string) => {
    return async () => {
        await PagesApiService.resolveThread(id)
        return {
            type: TypeKeys.RESOLVE_THREAD,
            data: {
                id
            }
        }
    }
}
