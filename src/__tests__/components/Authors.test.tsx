import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Authors from '../../components/pages/Editor/Authors/Authors'

Enzyme.configure({ adapter: new Adapter() })

const authorsProps = {
    authors: [
        {
            userId: 1,
            lineHeight: '28px',
            top: 111,
            textLength: 4,
            authorId: '1'
        },
        {
            userId: 1,
            lineHeight: '28px',
            top: 139,
            textLength: 7,
            authorId: '1'
        },
        {
            userId: 1,
            lineHeight: '28px',
            top: 167,
            textLength: 8,
            authorId: '1'
        },
        {
            userId: 8,
            lineHeight: '28px',
            top: 195,
            textLength: 10,
            authorId: '8'
        }
    ]
}

const noAuthorsProps = {
    authors: []
}

describe('Authors', () => {
    it('should be an instance of Authors', () => {
        const wrapper = shallow(<Authors {...authorsProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(Authors)
    })
    it('should render no children if no authors', () => {
        const wrapper = shallow(<Authors {...noAuthorsProps} />)
        expect(wrapper.children()).toHaveLength(0)
    })
    it('should render authors', () => {
        const wrapper = shallow(<Authors {...authorsProps} />)
        expect(wrapper.children()).toHaveLength(2)
    })
})
