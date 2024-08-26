import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Delta from 'quill-delta'
import React from 'react'
import Comments from '../../components/pages/Editor/Comments/Comments'
import CommentThread from '../../components/pages/Editor/Comments/CommentThread/CommentThread'
import { GlobalCommentMarkingModule } from '../../components/quill/modules/CommentMarking'
import quillProvider from '../../components/quill/provider'
import {
    COMMENT_STATUSES,
    DEFAULT_THREAD_HEIGHT,
    DEFAULT_THREAD_PADDING
} from '../../constants/comments'
import { members } from '../mockData/members'
import { mockQuill } from '../mockData/mockQuill'
import { teamMembers } from '../mockData/teamMembers'
import { threads } from '../mockData/threads'
import { documentState } from '../reducers/currentDocument.test'
import { createFakeMark } from '../utils'
Enzyme.configure({ adapter: new Adapter() })
const Quill = mockQuill

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => 'uuid')
    }
})
jest.mock('../../data/services/PagesApiService', () => {
    return {
        resolveThread: jest.fn()
    }
})
jest.mock('quill-cursors/src/cursors', () => {
    return {}
})
window.addEventListener = jest.fn()
window.removeEventListener = jest.fn()

const defaultCommentsProps = {
    postNewComment: jest.fn(),
    retryNewComment: jest.fn(),
    selectCommentThread: jest.fn(),
    deselectCommentThread: jest.fn(),
    highlightCommentThread: jest.fn(),
    unhighlightCommentThread: jest.fn(),
    clearMentionList: jest.fn(),
    resolveThread: jest.fn(),
    retryNewThread: jest.fn(),
    cancelNewCommentThread: jest.fn(),
    postNewThread: jest.fn(),
    comments: {
        threads: []
    },
    elementCoordinates: {
        navigation: {
            height: 70
        }
    },
    currentDocument: {
        ...documentState,
        members,
        teamMembers,
        contents: {
            revision: 1,
            delta: {}
        }
    },
    currentUser: {
        userId: 1,
        companyId: 1,
        teamId: '2',
        sessionId: 'string',
        name: 'The Commentor',
        email: 'luv2comment@hotmail.com'
    },
    selection: {
        index: 0,
        selectionLength: 2,
        selectionType: 0,
        isFirstLine: false,
        text: 'Text to comment on',
        blockquote: false,
        header: null,
        codeBlock: false,
        list: null,
        bold: false,
        italic: false,
        link: null,
        strike: false,
        underline: false
    },
    mentions: {}
}

let commentsProps: any = defaultCommentsProps

const clearCommentMarking = jest.fn()
const selectCommentMarking = jest.fn()
const highlightCommentMarking = jest.fn()
const unhighlightCommentMarking = jest.fn()
const removeCommentMarking = jest.fn()

const id = '1234'
const markId = '5678'
const commentText = 'This is a new comment!'

beforeEach(() => {
    clearCommentMarking.mockClear()
    selectCommentMarking.mockClear()
    highlightCommentMarking.mockClear()
    unhighlightCommentMarking.mockClear()
    removeCommentMarking.mockClear()
    commentsProps.unhighlightCommentThread.mockClear()
    commentsProps.cancelNewCommentThread.mockClear()
    commentsProps.postNewComment.mockClear()
    commentsProps.selectCommentThread.mockClear()
    commentsProps.highlightCommentThread.mockClear()
    commentsProps.deselectCommentThread.mockClear()
    commentsProps.resolveThread.mockClear()
    commentsProps.cancelNewCommentThread.mockClear()
    commentsProps.postNewThread.mockClear()

    Quill.focus = jest.fn()
    Quill.setSelection = jest.fn()
    Quill.getLength = jest.fn(() => 2)

    GlobalCommentMarkingModule.clear = clearCommentMarking
    GlobalCommentMarkingModule.select = selectCommentMarking
    GlobalCommentMarkingModule.highlight = highlightCommentMarking
    GlobalCommentMarkingModule.unhighlight = unhighlightCommentMarking
    GlobalCommentMarkingModule.remove = removeCommentMarking

    quillProvider.setQuill(Quill)
    commentsProps = defaultCommentsProps
})

