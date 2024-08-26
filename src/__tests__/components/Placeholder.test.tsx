import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Placeholder from '../../components/pages/Editor/Placeholder/Placeholder'

Enzyme.configure({ adapter: new Adapter() })

const placeholderProps = {
    firstLineHeight: 110,
    showFirstLinePlaceholder: false,
    showSecondLinePlaceholder: false
}

const showFirstLine = {
    firstLineHeight: 110,
    showFirstLinePlaceholder: false,
    showSecondLinePlaceholder: true
}

const showSecondLine = {
    firstLineHeight: 110,
    showFirstLinePlaceholder: true,
    showSecondLinePlaceholder: false
}

describe('Placeholder', () => {
    it('should be an instance of Placeholder', () => {
        const wrapper = shallow(<Placeholder {...placeholderProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(Placeholder)
    })
    it('should show the first placeholder correctly', () => {
        const wrapper = shallow(<Placeholder {...showFirstLine} />)
        const placeholder = wrapper.find('p.placeholderHide')
        expect(placeholder).toHaveLength(1)
        expect(placeholder.hasClass('placeholderTitle')).toEqual(true)
    })
    it('should show the second placeholder correctly', () => {
        const wrapper = shallow(<Placeholder {...showSecondLine} />)
        const placeholder = wrapper.find('p.placeholderHide')
        expect(placeholder).toHaveLength(1)
        expect(placeholder.hasClass('placeholderTitle')).toEqual(false)
    })
    it('should hide the placeholders correctly', () => {
        const wrapper = shallow(<Placeholder {...placeholderProps} />)
        expect(wrapper.find('.placeholderHide')).toHaveLength(2)
    })
    it('should set the placeholders height correctly', () => {
        const titleProps = {
            ...showSecondLine
        }
        const wrapper = shallow(<Placeholder {...placeholderProps} />)
        wrapper.setProps(titleProps)
        expect(wrapper.find('.placeholderTitle').props().style.height).toEqual(
            `${placeholderProps.firstLineHeight}px`
        )
    })
})
