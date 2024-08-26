import { findIndex, map } from 'lodash'
import { AnyAction } from 'redux'
import { Comment as CommentInterface } from '../../interfaces/comment'
import { Thread } from '../../interfaces/thread'
import { COMMENT_STATUSES } from '../../constants/comments'
import { updateArrayItem } from '../../lib/utils'
import { TypeKeys } from '../ActionTypes'
export interface CommentsState {
    highlightedCommentMarkId?: string
    selectedCommentMarkId?: string
    threads: Thread[]
    hasError: boolean
}

export const initialState = {
    threads: [],
    hasError: false
}

const getThreadData = (state: CommentsState, markId: string) => {
    const threadIndex = findIndex(state.threads, { markId })
    const thread = state.threads[threadIndex]
    const threadComments = state.threads[threadIndex].comments || []
    return {
        threadIndex,
        thread,
        threadComments
    }
}
const getCommentData = (threadComments: CommentInterface[], id: string) => {
    const commentIndex = findIndex(threadComments, { id })
    const comment = threadComments[commentIndex]
    return {
        commentIndex,
        comment
    }
}

const updateThreadComments = (
    thread: Thread,
    updatedComments: CommentInterface[]
) => {
    return {
        ...thread,
        comments: [...updatedComments]
    }
}

const buildNewThreadState = (
    state: CommentsState,
    updatedThreads: Thread[]
) => {
    return {
        ...state,
        threads: [...updatedThreads]
    }
}

export default function comments(
    state: CommentsState = initialState,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case TypeKeys.SET_THREADS:
            const remoteIds = map(data.threads, 'id')
            const threadsInState: Thread[] = []
            const remoteThreads: Thread[] = data.threads
            state.threads.forEach((thread: Thread) => {
                if (remoteIds.indexOf(thread.id) < 0) {
                    threadsInState.push(thread)
                } else if (remoteIds.indexOf(thread.id) > -1) {
                    // If threads have errored comments that have not been sent,
                    // retain them and append them to the incoming comment threads
                    const id = thread.id
                    const localThreadIndex = findIndex(state.threads, {
                        id
                    })
                    const remoteThreadIndex = findIndex(remoteThreads, {
                        id
                    })
                    const errorComments = state.threads[
                        localThreadIndex
                    ].comments.filter((comment) => comment.hasError)
                    if (errorComments.length) {
                        remoteThreads[remoteThreadIndex] = {
                            ...remoteThreads[remoteThreadIndex],
                            comments: [
                                ...remoteThreads[remoteThreadIndex].comments,
                                ...errorComments
                            ]
                        }
                    }
                }
            })
            return {
                ...state,
                threads: [...remoteThreads, ...threadsInState]
            }
        case TypeKeys.NEW_COMMENT_POSTED: {
            const { threadIndex, thread, threadComments } = getThreadData(
                state,
                data.markId
            )
            const { commentIndex, comment } = getCommentData(
                threadComments,
                data.tempId
            )

            if (commentIndex > -1) {
                const updatedComment = {
                    ...comment,
                    id: data.commentId
                }

                const updatedComments = updateArrayItem(
                    threadComments,
                    commentIndex,
                    updatedComment
                )
                const updatedThread = updateThreadComments(
                    thread,
                    updatedComments
                )
                updatedThread.status = COMMENT_STATUSES.CREATED
                updatedThread.id = data.id
                const updatedThreads = updateArrayItem(
                    state.threads,
                    threadIndex,
                    updatedThread
                )
                return buildNewThreadState(state, updatedThreads)
            }
            return state
        }
        case TypeKeys.NEW_COMMENT_ERROR: {
            const { threadIndex, thread, threadComments } = getThreadData(
                state,
                data.markId
            )
            const { commentIndex } = getCommentData(threadComments, data.tempId)
            if (commentIndex > -1) {
                threadComments[commentIndex].hasError = true
                const updatedThread = updateThreadComments(
                    thread,
                    threadComments
                )
                const updatedThreads = updateArrayItem(
                    state.threads,
                    threadIndex,
                    updatedThread
                )
                return {
                    ...buildNewThreadState(state, updatedThreads),
                    hasError: true
                }
            }
            return state
        }
        case TypeKeys.NEW_COMMENT_TRY_AGAIN: {
            const { threadIndex, thread, threadComments } = getThreadData(
                state,
                data.markId
            )
            const { commentIndex, comment } = getCommentData(
                threadComments,
                data.commentId
            )
            let updatedThread: Thread
            let updatedThreads: Thread[] = []
            if (commentIndex > -1) {
                const updatedComment = {
                    ...comment,
                    id: data.commentId,
                    hasError: false
                }

                const updatedComments = updateArrayItem(
                    threadComments,
                    commentIndex,
                    updatedComment
                )
                updatedThread = updateThreadComments(thread, updatedComments)
                updatedThread.status = COMMENT_STATUSES.POSTING
                updatedThreads = updateArrayItem(
                    state.threads,
                    threadIndex,
                    updatedThread
                )
                return buildNewThreadState(state, updatedThreads)
            }
            updatedThread = updateThreadComments(thread, threadComments)
            updatedThread.status = COMMENT_STATUSES.POSTING
            updatedThreads = updateArrayItem(
                state.threads,
                threadIndex,
                updatedThread
            )
            return {
                ...buildNewThreadState(state, updatedThreads),
                hasError: false
            }
        }
        case TypeKeys.NEW_COMMENT_DISPATCHED: {
            const { threadIndex, thread, threadComments } = getThreadData(
                state,
                data.markId
            )

            const updatedComments = [
                ...threadComments,
                {
                    id: data.commentId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: data.userId,
                    comment: data.source,
                    hasError: false
                }
            ]
            const updatedThread = updateThreadComments(thread, updatedComments)
            updatedThread.status = COMMENT_STATUSES.POSTING
            const updatedThreads = updateArrayItem(
                state.threads,
                threadIndex,
                updatedThread
            )
            return buildNewThreadState(state, updatedThreads)
        }
        case TypeKeys.CANCEL_NEW_COMMENT_THREAD_THREAD:
            return {
                ...state,
                threads: state.threads.filter((thread) => data.id !== thread.id)
            }
        case TypeKeys.CREATE_NEW_COMMENT_THREAD:
            return {
                ...state,
                threads: [
                    ...state.threads,
                    {
                        comments: [],
                        id: data.id,
                        markId: data.id,
                        index: data.index,
                        length: data.length,
                        status: COMMENT_STATUSES.DRAFT
                    }
                ]
            }
        case TypeKeys.HIGHLIGHT_COMMENT_THREAD:
            return { ...state, highlightedCommentMarkId: data.markId }
        case TypeKeys.UNHIGHLIGHT_COMMENT_THREAD:
            return { ...state, highlightedCommentMarkId: undefined }
        case TypeKeys.SELECT_COMMENT_THREAD:
            return {
                ...state,
                selectedCommentMarkId: data.markId,
                highlightedCommentMarkId: undefined
            }
        case TypeKeys.DESELECT_COMMENT_THREAD:
            return {
                ...state,
                selectedCommentMarkId: undefined,
                highlightedCommentMarkId: undefined
            }
        case TypeKeys.RESOLVE_THREAD:
            return {
                ...state,
                threads: state.threads.filter((thread) => data.id !== thread.id)
            }
        default:
            return state
    }
}
