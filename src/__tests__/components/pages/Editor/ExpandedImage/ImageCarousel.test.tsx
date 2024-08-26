import { mount } from 'enzyme'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { ImageCarousel } from '../../../../../components/pages/Editor/ExpandedImage/ImageCarousel/ImageCarousel'
import {
    DEFAULT_X_POSITION,
    DEFAULT_Y_POSITION,
    IMAGE_TRANSITION_TIME,
    INITIAL_CURRENT_SCALE,
    INITIAL_SCALE,
    KEYBOARD_ZOOM_TRANSITION_TIME,
    MARGIN,
    WHEEL_ZOOM_STEP_MULTIPLIER,
    ZOOM_STEP_DOWN,
    ZOOM_STEP_UP
} from '../../../../../components/pages/Editor/ExpandedImage/ImageCarousel/ImageCarouselConstants'
import { keycodes } from '../../../../../interfaces/keycodes'

jest.mock('@invisionapp/helios', () => {
    return {
        Button: (buttonProps: any) => {
            return <button {...buttonProps} className="helios-button" />
        }
    }
})

jest.mock('@invisionapp/helios/icons/InVision', () => {
    return (props) => {
        return <div {...props} className="invision-button" />
    }
})

jest.mock('@invisionapp/helios/icons/Plus', () => {
    return (props) => {
        return <div {...props} className="plus" />
    }
})

jest.mock('@invisionapp/helios/icons/Close', () => {
    return (props) => {
        return <div {...props} className="close" />
    }
})

jest.mock('@invisionapp/helios/icons/Minus', () => {
    return (props) => {
        return <div {...props} className="minus" />
    }
})

jest.mock('@invisionapp/helios/icons/NavigateLeft', () => {
    return (props) => {
        return <div {...props} className="navigate-left" />
    }
})

jest.mock('@invisionapp/helios/icons/NavigateRight', () => {
    return (props) => {
        return <div {...props} className="navigate-right" />
    }
})

jest.useFakeTimers()

let map = {} as any

let panZoomMock: any = {
    _options: {},
    _element: null,
    _pan: { x: 0, y: 0 },
    _scale: 1
}

const panzoomZoomMock = jest.fn((scale) => (panZoomMock._scale = scale))
const panzoomPanMock = jest.fn((x, y) => {
    panZoomMock._pan = { x, y }
})
const panzoomSetStyleMock = jest.fn()
const panzoomGetPanMock = jest.fn(() => panZoomMock._pan)
const panzoomGetScaleMock = jest.fn(() => panZoomMock._scale)
const panzoomZoomInMock = jest.fn(() => (panZoomMock._scale += ZOOM_STEP_UP))
const panzoomZoomOutMock = jest.fn(() => (panZoomMock._scale -= ZOOM_STEP_DOWN))
const preventDefaultMock = jest.fn()
const setOptionsMock = jest.fn((options) => {
    panZoomMock._options = Object.assign(panZoomMock._options, options)
})

jest.mock('@panzoom/panzoom', () => {
    return (element, options) => {
        element.style.transform = `translate3d(${options.startX}px, ${options.startY}px, 0px) scale(1)`

        panZoomMock = {
            _element: element,
            _options: options,
            _pan: { x: 0, y: 0 },
            _scale: 1,
            getPan: panzoomGetPanMock,
            getScale: panzoomGetScaleMock,
            pan: (x, y) => {
                panZoomMock._options.setTransform(element, {
                    scale: panZoomMock._scale,
                    x,
                    y
                })
                return panzoomPanMock(x, y)
            },
            setOptions: (options) => {
                setOptionsMock(options)
            },
            setStyle: panzoomSetStyleMock,
            zoomIn: () => {
                panZoomMock._options.setTransform(element, {
                    scale: panZoomMock._scale + ZOOM_STEP_UP,
                    x: panZoomMock._pan.x,
                    y: panZoomMock._pan.y
                })
                return panzoomZoomInMock()
            },
            zoomOut: () => {
                panZoomMock._options.setTransform(element, {
                    scale: panZoomMock._scale - ZOOM_STEP_DOWN,
                    x: panZoomMock._pan.x,
                    y: panZoomMock._pan.y
                })
                return panzoomZoomOutMock()
            },
            zoom: (scale) => {
                panZoomMock._options.setTransform(element, {
                    scale,
                    x: panZoomMock._pan.x,
                    y: panZoomMock._pan.y
                })
                return panzoomZoomMock(scale)
            }
        }
        return panZoomMock
    }
})

