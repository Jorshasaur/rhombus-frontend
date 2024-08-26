import { mount } from 'enzyme'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { ZoomControl } from '../../../../../components/pages/Editor/ExpandedImage/ImageCarousel/ZoomControl/ZoomControl'

jest.mock('@invisionapp/helios/icons/Plus', () => {
    return (props) => {
        return <div {...props} className="plus" />
    }
})

jest.mock('@invisionapp/helios/icons/Minus', () => {
    return (props) => {
        return <div {...props} className="minus" />
    }
})

let wrapper: ReturnType<typeof mount>

const baseProps = {
    showZoomControl: false,
    zoomOut: jest.fn(),
    zoomIn: jest.fn(),
    clickCenter: jest.fn(),
    scale: 1
}

describe('Zoom Control Component', () => {
    beforeEach(() => {
        wrapper = mount(<ZoomControl {...baseProps} />)
    })

    it('does not hide the controls if the user is hovered over it', () => {
        let container = wrapper.find(testid('zoom-control-container'))

        expect(container.hasClass('showZoomControl')).toBe(false)

        act(() => {
            container.simulate('mouseEnter')
        })
        wrapper.update()

        container = wrapper.find(testid('zoom-control-container'))

        expect(container.hasClass('showZoomControl')).toBe(true)

        act(() => {
            container.simulate('mouseLeave')
        })
        wrapper.update()

        container = wrapper.find(testid('zoom-control-container'))
        expect(container.hasClass('showZoomControl')).toBe(false)
    })
})