describe('Comments', () => {
    it('should be an instance of Comments', () => {
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(Comments)
    })
    it('should add a resize event listener', () => {
        shallow<Comments>(<Comments {...commentsProps} />)
        expect(addEventListener).toHaveBeenCalled()
    })
    it('should remove the resize event listener on unmount', () => {
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        wrapper.unmount()
        expect(removeEventListener).toHaveBeenCalled()
    })
    it('should show the new comments dialog', () => {
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const newComments = {
            threads: [
                {
                    comments: [],
                    id,
                    markId,
                    index: 1,
                    length: 2,
                    status: COMMENT_STATUSES.DRAFT
                }
            ]
        }
        createFakeMark(markId)
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: newComments })
        expect(wrapper.find(CommentThread)).toHaveLength(1)
    })
    it('should cancel a new comment on click', () => {
        const index = 0
        const length = 2
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const newComments = {
            threads: [
                {
                    comments: [],
                    id,
                    markId,
                    index,
                    length,
                    status: COMMENT_STATUSES.DRAFT
                }
            ]
        }
        createFakeMark(markId)
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: newComments })
        wrapper
            .find(CommentThread)
            .dive()
            .find('#cancel-new-comment')
            .simulate('click', {
                stopPropagation() {
                    //
                }
            })
        expect(commentsProps.cancelNewCommentThread).toHaveBeenCalledWith(id)
    })

    it('should deselect existing thread on cancel click', () => {
        const index = 0
        const length = 2
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const newComments = {
            threads: [
                {
                    comments: [],
                    id,
                    markId,
                    index,
                    length
                }
            ]
        }
        createFakeMark(markId)
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: newComments })
        wrapper
            .find(CommentThread)
            .dive()
            .find('#cancel-new-comment')
            .simulate('click', {
                stopPropagation() {
                    //
                }
            })
        expect(commentsProps.unhighlightCommentThread).toHaveBeenCalled()
        expect(commentsProps.deselectCommentThread).toHaveBeenCalled()
        expect(clearCommentMarking).toHaveBeenCalledWith()
    })
    it('should post a new thread on click', () => {
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }

        const newComments = {
            threads: [
                {
                    comments: [],
                    id,
                    markId,
                    status: COMMENT_STATUSES.DRAFT
                }
            ]
        }

        createFakeMark(markId)

        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })

        wrapper.setProps({ comments: newComments })
        wrapper
            .find(CommentThread)
            .dive()
            .find('#post-new-comment')
            .simulate('click')

        expect(commentsProps.postNewThread).toHaveBeenCalledWith(
            markId,
            '',
            '',
            commentsProps.currentUser.userId,
            'uuid'
        )
    })
    it('should post a new comment on click', () => {
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }

        const newComments = {
            threads: [
                {
                    comments: [],
                    id,
                    markId,
                    status: COMMENT_STATUSES.CREATED
                }
            ]
        }

        createFakeMark(markId)

        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })

        wrapper.setProps({ comments: newComments })
        wrapper
            .find(CommentThread)
            .dive()
            .find('#post-new-comment')
            .simulate('click')

        expect(commentsProps.postNewComment).toHaveBeenCalledWith(
            id,
            markId,
            '',
            '',
            commentsProps.currentUser.userId,
            'uuid'
        )
    })
    it('should highlight text threads on select', () => {
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        const inst: any = wrapper.instance()
        inst._onThreadSelect(markId)
        wrapper.update()
        expect(selectCommentMarking).toHaveBeenCalledWith(markId)
    })
    it('should unhighlight text threads on deselect', () => {
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        const inst: any = wrapper.instance()
        inst._onThreadDeselect(id)
        expect(clearCommentMarking).toHaveBeenCalledWith()
        expect(commentsProps.unhighlightCommentThread).toHaveBeenCalledWith()
        expect(commentsProps.deselectCommentThread).toHaveBeenCalledWith()
    })
    it('should cancel new thread when text is empty thread on deselect', () => {
        const newComments = {
            threads: [
                {
                    comments: [],
                    id,
                    markId,
                    index: 1,
                    length: 2,
                    status: COMMENT_STATUSES.DRAFT
                }
            ]
        }

        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />)
        wrapper.setProps({ comments: newComments })

        const inst: any = wrapper.instance()
        inst._onThreadDeselect(id, COMMENT_STATUSES.DRAFT)
        expect(commentsProps.cancelNewCommentThread).toHaveBeenCalledWith(id)
    })
    it('should highlight text threads on mouse enter', () => {
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        const inst: any = wrapper.instance()
        inst._onThreadMouseEnter(markId)
        expect(highlightCommentMarking).toHaveBeenCalledWith(markId)
        expect(commentsProps.highlightCommentThread).toHaveBeenCalledWith(
            markId
        )
    })
    it('should unhighlight text threads on mouse exit', () => {
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        const inst: any = wrapper.instance()
        inst._onThreadMouseLeave(markId)
        expect(unhighlightCommentMarking).toHaveBeenCalledWith(markId)
        expect(commentsProps.unhighlightCommentThread).toHaveBeenCalledWith()
    })
    it('should not unhighlight text threads on mouse exit if the current thread is selected', () => {
        const selectedProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: []
            }
        }
        const wrapper = shallow<Comments>(<Comments {...selectedProps} />)
        const inst: any = wrapper.instance()
        inst._onThreadMouseLeave(markId)
        expect(unhighlightCommentMarking).not.toHaveBeenCalled()
        expect(commentsProps.unhighlightCommentThread).not.toHaveBeenCalled()
    })
    it('should create a thread', () => {
        const createProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        id,
                        markId,
                        status: COMMENT_STATUSES.DRAFT
                    }
                ]
            }
        }
        const wrapper = shallow<Comments>(<Comments {...createProps} />)
        const inst: any = wrapper.instance()
        inst._createComment(id, new Delta([{ insert: commentText }]))
        expect(commentsProps.postNewThread).toHaveBeenCalledWith(
            markId,
            commentText,
            commentText,
            commentsProps.currentUser.userId,
            'uuid'
        )
    })
    it('should create a comment on a thread', () => {
        const createProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        id,
                        markId,
                        status: COMMENT_STATUSES.CREATED
                    }
                ]
            }
        }
        const wrapper = shallow<Comments>(<Comments {...createProps} />)
        const inst: any = wrapper.instance()
        inst._createComment(id, new Delta([{ insert: commentText }]))
        expect(commentsProps.postNewComment).toHaveBeenCalledWith(
            id,
            markId,
            commentText,
            commentText,
            commentsProps.currentUser.userId,
            'uuid'
        )
    })
    it('should cancel a new comment', () => {
        const index = 0
        const length = 2
        const cancelProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        id,
                        markId,
                        index,
                        length,
                        status: COMMENT_STATUSES.DRAFT
                    }
                ]
            }
        }
        const wrapper = shallow<Comments>(<Comments {...cancelProps} />)
        const inst: any = wrapper.instance()
        inst._cancelComment(id)
        expect(commentsProps.cancelNewCommentThread).toHaveBeenCalledWith(id)
    })
    it('should not cancel a new comment if the status is not draft', () => {
        const index = 0
        const length = 2
        const cancelProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        id,
                        markId,
                        index,
                        length,
                        status: 'ANYTHING BUT DRAFT'
                    }
                ]
            }
        }
        const wrapper = shallow<Comments>(<Comments {...cancelProps} />)
        const inst: any = wrapper.instance()
        inst._cancelComment(id)
        expect(commentsProps.cancelNewCommentThread).not.toHaveBeenCalledWith(
            id,
            index,
            length
        )
    })
    it('should sort comments', () => {
        threads.forEach((thread) => {
            createFakeMark(thread.markId)
        })
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const commentsToSort = {
            threads
        }
        createFakeMark(markId)
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: commentsToSort })
        expect(wrapper.state().sortedThreads).toBeDefined()
        expect(wrapper.state().sortedThreads).toHaveLength(threads.length)
        expect(wrapper.state().sortedThreads[0].top).toBeLessThan(
            wrapper.state().sortedThreads[1].top
        )
    })
    it('should sort comments on resize', () => {
        threads.forEach((thread) => {
            createFakeMark(thread.markId)
        })
        commentsProps = {
            ...commentsProps,
            comments: {
                threads
            }
        }
        createFakeMark(markId)
        const wrapper = shallow<Comments>(<Comments {...commentsProps} />)
        const inst: any = wrapper.instance()
        inst._onThreadResize()
        wrapper.update()
        expect(wrapper.state().sortedThreads).toBeDefined()
        expect(wrapper.state().sortedThreads).toHaveLength(threads.length)
        expect(wrapper.state().sortedThreads[0].top).toBeLessThan(
            wrapper.state().sortedThreads[1].top
        )
    })
    it('should hide comments without a mark', () => {
        threads.forEach((thread) => {
            createFakeMark(thread.markId)
        })
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const commentsToSort = {
            threads: [
                ...threads,
                {
                    resolved: false,
                    id: '4',
                    startedAt: '2018-04-24T20:09:17.159Z',
                    comments: [
                        {
                            commentId: 'firstSecondCommentId',
                            isThreadStarter: true,
                            madeAt: '2018-04-24T20:09:17.175Z',
                            source: 'First Comment',
                            text: 'First Comment',
                            updatedAt: '2018-04-24T20:09:17.175Z',
                            userId: 2
                        },
                        {
                            commentId: 'secondSecondCommentId',
                            isThreadStarter: true,
                            madeAt: '2018-04-24T20:09:17.175Z',
                            source: 'Second Comment',
                            text: 'Second Comment',
                            updatedAt: '2018-04-24T20:09:17.175Z',
                            userId: 2
                        }
                    ]
                }
            ]
        }
        createFakeMark(markId)
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: commentsToSort })
        expect(wrapper.state().sortedThreads).toBeDefined()
        expect(wrapper.state().sortedThreads).toHaveLength(
            commentsToSort.threads.length - 1
        )
        expect(wrapper.state().sortedThreads[3]).not.toBeDefined()
    })
    it('should sort comments before the selectedComment', () => {
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const commentsToSort = {
            selectedCommentMarkId: threads[1].markId,
            threads
        }
        threads.forEach((thread) => {
            createFakeMark(thread.markId)
        })
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: commentsToSort })
        expect(wrapper.state().sortedThreads).toBeDefined()
        expect(wrapper.state().sortedThreads).toHaveLength(threads.length)
        expect(wrapper.state().sortedThreads[0].top).toBe(
            wrapper.state().sortedThreads[1].top -
                DEFAULT_THREAD_HEIGHT -
                DEFAULT_THREAD_PADDING
        )
    })
    it('should sort multiple comments before the selectedComment', () => {
        const app = document.createElement('div')
        app.setAttribute('id', 'app')
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const commentsToSort = {
            selectedCommentMarkId: threads[2].markId,
            threads
        }
        threads.forEach((thread) => {
            createFakeMark(thread.markId)
        })
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: commentsToSort })
        expect(wrapper.state().sortedThreads).toBeDefined()
        expect(wrapper.state().sortedThreads).toHaveLength(threads.length)
        expect(wrapper.state().sortedThreads[0].top).toBe(
            wrapper.state().sortedThreads[1].top -
                DEFAULT_THREAD_HEIGHT -
                DEFAULT_THREAD_PADDING
        )
        expect(wrapper.state().sortedThreads[1].top).toBe(
            wrapper.state().sortedThreads[2].top -
                DEFAULT_THREAD_HEIGHT -
                DEFAULT_THREAD_PADDING
        )
    })
    it('should resolve a thread', () => {
        const resolveProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        markId
                    }
                ]
            }
        }

        const wrapper = shallow<Comments>(<Comments {...resolveProps} />)
        const inst: any = wrapper.instance()
        inst._onResolve(id)
        expect(commentsProps.resolveThread).toHaveBeenCalledWith(id)
    })
    it('should retry a comment', () => {
        const commentId = 'commentId'
        const text = 'Test comment text'
        const retryProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        id,
                        markId,
                        comments: [
                            {
                                commentId,
                                hasError: true
                            },
                            {
                                commentId,
                                hasError: false
                            }
                        ]
                    }
                ]
            }
        }

        const wrapper = shallow<Comments>(<Comments {...retryProps} />)
        const inst: any = wrapper.instance()
        inst._retryComment(id, commentId, text)
        expect(commentsProps.retryNewComment).toHaveBeenCalledWith(
            id,
            markId,
            commentId,
            text
        )
    })
    it('should retry an entire comment thread', () => {
        const commentId = 'commentId'
        const text = 'Test comment text'
        const retryProps = {
            ...commentsProps,
            comments: {
                selectedCommentMarkId: markId,
                threads: [
                    {
                        id,
                        markId,
                        comments: [
                            {
                                commentId,
                                hasError: true
                            }
                        ]
                    }
                ]
            }
        }

        const wrapper = shallow<Comments>(<Comments {...retryProps} />)
        const inst: any = wrapper.instance()
        inst._retryComment(id, commentId, text)
        expect(commentsProps.retryNewThread).toHaveBeenCalledWith(
            markId,
            commentId,
            text
        )
    })
    it('should correctly collapse comments alongside large embeds', () => {
        const largeEmbed = document.createElement('div')
        largeEmbed.classList.add('blockEmbed')
        largeEmbed.getBoundingClientRect = jest.fn(() => ({
            top: -1000,
            height: 5000
        }))
        largeEmbed.setAttribute('data-size', 'large')
        document.body.appendChild(largeEmbed)
        commentsProps = {
            ...commentsProps,
            comments: {
                threads: []
            }
        }
        const commentsToSort = {
            selectedCommentMarkId: threads[2].markId,
            threads
        }
        threads.forEach((thread) => {
            createFakeMark(thread.markId)
        })
        const wrapper = shallow<Comments, {}>(<Comments {...commentsProps} />, {
            lifecycleExperimental: true
        })
        wrapper.setProps({ comments: commentsToSort })
        expect(wrapper.state().sortedThreads[0].collapsed).toBeTruthy()
        expect(wrapper.state().sortedThreads[1].collapsed).toBeTruthy()
        expect(wrapper.state().sortedThreads[2].collapsed).not.toBeDefined()
    })
})
