import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import React from 'react'
import ExpandedImageHeader from '../../../../../components/pages/Editor/ExpandedImage/ExpandedImageHeader/ExpandedImageHeader'

Enzyme.configure({ adapter: new Adapter() })

const baseProps = {
    fileName: '',
    createdAt: '',
    author: '',
    onClose: jest.fn()
}

let wrapper: ReturnType<typeof shallow>
let inst: ReturnType<typeof wrapper.instance>

describe('Expanded Image Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        wrapper = shallow(<ExpandedImageHeader {...baseProps} />)
        inst = wrapper.instance()
    })

    it('should be an instance of ExpandedImageHeader', () => {
        expect(inst).toBeInstanceOf(ExpandedImageHeader)
    })

    describe('Template functionality', () => {
        it('should call close on close button click', () => {
            wrapper
                .find(testid('expanded-image-header__close-button'))
                .simulate('click')
            expect(inst.props.onClose).toBeCalled()
        })
    })
})
