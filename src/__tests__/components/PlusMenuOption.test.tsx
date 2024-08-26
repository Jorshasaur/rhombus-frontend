import React from 'react'
import Enzyme, { shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import PlusMenuOption from '../../components/pages/Editor/PlusMenu/PlusMenuOption'

Enzyme.configure({ adapter: new Adapter() })

const defaultProps = {
    icon: <div className="test-icon" />,
    onClickAction: jest.fn(),
    onMouseOver: jest.fn()
}

describe('PlusMenuOption', () => {
    it('should be an instance of PlusMenuOption', () => {
        const wrapper = shallow(<PlusMenuOption {...defaultProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(PlusMenuOption)
    })
    it('should render PlusMenuOption', () => {
        const wrapper = shallow(<PlusMenuOption {...defaultProps} />)
        expect(wrapper).toMatchSnapshot()
    })
    it('should call click action click', () => {
        const wrapper = mount(<PlusMenuOption {...defaultProps} />)
        wrapper.simulate('click')
        expect(defaultProps.onClickAction).toHaveBeenCalled()
    })
    it('should call the mouseover event on mouse over', () => {
        const wrapper = mount(<PlusMenuOption {...defaultProps} />)
        wrapper.simulate('mouseover')
        expect(defaultProps.onMouseOver).toHaveBeenCalled()
    })
})
