import React from 'react'
import Enzyme, { shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { Text } from '@invisionapp/helios'
import LoggedOutModal from '../../components/pages/Editor/LoggedOutModal/LoggedOutModal'
Enzyme.configure({ adapter: new Adapter() })

const props = {
    pendingEdits: false,
    keepAlivePending: false,
    retry: jest.fn()
}
jest.mock('@invisionapp/helios', () => {
    return {
        Text: (textProps: any) => {
            let textString = ''
            textProps.children.forEach((child: any) => {
                if (typeof child === 'string') {
                    textString += ` ${child}`
                }
            })
            return textString
        },
        Padded: 'padded',
        Spinner: 'spinner'
    }
})
describe('Banner', () => {
    it('should render self', () => {
        const wrapper = shallow(<LoggedOutModal {...props} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(LoggedOutModal)
    })
    it('should display a modal if the user is logged out', () => {
        const wrapper = mount(<LoggedOutModal {...props} />)

        // check if removeCursor was called
        expect(wrapper.text()).toContain(
            "You've been logged out. Please log in again."
        )
        expect(wrapper.find(Text)).toHaveLength(2)
    })
    it('should display a modal if the user is logged out and has pending changes', () => {
        const modalProps = {
            ...props,
            pendingEdits: true
        }

        const wrapper = mount(<LoggedOutModal {...modalProps} />)

        expect(wrapper.text()).toContain(
            "You've been logged out with unsynced changes. Don't close this tab!"
        )
        expect(wrapper.find(Text)).toHaveLength(2)
    })
})
