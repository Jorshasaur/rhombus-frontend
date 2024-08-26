import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { Button } from '@invisionapp/helios'
import Banner from '../../components/pages/Banner/Banner'
import {
    BannerType,
    BannerColor,
    BannerPosition
} from '../../data/reducers/banner'
Enzyme.configure({ adapter: new Adapter() })

const props = {
    banner: {
        type: BannerType.RESET_DOC,
        color: BannerColor.DANGER,
        position: BannerPosition.Bottom
    },
    navigationHeight: 0,
    hideBanner: jest.fn()
}

describe('Banner', () => {
    it('should render self', () => {
        const wrapper = shallow(<Banner {...props} />)
        expect(wrapper.is('#top-banner')).toBe(true)
        expect(wrapper.is('.banner')).toBe(true)
    })

    it('should mount reset doc banner with button', () => {
        const wrapper = shallow(<Banner {...props} />)
        expect(wrapper.find(Button)).toHaveLength(1)
    })

    it('should call hideBanner', () => {
        const wrapper = shallow(<Banner {...props} />)
        expect(wrapper.find(Button)).toHaveLength(1)
        wrapper.find(Button).simulate('click')
        expect(props.hideBanner).toBeCalled()
    })
})