const baseProps = {
    imageCarousel: {
        left: {
            url: 'https://left.jpg',
            fileName: 'left.jpg',
            width: 75,
            height: 75
        },
        middle: {
            url: 'https://middle.jpg',
            fileName: 'middle.jpg',
            width: 150,
            height: 150
        },
        right: {
            url: 'https://right.jpg',
            fileName: 'right.jpg',
            width: 25,
            height: 25
        }
    },
    nextImage: jest.fn(),
    previousImage: jest.fn(),
    onKeyDown: jest.fn(),
    onZoom: jest.fn(),
    onMouseDown: jest.fn(),
    showArrows: false,
    showImages: false,
    fileName: 'image.png',
    onClose: jest.fn(),
    activeImageInfo: {
        fileName: 'image.png',
        author: 'Carol Sell'
    }
}

let wrapper: ReturnType<typeof mount>

describe('Expanded Image Component', () => {
    beforeEach(() => {
        map = {} as any

        document.addEventListener = jest.fn((event, cb) => {
            map[event] = cb
        })

        jest.clearAllMocks()
        panZoomMock = {
            _options: {},
            _element: null,
            _pan: { x: 0, y: 0 },
            _scale: 1
        }
        panZoomMock._pan = { x: 0, y: 0 }
        panZoomMock._scale = 1

        wrapper = mount(<ImageCarousel {...baseProps} />)
    })

    describe('Keyboard functionality', () => {
        it('moves to the previous image when left key is pressed', () => {
            wrapper.setProps({})
            let containers = wrapper.find('.container')

            expect(containers.at(0).is('.middle.moving')).toBe(false)
            expect(containers.at(1).is('.right.moving')).toBe(false)

            act(() => {
                map.keydown({ keyCode: keycodes.Left })
            })

            jest.runAllTimers()

            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
            expect(baseProps.onKeyDown).toHaveBeenCalled()

            wrapper.update()

            containers = wrapper.find('.container')

            expect(containers.at(0).is('.middle.moving')).toBe(true)
            expect(containers.at(1).is('.right.moving')).toBe(true)

            wrapper.find('.container.right.moving').simulate('transitionEnd')

            expect(baseProps.previousImage).toHaveBeenCalled()
            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )
        })

        it('moves to the next image when right key is pressed', () => {
            wrapper.setProps({})

            let containers = wrapper.find('.container')

            expect(containers.at(1).is('.left.moving')).toBe(false)
            expect(containers.at(2).is('.middle.moving')).toBe(false)

            act(() => {
                map.keydown({ keyCode: keycodes.Right })
            })

            jest.runAllTimers()

            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
            expect(baseProps.onKeyDown).toHaveBeenCalled()

            wrapper.update()

            containers = wrapper.find('.container')

            expect(containers.at(1).is('.left.moving')).toBe(true)
            expect(containers.at(2).is('.middle.moving')).toBe(true)

            wrapper.find('.container.left.moving').simulate('transitionEnd')

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(baseProps.nextImage).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )
        })

        it("does nothing if it's not the escape key", () => {
            wrapper.setProps({})
            let containers = wrapper.find('.container')

            expect(containers.at(0).is('.moving')).toBe(false)
            expect(containers.at(1).is('.moving')).toBe(false)
            expect(containers.at(2).is('.moving')).toBe(false)

            act(() => {
                map.keydown({ keyCode: keycodes.Space })
            })

            jest.runAllTimers()

            expect(panzoomZoomMock).not.toHaveBeenCalled()
            expect(panzoomPanMock).not.toHaveBeenCalled()
            expect(baseProps.onKeyDown).not.toHaveBeenCalled()
            expect(baseProps.previousImage).not.toHaveBeenCalled()
            expect(baseProps.nextImage).not.toHaveBeenCalled()

            wrapper.update()

            containers = wrapper.find('.container')

            expect(containers.at(0).is('.moving')).toBe(false)
            expect(containers.at(1).is('.moving')).toBe(false)
            expect(containers.at(2).is('.moving')).toBe(false)
        })
        it('Zooms in when ⌘ + = is pressed', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: imageSize / 2, writable: false }
            )

            wrapper.setProps({})

            act(() => {
                map.keydown({
                    keyCode: keycodes.Equal,
                    metaKey: true,
                    preventDefault: preventDefaultMock
                })
            })

            wrapper.update()

            const scale = 1 * ZOOM_STEP_UP

            expect(preventDefaultMock).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${KEYBOARD_ZOOM_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${scale})`
            )
        })
        it('Zooms out when ⌘ + - is pressed', () => {
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            panZoomMock._scale = 2

            wrapper.setProps({})
            map.keydown({
                keyCode: keycodes.Minus,
                metaKey: true,
                preventDefault: preventDefaultMock
            })

            wrapper.update()

            const scale = 1

            expect(preventDefaultMock).toHaveBeenCalled()

            jest.runAllTimers()

            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${KEYBOARD_ZOOM_TRANSITION_TIME}ms`
            )
        })
        it('Zooms in when control + = is pressed', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: imageSize / 2, writable: false }
            )

            wrapper.setProps({})

            map.keydown({
                keyCode: keycodes.Equal,
                ctrlKey: true,
                preventDefault: preventDefaultMock
            })

            wrapper.update()

            const scale = 1 * ZOOM_STEP_UP

            expect(preventDefaultMock).toHaveBeenCalled()

            jest.runAllTimers()

            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${KEYBOARD_ZOOM_TRANSITION_TIME}ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${scale})`
            )
        })

        it('Zooms out when control + - is pressed', () => {
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            panZoomMock._scale = 2

            wrapper.setProps({})
            map.keydown({
                keyCode: keycodes.Minus,
                ctrlKey: true,
                preventDefault: preventDefaultMock
            })

            wrapper.update()

            const scale = 1

            expect(preventDefaultMock).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${KEYBOARD_ZOOM_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)
        })

        it('Scales to fit when ⌘ + 0 is pressed', () => {
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width + 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})

            map.keydown({
                keyCode: keycodes.Zero,
                metaKey: true,
                preventDefault: preventDefaultMock
            })

            wrapper.update()

            expect(preventDefaultMock).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
        })

        it('Scales to fit when control + 0 is pressed', () => {
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width + 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})

            map.keydown({
                keyCode: keycodes.Zero,
                ctrlKey: true,
                preventDefault: preventDefaultMock
            })

            wrapper.update()

            expect(preventDefaultMock).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
        })

        it('scales to 100% when ⌘ + . is pressed', () => {
            wrapper.setProps({})
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width - 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})
            wrapper.setProps({})

            map.keydown({
                keyCode: keycodes.Period,
                metaKey: true,
                preventDefault: preventDefaultMock
            })

            const scale =
                baseProps.imageCarousel.middle.width /
                (baseProps.imageCarousel.middle.width - 1)

            expect(preventDefaultMock).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${scale})`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${scale})`
            )

            act(() => {
                jest.runAllTimers()
            })

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)
        })

        it('scales to 100% when control + . is pressed', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width - 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})
            wrapper.setProps({})

            map.keydown({
                keyCode: keycodes.Period,
                ctrlKey: true,
                preventDefault: preventDefaultMock
            })

            wrapper.update()

            const scale =
                baseProps.imageCarousel.middle.width /
                (baseProps.imageCarousel.middle.width - 1)

            expect(preventDefaultMock).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )
            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${scale})`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)
        })
    })

    describe('Template functionality', () => {
        it('sets scale on load', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            let scaleDisplay = wrapper.find(testid('zoom-control-scale'))
            expect(scaleDisplay.text()).toEqual(`${INITIAL_CURRENT_SCALE}%`)

            const imageSize = 90
            const targetSize = imageSize * 5

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({
                imageCarousel: {
                    left: baseProps.imageCarousel.left,
                    right: baseProps.imageCarousel.right,
                    middle: {
                        url: 'https://middle.jpg',
                        fileName: 'middle',
                        width: imageSize,
                        height: imageSize
                    }
                }
            })

            const activeImage = wrapper.find(testid('active-image'))

            act(() => {
                activeImage.simulate('load', {
                    target: {
                        getAttribute: jest.fn(() => targetSize)
                    }
                })
            })
            wrapper.update()
            scaleDisplay = wrapper.find(testid('zoom-control-scale'))

            expect(scaleDisplay.text()).toBe(
                `${(imageSize / targetSize) * 100}%`
            )
        })
        it('sets image sizes', () => {
            wrapper.setProps({})
            const images = wrapper.find('img')
            expect(images.at(0).prop('width')).toEqual(
                baseProps.imageCarousel.left.width
            )
            expect(images.at(1).prop('width')).toEqual(
                baseProps.imageCarousel.middle.width
            )
            expect(images.at(2).prop('width')).toEqual(
                baseProps.imageCarousel.right.width
            )
        })

        it.skip('sets the panzoom transition to transform 0ms on mouse move', () => {
            const panZoomWrapper = wrapper.find('#panzoom-wrapper').getDOMNode()
            const map = {} as any

            panZoomWrapper.addEventListener = jest.fn((event, cb) => {
                map[event] = cb
            })

            wrapper.setProps({})
            wrapper.setProps({})

            map.panzoomstart()

            expect(panzoomSetStyleMock).toHaveBeenCalledWith(
                'transition',
                'transform 0ms'
            )
        })

        it('moves to the previous image when left arrow clicked', () => {
            wrapper.setProps({})

            act(() => {
                wrapper
                    .find(testid('image-carousel__navigate-back'))
                    .simulate('click', {
                        stopPropagation: jest.fn()
                    })
                jest.runAllTimers()
                wrapper.update()
            })

            expect(panzoomZoomMock).toHaveBeenCalledWith(1)

            wrapper.find('.container.right.moving').simulate('transitionEnd')

            expect(baseProps.previousImage).toHaveBeenCalled()
            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )
        })

        it('should move to the next image when right arrow clicked', () => {
            wrapper.setProps({})

            act(() => {
                wrapper
                    .find(testid('image-carousel__navigate-forward'))
                    .simulate('click', {
                        stopPropagation: jest.fn()
                    })
                jest.runAllTimers()
                wrapper.update()
            })

            expect(panzoomZoomMock).toHaveBeenCalledWith(1)

            wrapper.find('.container.left.moving').simulate('transitionEnd')

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(baseProps.nextImage).toHaveBeenCalled()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )
        })
    })

    describe('Click to zoom', () => {
        it('does not trigger a zoom event if the image has moved', () => {
            wrapper.setProps({})
            wrapper.update()

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('pointerMove', {
                clientX: 2,
                clientY: 2
            })
            activeImage.simulate('click')

            expect(panzoomGetScaleMock).toHaveBeenCalled()
            expect(panzoomZoomMock).not.toHaveBeenCalled()
        })

        it('Scales to fit if image scale is greater than 1', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale
            wrapper.update()
            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('pointerMove', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('click')

            wrapper.update()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
        })

        it('enlarges the image if the original size is bigger than the scaled size', () => {
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width - 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})
            wrapper.setProps({})

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('pointerMove', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('click')

            wrapper.update()

            const scale =
                baseProps.imageCarousel.middle.width /
                (baseProps.imageCarousel.middle.width - 1)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${scale})`
            )
        })

        it('does not enlarge the image if the original size is not bigger than the scaled size', () => {
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})
            wrapper.setProps({})

            const activeImage = wrapper.find(testid('active-image'))

            activeImage.simulate('pointerDown', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('pointerMove', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('click')

            wrapper.update()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
        })

        it('uses the image width prop if an image does not have a width', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 0

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({
                imageCarousel: {
                    left: baseProps.imageCarousel.left,
                    right: baseProps.imageCarousel.right,
                    middle: {
                        url: 'https://middle.jpg',
                        fileName: undefined,
                        width: undefined,
                        height: undefined
                    }
                }
            })

            wrapper.update()

            wrapper.setProps({})

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('pointerMove', {
                clientX: 1,
                clientY: 1
            })
            activeImage.simulate('click')

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
        })
    })
    describe('pan functionality', () => {
        it('pans the image when dragging if it is bigger than the container', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000
            const parentSize = 500

            const downPosition = 100
            const movePosition = 200

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: parentSize, writable: false }
            )

            Object.defineProperty(middleImageElement, 'clientHeight', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientHeight',
                { value: parentSize, writable: false }
            )

            const moveAmount = movePosition - downPosition

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: downPosition,
                clientY: downPosition
            })
            activeImage.simulate('pointerMove', {
                clientX: movePosition,
                clientY: movePosition
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(${moveAmount}px, ${moveAmount}px, 0px) scale(${initialScale})`
            )

            expect(panzoomPanMock).toHaveBeenCalledWith(moveAmount, moveAmount)
        })

        it('stops at the left margin when dragging right', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000
            const parentSize = 500

            const downPosition = 100
            const movePosition = 20000000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: parentSize, writable: false }
            )

            Object.defineProperty(middleImageElement, 'clientHeight', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientHeight',
                { value: parentSize, writable: false }
            )

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: downPosition,
                clientY: downPosition
            })

            activeImage.simulate('pointerMove', {
                clientX: movePosition,
                clientY: downPosition
            })

            const leftMargin =
                (imageSize * initialScale - parentSize) / 2 +
                MARGIN +
                DEFAULT_X_POSITION

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(${leftMargin}px, ${DEFAULT_Y_POSITION}px, 0px) scale(${initialScale})`
            )

            expect(panzoomPanMock).toHaveBeenCalledWith(
                leftMargin,
                DEFAULT_Y_POSITION
            )
        })

        it('stops at the right margin when dragging left', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000
            const parentSize = 500

            const downPosition = 100
            const movePosition = -20000000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: parentSize, writable: false }
            )

            Object.defineProperty(middleImageElement, 'clientHeight', {
                value: imageSize,
                writable: false
            })

            const rightMargin =
                DEFAULT_X_POSITION -
                MARGIN -
                (imageSize * initialScale - parentSize) / 2
            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: downPosition,
                clientY: downPosition
            })

            activeImage.simulate('pointerMove', {
                clientX: movePosition,
                clientY: downPosition
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(${rightMargin}px, ${DEFAULT_Y_POSITION}px, 0px) scale(${initialScale})`
            )

            expect(panzoomPanMock).toHaveBeenCalledWith(
                rightMargin,
                DEFAULT_Y_POSITION
            )
        })

        it('stops at the top margin when dragging down', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000
            const parentSize = 500

            const downPosition = 100
            const movePosition = 20000000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: parentSize, writable: false }
            )

            Object.defineProperty(middleImageElement, 'clientHeight', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientHeight',
                { value: parentSize, writable: false }
            )

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: downPosition,
                clientY: downPosition
            })

            activeImage.simulate('pointerMove', {
                clientX: downPosition,
                clientY: movePosition
            })

            const topMargin =
                (imageSize * initialScale - parentSize) / 2 +
                MARGIN +
                DEFAULT_Y_POSITION

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(${DEFAULT_X_POSITION}px, ${topMargin}px, 0px) scale(${initialScale})`
            )

            expect(panzoomPanMock).toHaveBeenCalledWith(
                DEFAULT_X_POSITION,
                topMargin
            )
        })
        it('stops at the bottom margin when dragging up', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000
            const parentSize = 500

            const downPosition = 100
            const movePosition = -20000000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: parentSize, writable: false }
            )

            Object.defineProperty(middleImageElement, 'clientHeight', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientHeight',
                { value: parentSize, writable: false }
            )

            const bottomMargin =
                DEFAULT_Y_POSITION -
                MARGIN -
                (imageSize * initialScale - parentSize) / 2

            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown', {
                clientX: downPosition,
                clientY: downPosition
            })

            activeImage.simulate('pointerMove', {
                clientX: downPosition,
                clientY: movePosition
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(${DEFAULT_X_POSITION}px, ${bottomMargin}px, 0px) scale(${initialScale})`
            )

            expect(panzoomPanMock).toHaveBeenCalledWith(
                DEFAULT_X_POSITION,
                bottomMargin
            )
        })

        it('calls onMouseDown with false when drag has ended', () => {
            const activeImage = wrapper.find(testid('active-image'))
            activeImage.simulate('pointerDown')
            activeImage.simulate('pointerUp')
            expect(baseProps.onMouseDown).toHaveBeenNthCalledWith(1, true)
            expect(baseProps.onMouseDown).toHaveBeenNthCalledWith(2, false)
        })

        it('pans when the user scrolls the mouse wheel', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 1000
            const parentSize = 500

            const deltaX = 1
            const deltaY = 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientWidth',
                { value: parentSize, writable: false }
            )

            Object.defineProperty(middleImageElement, 'clientHeight', {
                value: imageSize,
                writable: false
            })
            Object.defineProperty(
                middleImageElement.parentElement,
                'clientHeight',
                { value: parentSize, writable: false }
            )

            map.wheel({ deltaX, deltaY })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform 0ms`
            )

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                2,
                'transform',
                `translate3d(${deltaX * -1}px, ${deltaY *
                    -1}px, 0px) scale(${initialScale})`
            )

            expect(panzoomPanMock).toHaveBeenCalledWith(
                deltaX * -1,
                deltaY * -1
            )
        })
    })

    describe('zoom', () => {
        it('zooms when the user scrolls the mouse wheel while holding ⌘', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const deltaY = -1
            const expectedScale =
                INITIAL_SCALE + deltaY * -1 * WHEEL_ZOOM_STEP_MULTIPLIER

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: baseProps.imageCarousel.middle.width,
                writable: false
            })

            wrapper.setProps({})

            act(() => {
                map.wheel({ deltaY, metaKey: true })
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${expectedScale})`
            )

            expect(panzoomZoomMock).toHaveBeenCalledWith(expectedScale)
        })

        it('zooms when the user scrolls the mouse wheel while holding ctrl', () => {
            wrapper.setProps({})

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const deltaY = -1
            const expectedScale =
                INITIAL_SCALE + deltaY * -1 * WHEEL_ZOOM_STEP_MULTIPLIER

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: baseProps.imageCarousel.middle.width,
                writable: false
            })

            wrapper.setProps({})

            act(() => {
                map.wheel({ deltaY, ctrlKey: true })
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transform',
                `translate3d(0px, 0px, 0px) scale(${expectedScale})`
            )

            expect(panzoomZoomMock).toHaveBeenCalledWith(expectedScale)
        })

        it('zooms in when clicking the zoom in widget', () => {
            wrapper.setProps({})

            const scale = 1 * ZOOM_STEP_UP

            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: baseProps.imageCarousel.middle.width,
                writable: false
            })
            act(() => {
                wrapper.find(testid('zoom-control-zoom-in')).simulate('click')
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${KEYBOARD_ZOOM_TRANSITION_TIME}ms`
            )
            expect(baseProps.onZoom).toHaveBeenCalled()
            expect(panzoomPanMock).toHaveBeenCalledWith(
                DEFAULT_X_POSITION,
                DEFAULT_Y_POSITION
            )
            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)
        })

        it('zooms out when clicking the zoom out widget', () => {
            panZoomMock._scale = 2
            wrapper.setProps({})
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = baseProps.imageCarousel.middle.width - 1

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.setProps({})
            const scale = 1

            act(() => {
                wrapper.find(testid('zoom-control-zoom-out')).simulate('click')
                wrapper.setProps({})
            })

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${KEYBOARD_ZOOM_TRANSITION_TIME}ms`
            )

            expect(baseProps.onZoom).toHaveBeenCalled()
            expect(panzoomPanMock).toHaveBeenCalledWith(
                DEFAULT_X_POSITION,
                DEFAULT_Y_POSITION
            )
            expect(panzoomZoomMock).toHaveBeenCalledWith(scale)
        })
        it('Scales to fit when scale is double clicked', () => {
            const initialScale = 2
            wrapper.setProps({})
            panZoomMock._scale = initialScale
            wrapper.update()
            const activeImage = wrapper.find(testid('zoom-control-scale'))
            activeImage.simulate('doubleclick')

            wrapper.update()

            expect(panzoomSetStyleMock).toHaveBeenNthCalledWith(
                1,
                'transition',
                `transform ${IMAGE_TRANSITION_TIME}ms`
            )

            jest.runAllTimers()

            expect(panzoomPanMock).toHaveBeenCalledWith(0, 0)
            expect(panzoomZoomMock).toHaveBeenCalledWith(1)
        })

        it('scales to the initial scale if zoom would exceed the minimum scale', () => {
            wrapper.setProps({})
            panZoomMock._scale = 5
            wrapper.update()
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const deltaY = 100000000000000

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: baseProps.imageCarousel.middle.width,
                writable: false
            })

            wrapper.setProps({})

            act(() => {
                map.wheel({ deltaY, metaKey: true })
            })

            expect(panzoomPanMock).toHaveBeenCalledWith(
                DEFAULT_X_POSITION,
                DEFAULT_Y_POSITION
            )
            expect(panzoomZoomMock).toHaveBeenCalledWith(INITIAL_SCALE)
        })

        it('scales to the maximum scale if zoom would exceed the minimum scale', () => {
            wrapper.setProps({})
            const middleImageElement = wrapper
                .find(testid('active-image'))
                .getDOMNode()

            const imageSize = 100
            const expectedScale =
                baseProps.imageCarousel.middle.width / imageSize

            Object.defineProperty(middleImageElement, 'clientWidth', {
                value: imageSize,
                writable: false
            })

            wrapper.update()

            const deltaY = -100000000000000

            wrapper.setProps({})
            wrapper.setProps({})

            act(() => {
                map.wheel({ deltaY, metaKey: true })
            })

            expect(panzoomPanMock).toHaveBeenCalledWith(
                DEFAULT_X_POSITION,
                DEFAULT_Y_POSITION
            )
            expect(panzoomZoomMock).toHaveBeenCalledWith(expectedScale)
        })
    })
})
