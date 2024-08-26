import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import DocumentMentionAvatar from '../../components/pages/Editor/Mentions/DocumentMentionAvatar/DocumentMentionAvatar'
import { members } from '../mockData/members'

Enzyme.configure({ adapter: new Adapter() })

const documentMentionAvatarProps = {
    members,
    width: 28
}

describe('MentionsList', () => {
    it('should be an instance of MentionsList', () => {
        const wrapper = shallow(
            <DocumentMentionAvatar {...documentMentionAvatarProps} />
        )
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(DocumentMentionAvatar)
    })
    it('should have a multipleMembers class for multiple members', () => {
        const wrapper = shallow(
            <DocumentMentionAvatar {...documentMentionAvatarProps} />
        )
        expect(
            wrapper.find('.documentMentionAvatar').hasClass('multipleMembers')
        ).toEqual(true)
    })
    it('should not have a multipleMembers class for one members', () => {
        documentMentionAvatarProps.members = [members[0]]
        const wrapper = shallow(
            <DocumentMentionAvatar {...documentMentionAvatarProps} />
        )
        expect(
            wrapper.find('.documentMentionAvatar').hasClass('multipleMembers')
        ).toEqual(false)
    })
})
