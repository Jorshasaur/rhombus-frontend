import React from 'react'
import Enzyme, { shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import PlusMenu from '../../components/pages/Editor/PlusMenu/PlusMenu'
import { keycodes } from '../../interfaces/keycodes'
import { MEDIA_BUTTON_TYPES } from '../../constants/general'

Enzyme.configure({ adapter: new Adapter() })

const defaultProps = {
    scrollTop: 10,
    onClosePlusMenu: jest.fn(),
    onUploadFiles: jest.fn(),
    onMenuItemClick: jest.fn(),
    abortPlusMenu: jest.fn()
}

jest.mock('../../data/store', () => {
    return {
        getState: jest.fn(() => ({
            plusMenu: {
                showPlusMenu: true,
                insertTop: 500
            },
            featureFlags: {
                panes: true
            }
        }))
    }
})

jest.mock('@invisionapp/helios/icons/File', () => {
    return () => <div className="helios-file-icon" />
})
jest.mock('@invisionapp/helios/icons/Image', () => {
    return () => <div className="helios-image-icon" />
})
jest.mock('@invisionapp/helios/icons/Prototype', () => {
    return () => <div className="helios-proto-icon" />
})
jest.mock('@invisionapp/helios/icons/Freehand', () => {
    return () => <div className="helios-freehand-icon" />
})

describe('PlusMenu', () => {
    it('should be an instance of PlusMenu', () => {
        const wrapper = shallow(<PlusMenu {...defaultProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(PlusMenu)
    })
    it('should render PlusMenu', () => {
        const wrapper = shallow(<PlusMenu {...defaultProps} />)
        expect(wrapper.children()).toHaveLength(3)
    })
    it('should set the wrapperRef', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        const instance: any = wrapper.instance()
        expect(instance.wrapperRef).toBeTruthy()
    })
    it('should close the menu when pressing escape', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        const instance: any = wrapper.instance()
        instance.checkForEscape({ keyCode: keycodes.Escape })
        expect(defaultProps.abortPlusMenu).toHaveBeenCalled()
    })
    it('should close the menu when pressing outside the menu', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        const instance: any = wrapper.instance()
        const elm = document.createElement('div')
        instance.checkForMenuClose({ target: elm })
        expect(defaultProps.abortPlusMenu).toHaveBeenCalled()
    })
    it('should position the menu down correctly', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        const instance: any = wrapper.instance()
        instance.positionMenu = jest.fn()
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 1200
        })
        instance.movePlusMenu()
        expect(instance.positionMenu).toHaveBeenCalledWith(500)
    })
    it('should position the menu up correctly', () => {
        const newProps = {
            ...defaultProps,
            scrollTop: -500
        }
        const wrapper = mount(<PlusMenu {...newProps} />)
        const instance: any = wrapper.instance()
        instance.positionMenu = jest.fn()
        Object.defineProperty(window, 'innerHeight', {
            writable: true,
            configurable: true,
            value: 1200
        })
        instance.movePlusMenu()
        expect(instance.positionMenu).toHaveBeenCalledWith(115)
    })
    it('should trigger the close for clicks outside of the menu', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        const instance: any = wrapper.instance()
        const element = document.createElement('div')
        instance.checkForMenuClose(element)
        expect(defaultProps.abortPlusMenu).toHaveBeenCalled()
    })
    it('should add the correct menu buttons', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        expect(wrapper.find('li')).toHaveLength(11)
    })
    it('should change to the correct upload type', () => {
        const wrapper = mount(<PlusMenu {...defaultProps} />)
        const instance = wrapper.instance() as PlusMenu
        instance.updateUploadTypes(MEDIA_BUTTON_TYPES.image)
        expect(instance.state.currentMediaTypes).toEqual('image/*')
        instance.updateUploadTypes(MEDIA_BUTTON_TYPES.file)
        expect(instance.state.currentMediaTypes).toEqual('*')
    })
    it.each([
        'prototype',
        'freehand',
        'youtube',
        'vimeo',
        'spotify',
        'marvel',
        'soundcloud',
        'codepen'
    ])(
        'clicking on the %s button should trigger the item clicked event',
        (itemName: string) => {
            const wrapper = mount(<PlusMenu {...defaultProps} />)
            wrapper.find('li' + testid(itemName)).simulate('click')
            expect(defaultProps.onMenuItemClick).toHaveBeenCalledWith(itemName)
        }
    )
})
