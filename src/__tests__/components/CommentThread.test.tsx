import { mount, shallow } from 'enzyme'
import Delta from 'quill-delta'
import React from 'react'
import QuillEvents from '../../../src/components/quill/modules/QuillEvents'
import Comment from '../../components/pages/Editor/Comments/CommentThread/Comment/Comment'
import CommentThread from '../../components/pages/Editor/Comments/CommentThread/CommentThread'
import resizeObserverService from '../../services/ResizeObserverService'
import { members } from '../mockData/members'
import { teamMembers } from '../mockData/teamMembers'
import { threads } from '../mockData/threads'

jest.mock('@invisionapp/helios', () => {
    return {
        Skeleton: ({ children }) => <div>{children}</div>
    }
})
jest.mock('../../components/quill/entries/Editor')
jest.mock('resize-observer-polyfill')
jest.mock('quill-cursors/src/cursors', () => {
    return {}
})
const commentThreadProps = {
    threadId: '1234',
    markId: '4567',
    currentUser: {
        id: 1,
        userId: 1,
        vendorId: 'cjpbltxuw000001205y8amxeo',
        teamId: 2,
        name: 'Admin User',
        email: 'admin@invisionapp.com',
        avatarId: '997cce58-6ea7-4ecc-aa7e-219f81c385a6',
        avatarUrl: 'https://assets.local.invision.works/assets/A_UUhjcV',
        isDefaultAvatar: false,
        lastViewed: new Date(),
        permissions: {
            canEdit: true,
            canComment: false
        },
        isViewing: true
    },
    highlighted: false,
    focused: false,
    onMouseEnter: jest.fn(),
    onMouseLeave: jest.fn(),
    onClick: jest.fn(),
    onPost: jest.fn(),
    onFailure: jest.fn(),
    retryNewComment: jest.fn(),
    onCancel: jest.fn(),
    onDeselect: jest.fn(),
    onThreadResize: jest.fn(),
    onResolve: jest.fn(),
    showMentionsList: jest.fn(),
    documentMembers: members,
    teamMembers,
    status: 'new',
    top: 0,
    resolved: false,
    mentions: {
        showMentionsList: false,
        left: 0,
        top: 0,
        members: []
    }
}

beforeEach(() => {
    commentThreadProps.onDeselect.mockClear()
    resizeObserverService.observedElements = new Map()
})

