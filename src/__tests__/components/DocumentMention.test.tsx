import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import DocumentMention from '../../components/pages/Editor/Mentions/DocumentMention/DocumentMention'
import { members } from '../mockData/members'
import { MENTIONS_DOC_REFERENCE } from '../../constants/mentions'

Enzyme.configure({ adapter: new Adapter() })

const documentMentionProps = {
    documentName: MENTIONS_DOC_REFERENCE,
    members
}

describe('MentionsList', () => {
    it('should be an instance of MentionsList', () => {
        const wrapper = shallow(<DocumentMention {...documentMentionProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(DocumentMention)
    })
    it('should render the mention', () => {
        const wrapper = shallow(<DocumentMention {...documentMentionProps} />)
        expect(wrapper.find('.mentionText').text()).toEqual(
            `@${MENTIONS_DOC_REFERENCE}`
        )
    })
    it('not allow hover info when showHoverInfo false', () => {
        const noHoverProps = {
            ...documentMentionProps,
            showHoverInfo: false
        }
        const wrapper = shallow(<DocumentMention {...noHoverProps} />)
        expect(wrapper.find('.mentionHover').exists()).toBeFalsy()
    })
})
