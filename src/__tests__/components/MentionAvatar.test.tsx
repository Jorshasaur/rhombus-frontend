import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import MentionAvatar from '../../components/pages/Editor/Mentions/MentionAvatar/MentionAvatar'
import { members } from '../mockData/members'

Enzyme.configure({ adapter: new Adapter() })

const mentionAvatarProps = {
    member: members[0],
    width: 28
}

describe('MentionsList', () => {
    it('should be an instance of MentionsList', () => {
        const wrapper = shallow(<MentionAvatar {...mentionAvatarProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(MentionAvatar)
    })
    it('should render the image', () => {
        const wrapper = shallow(<MentionAvatar {...mentionAvatarProps} />)
        expect(
            wrapper.find('.avatarContainer').prop('style').backgroundImage
        ).toEqual(`url(${mentionAvatarProps.member.avatarUrl})`)
    })
    it('should render the user initials when no name is present', () => {
        mentionAvatarProps.member.avatarUrl = ''
        const wrapper = shallow(<MentionAvatar {...mentionAvatarProps} />)
        expect(
            wrapper
                .find('.avatarContainer')
                .childAt(0)
                .childAt(0)
                .childAt(0)
                .text()
        ).toEqual('U1')
    })
})
