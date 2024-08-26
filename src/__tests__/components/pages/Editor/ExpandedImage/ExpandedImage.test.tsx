import { shallow } from 'enzyme'
import React from 'react'
import ExpandedImage from '../../../../../components/pages/Editor/ExpandedImage/ExpandedImage'
import { keycodes } from '../../../../../interfaces/keycodes'

jest.mock('timers')

const spies = {
    showCarousel: jest.spyOn(ExpandedImage.prototype, 'showCarousel'),
    onClose: jest.spyOn(ExpandedImage.prototype, 'onClose'),
    resetHideMetaCounter: jest.spyOn(
        ExpandedImage.prototype,
        'resetHideMetaCounter'
    ),
    hideHeaderAndListenForMouseMove: jest.spyOn(
        ExpandedImage.prototype,
        'hideHeaderAndListenForMouseMove'
    ),
    showHeaderAndRemoveListener: jest.spyOn(
        ExpandedImage.prototype,
        'showHeaderAndRemoveListener'
    ),
    onKeyDown: jest.spyOn(ExpandedImage.prototype, 'onKeyDown'),
    nextImage: jest.spyOn(ExpandedImage.prototype, 'nextImage'),
    previousImage: jest.spyOn(ExpandedImage.prototype, 'previousImage')
}

const baseProps = {
    activeImageId: '',
    activeImageInfo: {
        fileName: '',
        author: '',
        createdAt: '',
        url: ''
    },
    nextImage: jest.fn(),
    previousImage: jest.fn(),
    imageCarousel: {
        left: {
            url: '',
            fileName: ''
        },
        middle: {
            url: '',
            fileName: ''
        },
        right: {
            url: '',
            fileName: ''
        }
    },
    clearActiveImage: jest.fn()
}

let wrapper: ReturnType<typeof shallow>
let inst: ReturnType<typeof wrapper.instance>

describe('Expanded Image Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        wrapper = shallow(<ExpandedImage {...baseProps} />)
        inst = wrapper.instance()
    })

    it('should be an instance of ExpandedImage', () => {
        expect(inst).toBeInstanceOf(ExpandedImage)
    })

    describe('class functions', () => {
        describe('showCarousel', () => {
            it('should show carousel', () => {
                wrapper.setState({
                    showCarousel: false
                })
                // @ts-ignore
                inst.showCarousel()
                expect(inst.state.showCarousel).toBeTruthy()
            })
        })

        describe('onClose', () => {
            it('should hide carousel and background', () => {
                wrapper.setState({
                    showBackground: true,
                    showCarousel: true
                })
                // @ts-ignore
                inst.onClose()
                expect(inst.state.showBackground).toBeFalsy()
                expect(inst.state.showCarousel).toBeFalsy()
            })
        })

        describe('onMouseDown', () => {
            it('should hide header', () => {
                wrapper.setState({
                    showHeader: true
                })

                inst.onMouseDown(true)
                expect(inst.state.mouseDown).toBeTruthy()
                expect(inst.state.showHeader).toBeFalsy()

                inst.onMouseDown(false)
                expect(inst.state.mouseDown).toBeFalsy()
                expect(inst.state.showHeader).toBeTruthy()
            })
        })

        describe('hideHeaderAndListenForMouseMove', () => {
            it('should hide header', () => {
                wrapper.setState({
                    showHeader: true
                })
                // @ts-ignore
                inst.hideHeaderAndListenForMouseMove()
                expect(inst.state.showHeader).toBeFalsy()
            })
        })

        describe('showHeaderAndRemoveListener', () => {
            it('should show header and restart counter', () => {
                wrapper.setState({
                    showHeader: false
                })
                // @ts-ignore
                inst.showHeaderAndRemoveListener()
                expect(spies.resetHideMetaCounter).toBeCalled()
                expect(inst.state.showHeader).toBeTruthy()
            })
        })

        describe('onKeyDown', () => {
            it("should call close if it's the escape key", () => {
                // @ts-ignore
                inst.onKeyDown({
                    stopImmediatePropagation: jest.fn(),
                    keyCode: keycodes.Escape
                })
                expect(spies.onClose).toBeCalled()
            })

            it("should do nothing if it's not the escape key", () => {
                // @ts-ignore
                inst.onKeyDown({
                    stopImmediatePropagation: jest.fn(),
                    keyCode: keycodes.Space
                })
                expect(spies.onClose).not.toBeCalled()
            })
        })

        describe('nextImage', () => {
            it('should show header', () => {
                // @ts-ignore
                inst.nextImage()
                expect(spies.showHeaderAndRemoveListener).toBeCalled()
                expect(inst.props.nextImage).toBeCalled()
            })
        })

        describe('previousImage', () => {
            it('should shows header', () => {
                // @ts-ignore
                inst.previousImage()
                expect(spies.showHeaderAndRemoveListener).toBeCalled()
                expect(inst.props.previousImage).toBeCalled()
            })
        })
    })

    describe('React Life Cycle functions', () => {
        describe('componentDidMount', () => {
            it('should show background and header', () => {
                wrapper.setState({
                    showBackground: false
                })
                // @ts-ignore
                inst.componentDidMount()
                expect(spies.showHeaderAndRemoveListener).toBeCalled()
                expect(inst.state.showBackground).toBeTruthy()
            })
        })
    })

    describe('Template functionality', () => {
        it('should call close on background click', () => {
            wrapper.find('#expandedBackground').simulate('click')
            expect(spies.onClose).toBeCalled()
        })
    })
})