describe('Comment Thread', () => {
    it('should be an instance of CommentThread', () => {
        const wrapper = shallow(<CommentThread {...commentThreadProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(CommentThread)
    })
    it('should set the wrapperRef', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        expect(instance.wrapperRef).toBeTruthy()
    })
    it('should set up the ResizeObserver', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        const observeSpy = jest.spyOn(resizeObserverService.observer, 'observe')
        expect(observeSpy).toHaveBeenCalledWith(instance.wrapperRef)
    })
    it('should remove the ResizeObserver on unmount', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        const unobserveSpy = jest.spyOn(
            resizeObserverService.observer,
            'unobserve'
        )
        const disconnectSpy = jest.spyOn(
            resizeObserverService.observer,
            'disconnect'
        )
        wrapper.unmount()
        expect(unobserveSpy).toHaveBeenCalledWith(instance.wrapperRef)
        expect(disconnectSpy).toHaveBeenCalled()
    })
    it('should init Quill', () => {
        jest.useFakeTimers()
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        jest.runOnlyPendingTimers()
        expect(instance.commentQuillInstance).toBeTruthy()
        expect(instance.commentQuillInstance.focus).toHaveBeenCalled()
    })
    it('should remove the Quill text change event listener on unmount', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        wrapper.unmount()
        expect(instance.commentQuillInstance.off).toHaveBeenCalled()
        expect(instance.commentQuillInstance.off.mock.calls[0][0]).toEqual(
            QuillEvents.TEXT_CHANGE
        )
    })
    it('should not expand until text is entered', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        expect(wrapper.find('.commentActions').hasClass('textEntered')).toBe(
            false
        )
        expect(wrapper.find('.commentArea').hasClass('textEntered')).toBe(false)
        expect(wrapper.find('.commentEditor').hasClass('textEntered')).toBe(
            false
        )
    })
    it('should handle text change', () => {
        jest.useFakeTimers()
        const enteredText = 'Test string'
        const wrapper = mount<CommentThread>(
            <CommentThread {...commentThreadProps} />
        )
        const instance: any = wrapper.instance()
        jest.runOnlyPendingTimers()
        const delta = new Delta([{ insert: enteredText }])
        instance.commentQuillInstance.getContents = () => {
            return delta
        }
        instance._handleTextChange()
        wrapper.update()
        expect(wrapper.state().textContent).toEqual(delta)
        expect(instance.commentQuillInstance.focus).toHaveBeenCalled()
        expect(wrapper.find('.commentActions').hasClass('textEntered')).toBe(
            true
        )
        expect(wrapper.find('.commentArea').hasClass('textEntered')).toBe(true)
        expect(wrapper.find('.commentEditor').hasClass('textEntered')).toBe(
            true
        )
    })
    it('should handle cancel', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        instance._handleTextChange()
        wrapper.update()
        wrapper.find('#cancel-new-comment').simulate('click')
        expect(commentThreadProps.onCancel).toHaveBeenCalled()
    })
    it('should handle post', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        instance._handleTextChange()
        wrapper.update()
        wrapper.find('#post-new-comment').simulate('click')
        expect(commentThreadProps.onPost).toHaveBeenCalled()
    })
    it('should deselect when clicked outside of the thread', () => {
        const focusedProps = {
            ...commentThreadProps,
            focused: true
        }
        const wrapper = mount(<CommentThread {...focusedProps} />)
        const instance: any = wrapper.instance()
        instance._handleClickOutside({ target: new Text('test') })
        expect(commentThreadProps.onDeselect).toHaveBeenCalled()
    })
    it('should not show the resolved button when there are no comments', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        wrapper.update()
        expect(wrapper.find('#resolve-comment').hasClass('focused')).toBe(false)
    })
    it('should not deselect when clicking another thread', () => {
        const focusedProps = {
            ...commentThreadProps,
            focused: true
        }
        const wrapper = mount(<CommentThread {...focusedProps} />)
        const wrapper2 = mount(<CommentThread {...focusedProps} />)
        const instance: any = wrapper.instance()
        const instance2: any = wrapper2.instance()
        instance._handleClickOutside({ target: instance2.wrapperRef })
        expect(commentThreadProps.onDeselect).not.toHaveBeenCalled()
    })
    it('should not deselect when clicking another threads child element', () => {
        const focusedProps = {
            ...commentThreadProps,
            focused: true
        }
        const wrapper = mount(<CommentThread {...focusedProps} />)
        const wrapper2 = mount(<CommentThread {...focusedProps} />)
        const instance: any = wrapper.instance()
        const instance2: any = wrapper2.instance()
        instance._handleClickOutside({
            target: instance2.wrapperRef.firstChild.firstChild
        })
        expect(commentThreadProps.onDeselect).not.toHaveBeenCalled()
    })
    it('should position itself based on the top property', () => {
        const top = 50
        const newCommentThreadProps = {
            ...commentThreadProps,
            top
        }
        const wrapper = mount(<CommentThread {...newCommentThreadProps} />)
        expect(wrapper.find('.commentContainer').prop('style')).toEqual({
            position: 'relative',
            top: 50
        })
    })
    it('should accept a position property', () => {
        const top = 50
        const absoluteThreadProps = {
            ...commentThreadProps,
            top,
            position: 'absolute' as 'absolute'
        }
        const wrapper = mount(<CommentThread {...absoluteThreadProps} />)
        expect(wrapper.find('.commentContainer').prop('style')).toEqual({
            position: 'absolute',
            top: 50
        })
    })
    it('should render comments', () => {
        const withCommentProps = {
            ...commentThreadProps,
            comments: threads[0].comments
        }
        const wrapper = mount(<CommentThread {...withCommentProps} />)
        expect(wrapper.find('.commentContainer').hasClass('hasComments')).toBe(
            true
        )
        expect(wrapper.find(Comment)).toHaveLength(threads[0].comments.length)
    })
    it('should not render comments when comments array is empty', () => {
        const emptyCommentProps = {
            ...commentThreadProps,
            comments: []
        }
        const wrapper = mount(<CommentThread {...emptyCommentProps} />)
        expect(wrapper.find(Comment)).toHaveLength(
            emptyCommentProps.comments.length
        )
    })
    it('should handle resize', () => {
        const wrapper = mount(<CommentThread {...commentThreadProps} />)
        const instance: any = wrapper.instance()
        instance._handleThreadResize()
        wrapper.update()
        const componentPosition = instance.wrapperRef.getBoundingClientRect()
        expect(commentThreadProps.onThreadResize).toHaveBeenCalledWith(
            commentThreadProps.threadId,
            componentPosition
        )
    })
    it('should set the open slowly state to true correctly', () => {
        const prevProps = {
            ...commentThreadProps,
            collapsed: true
        }
        const nextProps = {
            ...commentThreadProps,
            collapsed: false,
            focused: true
        }
        const state = {
            mounted: false,
            markResolved: false,
            openSlowly: false
        }
        const thread = new CommentThread(nextProps)
        thread.setState = jest.fn()
        thread.componentDidUpdate(prevProps, state)
        expect(thread.setState).toHaveBeenCalledWith({
            openSlowly: true
        })
    })
    it('should set the open slowly state to false correctly', () => {
        const prevProps = {
            ...commentThreadProps,
            focused: true
        }
        const nextProps = {
            ...commentThreadProps,
            focused: false
        }
        const state = {
            mounted: false,
            markResolved: false,
            openSlowly: false
        }
        const thread = new CommentThread(nextProps)
        thread.setState = jest.fn()
        thread.componentDidUpdate(prevProps, state)
        expect(thread.setState).toHaveBeenCalledWith({
            openSlowly: false
        })
    })
})
