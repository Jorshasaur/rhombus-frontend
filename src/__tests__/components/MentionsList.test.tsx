import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import MentionsList from '../../components/pages/Editor/Mentions/MentionsList/MentionsList'
import { members } from '../mockData/members'

Enzyme.configure({ adapter: new Adapter() })

const mentionsListProps = {
    members,
    searchTerm: '',
    searchResults: members,
    onDocumentClick: jest.fn(),
    onMemberClick: jest.fn()
}
beforeEach(() => {
    mentionsListProps.searchTerm = ''
})

describe('MentionsList', () => {
    it('should be an instance of MentionsList', () => {
        const wrapper = shallow(<MentionsList {...mentionsListProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(MentionsList)
    })
    it('should render children', () => {
        const wrapper = shallow(<MentionsList {...mentionsListProps} />)
        expect(wrapper.find('.mentionsListPrompt')).toHaveLength(1)
        expect(wrapper.find('.memberListContainer')).toHaveLength(1)
    })
    it('should render a list with two children', () => {
        const wrapper = shallow(<MentionsList {...mentionsListProps} />)
        expect(wrapper.find('.memberListContainer').children()).toHaveLength(2)
    })
    it('should trigger the insert member mention function on document member click', () => {
        mentionsListProps.searchTerm = 'Elton John'
        const wrapper = shallow(<MentionsList {...mentionsListProps} />)
        wrapper
            .find('.mentionsListMember')
            .first()
            .prop('onClick')()
        expect(mentionsListProps.onMemberClick).toHaveBeenCalled()
    })
    it('should highlight matching text', () => {
        mentionsListProps.searchTerm = 'User'
        const wrapper = shallow(<MentionsList {...mentionsListProps} />)
        expect(
            wrapper
                .find('.highlightedText')
                .first()
                .text()
        ).toEqual(mentionsListProps.searchTerm)
    })
})
