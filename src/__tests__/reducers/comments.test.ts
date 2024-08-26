import sinon from 'sinon'
import { TypeKeys } from '../../data/ActionTypes'
import { COMMENT_STATUSES } from '../../constants/comments'
import comments, { initialState } from '../../data/comments/reducers'
import { threads } from '../mockData/threads'
import { Thread } from '../../interfaces/thread'

describe('Comments reducer', () => {
    describe('NO_ACTION', () => {
        it('should return the initial state', () => {
            expect(
                comments(undefined, {
                    type: 'NO_ACTION'
                })
            ).toEqual(initialState)
        })
    })
    describe('CREATE_NEW_COMMENT_THREAD', () => {
        it('should set the state for a new comment', () => {
            const index = 0
            const length = 3
            const id = '1'
            expect(
                comments(undefined, {
                    type: TypeKeys.CREATE_NEW_COMMENT_THREAD,
                    data: {
                        id,
                        index,
                        length
                    }
                })
            ).toEqual({
                ...initialState,
                threads: [
                    ...initialState.threads,
                    {
                        comments: [],
                        id,
                        markId: id,
                        index,
                        length,
                        status: COMMENT_STATUSES.DRAFT
                    }
                ]
            })
        })
    })
    describe('CANCEL_NEW_COMMENT_THREAD_THREAD', () => {
        it('should cancel a new comment', () => {
            expect(
                comments(undefined, {
                    type: TypeKeys.CANCEL_NEW_COMMENT_THREAD_THREAD,
                    data: {}
                })
            ).toEqual(initialState)
        })
    })
    describe('NEW_COMMENT_DISPATCHED', () => {
        it('should set a comment as posting', () => {
            const commentId = 'newCommentId'
            const id = 'newThreadId'
            const markId = 'newMarkId'
            const comment = 'Hey, what a cool comment'
            const userId = 1
            const date = new Date()
            const clock = sinon.useFakeTimers(date.getTime())
            expect(
                comments(
                    {
                        ...initialState,
                        threads: [
                            {
                                status: COMMENT_STATUSES.DRAFT,
                                resolved: false,
                                id,
                                markId,
                                startedAt: date,
                                comments: []
                            }
                        ]
                    },
                    {
                        type: TypeKeys.NEW_COMMENT_DISPATCHED,
                        data: {
                            commentId,
                            id,
                            source: comment,
                            userId,
                            markId
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                threads: [
                    {
                        status: COMMENT_STATUSES.POSTING,
                        resolved: false,
                        id,
                        markId,
                        startedAt: date,
                        comments: [
                            {
                                id: commentId,
                                createdAt: date,
                                comment,
                                updatedAt: date,
                                userId,
                                hasError: false
                            }
                        ]
                    }
                ]
            })
            clock.restore()
        })
    })
    describe('NEW_COMMENT_POSTED', () => {
        it('should post a new comment', () => {
            const commentId = 'newCommentId'
            const tempId = 'tempCommentId'
            const threadId = 'newThreadId'
            const markId = 'newMarkId'
            const userId = '1'
            const date = new Date()
            const clock = sinon.useFakeTimers(date.getTime())
            const comment = 'Hi there everyone.'
            expect(
                comments(
                    {
                        ...initialState,
                        threads: [
                            {
                                status: COMMENT_STATUSES.DRAFT,
                                resolved: false,
                                id: threadId,
                                markId,
                                startedAt: date,
                                comments: [
                                    {
                                        id: tempId,
                                        createdAt: date,
                                        updatedAt: date,
                                        userId,
                                        hasError: false,
                                        comment
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: TypeKeys.NEW_COMMENT_POSTED,
                        data: {
                            commentId,
                            tempId,
                            id: threadId,
                            markId
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                threads: [
                    {
                        status: COMMENT_STATUSES.CREATED,
                        resolved: false,
                        id: threadId,
                        markId,
                        startedAt: date,
                        comments: [
                            {
                                id: commentId,
                                createdAt: date,
                                updatedAt: date,
                                userId,
                                hasError: false,
                                comment
                            }
                        ]
                    }
                ]
            })
            clock.restore()
        })
        it('should return initial state if the temporary ID is not found when posting a new comment', () => {
            const commentId = 'newCommentId'
            const tempId = 'tempCommentId'
            const threadId = 'newThreadId'
            const markId = 'newMarkId'
            const userId = '1'
            const date = new Date()
            const clock = sinon.useFakeTimers(date.getTime())
            const comment = 'Hi there everyone.'
            const postingInitialState = {
                ...initialState,
                threads: [
                    {
                        status: COMMENT_STATUSES.DRAFT,
                        resolved: false,
                        id: threadId,
                        markId,
                        startedAt: date,
                        comments: [
                            {
                                id: tempId,
                                createdAt: date,
                                updatedAt: date,
                                userId,
                                hasError: false,
                                comment
                            }
                        ]
                    }
                ]
            }
            expect(
                comments(postingInitialState, {
                    type: TypeKeys.NEW_COMMENT_POSTED,
                    data: {
                        commentId,
                        tempId: 'cantFindMe',
                        id: threadId,
                        markId
                    }
                })
            ).toEqual(postingInitialState)
            clock.restore()
        })
    })
    describe('NEW_COMMENT_ERROR', () => {
        it('should have state hasError on a comment error', () => {
            const tempId = 'newCommentId'
            const threadId = 'newThreadId'
            const markId = 'newMarkId'
            const comment = 'Hey, what a cool comment'
            const userId = '1'
            const date = new Date()
            const clock = sinon.useFakeTimers(date.getTime())
            expect(
                comments(
                    {
                        ...initialState,
                        hasError: true,
                        threads: [
                            {
                                status: COMMENT_STATUSES.DRAFT,
                                resolved: false,
                                id: threadId,
                                markId,
                                startedAt: date,
                                comments: [
                                    {
                                        id: tempId,
                                        createdAt: date,
                                        comment,
                                        updatedAt: date,
                                        userId,
                                        hasError: true
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: TypeKeys.NEW_COMMENT_ERROR,
                        data: {
                            tempId,
                            markId,
                            id: threadId
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                hasError: true,
                threads: [
                    {
                        status: COMMENT_STATUSES.DRAFT,
                        resolved: false,
                        id: threadId,
                        markId,
                        startedAt: date,
                        comments: [
                            {
                                id: tempId,
                                createdAt: date,
                                updatedAt: date,
                                userId,
                                comment,
                                hasError: true
                            }
                        ]
                    }
                ]
            })
            clock.restore()
        })
        it('should return initial state if a comment is not found on a comment error', () => {
            const tempId = 'newCommentId'
            const threadId = 'newThreadId'
            const markId = 'newMarkId'
            const comment = 'Hey, what a cool comment'
            const userId = '1'
            const date = new Date()
            const clock = sinon.useFakeTimers(date.getTime())
            const errorInitialState = {
                ...initialState,
                hasError: true,
                threads: [
                    {
                        status: COMMENT_STATUSES.DRAFT,
                        resolved: false,
                        id: threadId,
                        markId,
                        startedAt: date,
                        comments: [
                            {
                                id: tempId,
                                createdAt: date,
                                comment,
                                updatedAt: date,
                                userId,
                                hasError: true
                            }
                        ]
                    }
                ]
            }
            expect(
                comments(errorInitialState, {
                    type: TypeKeys.NEW_COMMENT_ERROR,
                    data: {
                        tempId: 'notHere',
                        markId,
                        id: threadId
                    }
                })
            ).toEqual(errorInitialState)
            clock.restore()
        })
    })
    describe('HIGHLIGHT_COMMENT_THREAD', () => {
        it('should set highlightedCommentMarkId', () => {
            expect(
                comments(undefined, {
                    type: TypeKeys.HIGHLIGHT_COMMENT_THREAD,
                    data: {
                        markId: '1'
                    }
                })
            ).toEqual({
                ...initialState,
                highlightedCommentMarkId: '1'
            })
        })
    })
    describe('UNHIGHLIGHT_COMMENT_THREAD', () => {
        it('should unset highlightedCommentMarkId', () => {
            expect(
                comments(undefined, {
                    type: TypeKeys.UNHIGHLIGHT_COMMENT_THREAD,
                    data: {}
                })
            ).toEqual({
                ...initialState,
                highlightedCommentMarkId: undefined
            })
        })
    })
    describe('SELECT_COMMENT_THREAD', () => {
        it('should set selectedCommentMarkId', () => {
            expect(
                comments(undefined, {
                    type: TypeKeys.SELECT_COMMENT_THREAD,
                    data: {
                        markId: '1'
                    }
                })
            ).toEqual({
                ...initialState,
                selectedCommentMarkId: '1',
                highlightedCommentMarkId: undefined
            })
        })

        it('should unset selectedCommentMarkId', () => {
            expect(
                comments(undefined, {
                    type: TypeKeys.DESELECT_COMMENT_THREAD,
                    data: {}
                })
            ).toEqual({
                ...initialState,
                selectedCommentMarkId: undefined,
                highlightedCommentMarkId: undefined
            })
        })
    })
    describe('SET_THREADS', () => {
        it('should set all threads', () => {
            expect(
                comments(undefined, {
                    type: TypeKeys.SET_THREADS,
                    data: {
                        threads
                    }
                })
            ).toEqual({
                ...initialState,
                threads
            })
        })
        it('should keep comments that have errors', () => {
            const errorComment = {
                id: 'firstErrorId',
                createdAt: new Date('2018-04-24T20:09:17.175Z'),
                source: 'First Error Comment',
                comment: 'First Error Comment',
                updatedAt: new Date('2018-04-24T20:09:17.175Z'),
                userId: 1,
                hasError: true
            }
            const threadsWithErrors = [
                {
                    status: COMMENT_STATUSES.DRAFT,
                    resolved: false,
                    id: '1',
                    markId: '1',
                    startedAt: new Date('2018-04-24T20:09:17.175Z'),
                    comments: [errorComment]
                }
            ]
            const stateWithErrors = comments(
                {
                    ...initialState,
                    threads: [...initialState.threads, ...threadsWithErrors]
                },
                {
                    type: TypeKeys.SET_THREADS,
                    data: {
                        threads
                    }
                }
            )
            expect(stateWithErrors.threads[0].comments).toContain(errorComment)
        })
        it('should keep threads that are instate when setting threads', () => {
            const threadInState: Thread = {
                id: 'threadInStateId',
                markId: 'threadInStateId',
                comments: [],
                status: COMMENT_STATUSES.DRAFT,
                resolved: false,
                startedAt: new Date()
            }
            expect(
                comments(
                    { ...initialState, threads: [threadInState] },
                    {
                        type: TypeKeys.SET_THREADS,
                        data: {
                            threads
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                threads: [...threads, threadInState]
            })
        })
    })
    describe('RESOLVE_THREAD', () => {
        it('should filter resolved threads', () => {
            const threadId = '123'
            const markId = '456'
            const date = new Date()
            expect(
                comments(
                    {
                        ...initialState,
                        threads: [
                            {
                                status: COMMENT_STATUSES.DRAFT,
                                resolved: false,
                                id: threadId,
                                markId,
                                startedAt: date,
                                comments: []
                            }
                        ]
                    },
                    {
                        type: TypeKeys.RESOLVE_THREAD,
                        data: {
                            id: threadId
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                threads: []
            })
        })
        it('should retry a comment', () => {
            const threadId = '123'
            const markId = '456'
            const date = new Date()
            expect(
                comments(
                    {
                        ...initialState,
                        threads: [
                            {
                                status: COMMENT_STATUSES.DRAFT,
                                resolved: false,
                                id: threadId,
                                markId,
                                startedAt: date,
                                comments: []
                            }
                        ]
                    },
                    {
                        type: TypeKeys.RESOLVE_THREAD,
                        data: {
                            id: threadId
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                threads: []
            })
        })
    })
    describe('NEW_COMMENT_TRY_AGAIN', () => {
        it('should retry a new comment', () => {
            const tempId = 'tempCommentId'
            const markId = 'newMarkId'
            const userId = '1'
            const date = new Date()
            const clock = sinon.useFakeTimers(date.getTime())
            const comment = 'Hi there everyone.'
            expect(
                comments(
                    {
                        ...initialState,
                        threads: [
                            {
                                status: COMMENT_STATUSES.DRAFT,
                                resolved: false,
                                id: markId,
                                markId,
                                startedAt: date,
                                comments: [
                                    {
                                        id: tempId,
                                        createdAt: date,
                                        updatedAt: date,
                                        userId,
                                        hasError: false,
                                        comment
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        type: TypeKeys.NEW_COMMENT_TRY_AGAIN,
                        data: {
                            text: comment,
                            commentId: tempId,
                            id: markId,
                            markId
                        }
                    }
                )
            ).toEqual({
                ...initialState,
                threads: [
                    {
                        status: COMMENT_STATUSES.POSTING,
                        resolved: false,
                        id: markId,
                        markId,
                        startedAt: date,
                        comments: [
                            {
                                id: tempId,
                                createdAt: date,
                                updatedAt: date,
                                userId,
                                hasError: false,
                                comment
                            }
                        ]
                    }
                ]
            })
            clock.restore()
        })
    })
})
