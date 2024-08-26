import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Comment from '../../components/pages/Editor/Comments/CommentThread/Comment/Comment'
import { members } from '../mockData/members'
import { ContentType } from '../../interfaces/contentType'
import { getContent } from '../../data/comments/selectors'

Enzyme.configure({ adapter: new Adapter() })

const commentProps = {
    focused: false,
    highlighted: false,
    commentLength: 1,
    commentText: 'This is a comment',
    index: 0,
    userId: members[0].userId,
    updatedAt: new Date(),
    teamMembers: members,
    documentMembers: members,
    onFailure: jest.fn(),
    threadId: '1',
    commentId: '1',
    hasError: false
}

describe('Comment', () => {
    it('should be an instance of Comment', () => {
        const wrapper = shallow(<Comment {...commentProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(Comment)
    })
    it('should render the comment text', () => {
        const wrapper = shallow(<Comment {...commentProps} />)
        expect(wrapper.find('.commentText').text()).toEqual(
            commentProps.commentText
        )
    })
    it('should have a focused class when focused', () => {
        const focusedProps = {
            ...commentProps,
            focused: true
        }
        const wrapper = shallow(<Comment {...focusedProps} />)
        expect(wrapper.find('.comment').hasClass('focused')).toBe(true)
    })
    it('should have a highlighted class when hovered', () => {
        const highlightedProps = {
            ...commentProps,
            highlighted: true
        }
        const wrapper = shallow(<Comment {...highlightedProps} />)
        expect(wrapper.find('.comment').hasClass('highlighted')).toBe(true)
    })
    it('should render the users info', () => {
        const wrapper = shallow(<Comment {...commentProps} />)
        wrapper.setState({ user: members[0] })
        expect(wrapper.find('.commentName').text()).toEqual(members[0].name)
        expect(
            wrapper.find('.avatarContainer').children().length
        ).toBeGreaterThan(0)
    })
    it('should display how long ago the comment was made', () => {
        const wrapper = shallow(<Comment {...commentProps} />)
        expect(
            wrapper
                .find('.commentTime')
                .childAt(0)
                .prop('date')
        ).toEqual(commentProps.updatedAt)
    })
    it('should display how many collapsed threads there are if the comment is in the middle of a thread', () => {
        const collapsedProps = {
            ...commentProps,
            commentLength: 4,
            index: 1
        }
        const wrapper = shallow(<Comment {...collapsedProps} />)
        expect(wrapper.find('.additionalCommentText').text()).toEqual(
            `${collapsedProps.commentLength - 2} more comments`
        )
    })
    it('should not display a comment if the thread is collapsed, and it is not additional text', () => {
        const collapsedProps = {
            ...commentProps,
            commentLength: 4,
            index: 2
        }
        const wrapper = shallow(<Comment {...collapsedProps} />)
        expect(wrapper.children()).toHaveLength(0)
    })
    it('should convert new line characters to line breaks', () => {
        const multilineProps = {
            ...commentProps,
            focused: true,
            commentText: 'So many lines\nSo little time'
        }
        const wrapper = shallow(<Comment {...multilineProps} />)
        expect(wrapper.find('.commentText').html()).toContain(
            '<span>So many lines</span><br/>'
        )
    })
    it('should tokenize text content', () => {
        const source =
            'Hello <#1:User 1#> and <#2:User 2#>\nSo little time<@U2>'
        const content = getContent(source, members)

        expect(content).toEqual([
            { type: ContentType.Text, text: 'Hello ' },
            {
                type: ContentType.Mention,
                token: 'User 1',
                user: members[0],
                userId: 1
            },
            { type: ContentType.Text, text: ' and ' },
            {
                type: ContentType.Mention,
                token: 'User 2',
                user: members[1],
                userId: 2
            },
            { type: ContentType.Break },
            { type: ContentType.Text, text: 'So little time' },
            {
                type: ContentType.Mention,
                token: 'User 2',
                user: members[1],
                userId: 2
            }
        ])
    })
    it('should convert mention token into mentions', () => {
        const multilineProps = {
            ...commentProps,
            focused: true,
            commentText:
                'Hello <#1:User 1#> and <#2:User 2#>\nSo little time<@U2>><@U1><@ ><#0:Doc#>'
        }
        const wrapper = shallow(<Comment {...multilineProps} />)
        const commentText = wrapper.find('.commentText')
        expect(commentText.childAt(0).html()).toEqual('<span>Hello </span>')
        expect(commentText.childAt(1).props()).toEqual({
            email: 'null',
            name: 'User 1',
            avatarUrl: 'image.jpg',
            showHoverInfo: true
        })
        expect(commentText.childAt(2).html()).toEqual('<span> and </span>')
        expect(commentText.childAt(3).props()).toEqual({
            email: 'null',
            name: 'User 2',
            avatarUrl: 'image.jpg',
            showHoverInfo: true
        })
        expect(commentText.childAt(4).html()).toEqual('<br/>')
        expect(commentText.childAt(5).html()).toEqual(
            '<span>So little time</span>'
        )
        expect(commentText.childAt(6).props()).toEqual({
            email: 'null',
            name: 'User 2',
            avatarUrl: 'image.jpg',
            showHoverInfo: true
        })
        expect(commentText.childAt(7).html()).toEqual('<span>&gt;</span>')
        expect(commentText.childAt(8).props()).toEqual({
            email: 'null',
            name: 'User 1',
            avatarUrl: 'image.jpg',
            showHoverInfo: true
        })
        expect(commentText.childAt(9).html()).toEqual('<span>&lt;@ &gt;</span>')
        expect(commentText.childAt(10).props()).toEqual({
            documentName: 'Doc',
            members,
            showHoverInfo: true
        })
    })
    it('should not display the time if under a minute', () => {
        const wrapper = shallow(<Comment {...commentProps} />)
        expect(
            wrapper
                .find('.commentTime')
                .childAt(0)
                .html()
        ).toContain('Just now')
    })
    it('should display the time ', () => {
        const yearAgo = new Date()
        yearAgo.setMonth(yearAgo.getMonth() - 13)
        const oldComment = {
            ...commentProps,
            updatedAt: yearAgo
        }
        const wrapper = shallow(<Comment {...oldComment} />)
        expect(
            wrapper
                .find('.commentTime')
                .childAt(0)
                .html()
        ).toContain('1y ago')
    })
    it('should truncate long comments', () => {
        const wrapper = shallow(<Comment {...commentProps} />)
        wrapper.setState({ shouldTruncate: true })

        expect(wrapper.find('.ellipsesContainer')).toExist()
    })
    it('should retry on failure when retry is clicked', () => {
        const failureProps = {
            ...commentProps,
            hasError: true,
            onFailure: jest.fn()
        }
        const wrapper = shallow(<Comment {...failureProps} />)
        wrapper.find('#post-new-comment').simulate('click')
        wrapper.update()
        expect(failureProps.onFailure).toHaveBeenCalledWith(
            failureProps.threadId,
            failureProps.commentId,
            failureProps.commentText
        )
    })
})
