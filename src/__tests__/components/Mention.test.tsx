import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Mention from '../../components/pages/Editor/Mentions/Mention/Mention'
import { members } from '../mockData/members'

Enzyme.configure({ adapter: new Adapter() })

const mentionProps = {
    ...members[0]
}

describe('MentionsList', () => {
    it('should be an instance of MentionsList', () => {
        const wrapper = shallow(<Mention {...mentionProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(Mention)
    })
    it('should render the mention', () => {
        const wrapper = shallow(<Mention {...mentionProps} />)
        expect(wrapper.find('.mentionText').text()).toEqual(
            `@${mentionProps.name}`
        )
        expect(wrapper.find('.memberInfoName').text()).toEqual(
            mentionProps.name
        )
        expect(wrapper.find('.memberInfoEmail').text()).toEqual(
            mentionProps.email
        )
    })
    it('not allow hover info when showHoverInfo false', () => {
        const noHoverProps = {
            ...mentionProps,
            showHoverInfo: false
        }
        const wrapper = shallow(<Mention {...noHoverProps} />)
        expect(wrapper.find('.mentionHover').exists()).toBeFalsy()
    })
})
