import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { Provider } from 'unstated'
import * as sinon from 'sinon'
import ImageEmbed from '../../components/pages/Editor/Blots/ImageEmbed'
import ImageEmbedContainer from '../../components/pages/Editor/Blots/ImageEmbedContainer'
import * as dataUtils from '../../data/utils/assets'
import setImmediatePromise from 'set-immediate-promise'
import lodash from 'lodash'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'
import { imagesActionCreators } from '../../data/images'
import { BlotSize } from '../../interfaces/blotSize'
import { DEFAULT_RATIO } from '../../constants/styles'
import { createContainer, resizeWindow } from '../utils'
import { getEmbedStyles } from '../../helpers/EmbedHelper'
import { calculateAspectRatio } from '../../lib/utils'

imagesActionCreators.expandImage = jest.fn(() => {
    return { type: '' }
})

const trackSpy = jest
    .spyOn(AnalyticsBuilder.prototype, 'track')
    .mockImplementation(jest.fn())
Enzyme.configure({ adapter: new Adapter() })

const containerWidth = 100
const containerHeight = 100

const baseProps = {
    authorId: '1',
    key: '123456',
    service: 'image',
    uuid: '123456',
    version: 1,
    embedData: {
        height: 42,
        width: 42
    },
    createdAt: '2018-11-08T21:18:24.424Z',
    size: BlotSize.Small,
    container: createContainer(containerHeight, containerWidth)
}

lodash.uniqueId = jest.fn((prefix) => {
    return `${prefix}test`
})

describe('ImageEmbed component', () => {
    const sandbox = sinon.createSandbox()

    beforeEach(() => {
        ImageEmbedContainer.prototype.setDataAttribute = jest.fn()
        window.getComputedStyle = jest.fn(() => {
            return {}
        })
    })

    sandbox.stub(dataUtils, 'getAsset').returns({
        id: '1',
        url: 'http://image',
        fileName: 'test.png'
    })

    it('should render dataUrl', () => {
        const provider = new ImageEmbedContainer(baseProps)
        provider.setDataUrl('data:image/jpeg;base64,YWFh')

        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...baseProps} />
            </Provider>
        )

        expect(wrapper.find('img')).toHaveLength(1)
        expect(wrapper.find('img').html()).toBe(
            `<img src="data:image/jpeg;base64,YWFh" class="imageEmbedNode" style="width: ${baseProps.embedData.width}px; height: ${baseProps.embedData.height}px; z-index: 1;">`
        )
    })

    it('should render image after upload', () => {
        const width = 500
        const height = 500

        const provider = new ImageEmbedContainer(baseProps)
        provider.quillBlotElement = document.createElement('div')
        provider.setDataUrl('data:image/jpeg;base64,YWFh')

        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...baseProps} />
            </Provider>
        )

        // check uploading state
        expect(wrapper.find('img')).toHaveLength(1)
        expect(wrapper.find('img').html()).toBe(
            `<img src="data:image/jpeg;base64,YWFh" class="imageEmbedNode" style="width: ${baseProps.embedData.width}px; height: ${baseProps.embedData.height}px; z-index: 1;">`
        )

        provider.resetEmbedData({ id: '123', width, height })

        // check loaded state
        wrapper.find('img').simulate('load')

        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('img')
                .first()
                .html()
        ).toBe(
            `<img src="http://image" class="imageEmbedNode" style="width: ${containerWidth /
                2}px; height: ${containerHeight /
                2}px;" id="image_test" data-filename="test.png" data-author-id="1" data-size="small">`
        )
    })

    it('should handle correctly state between uploading and downloading', () => {
        const width = 500
        const height = 500
        const props = {
            ...baseProps,
            embedData: { id: '123', width, height }
        }

        const provider = new ImageEmbedContainer(props)
        provider.quillBlotElement = document.createElement('div')
        provider.setDataUrl('data:image/jpeg;base64,YWFh')

        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )

        // check uploading state
        expect(wrapper.find('img')).toHaveLength(2)

        const downloadingImage = wrapper.find('img').at(0)
        const dataUrlImage = wrapper.find('img').at(1)
        const skeleton = wrapper.find('Skeleton')

        expect(dataUrlImage.html()).toBe(
            `<img src="data:image/jpeg;base64,YWFh" class="imageEmbedNode" style="width: ${containerWidth /
                2}px; height: ${containerHeight / 2}px; z-index: 1;">`
        )
        expect(downloadingImage.prop('style')).toEqual({ display: 'none' })
        expect(skeleton).toHaveLength(1)
        expect(skeleton.props()).toEqual({ ratio: width / height })
    })

    it('should render image', () => {
        const width = 500
        const height = 500
        const props = {
            ...baseProps,
            embedData: { id: '123', width, height }
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )

        // check downloading state
        const skeleton = wrapper.find('Skeleton')
        const image = wrapper.find('img')

        expect(skeleton).toHaveLength(1)
        expect(skeleton.props()).toEqual({ ratio: width / height })
        expect(image.prop('style')).toEqual({ display: 'none' })

        // check loaded state
        wrapper.find('img').simulate('load')

        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('img')
                .first()
                .html()
        ).toBe(
            `<img class="imageEmbedNode" style="width: ${containerWidth /
                2}px; height: ${containerHeight /
                2}px;" src="http://image" id="image_test" data-filename="test.png" data-author-id="1" data-size="small">`
        )
    })

    it('should render image from url', () => {
        const width = 500
        const height = 500
        const props = {
            ...baseProps,
            embedData: { url: 'http://image-from-url', width, height }
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )

        // check downloading state
        const skeleton = wrapper.find('Skeleton')
        const image = wrapper.find('img')
        expect(skeleton).toHaveLength(1)
        expect(skeleton.props()).toEqual({ ratio: width / height })
        expect(image.prop('style')).toEqual({ display: 'none' })

        // check loaded state
        image.simulate('load')

        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('img')
                .first()
                .html()
        ).toBe(
            `<img class="imageEmbedNode" style="width: ${containerWidth /
                2}px; height: ${containerHeight /
                2}px;" src="http://image-from-url" id="image_test" data-filename="Untitled" data-author-id="1">`
        )
    })

    it('should render image skeleton', () => {
        const width = 500
        const height = 500

        const props = {
            ...baseProps,
            embedData: { width, height }
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )

        const skeleton = wrapper.find('Skeleton')
        expect(skeleton).toHaveLength(1)
        expect(skeleton.props()).toEqual({ ratio: width / height })
    })

    it('should render general image skeleton', () => {
        const props = {
            ...baseProps,
            embedData: {}
        }
        const provider = new ImageEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )

        const skeleton = wrapper.find('Skeleton')
        expect(skeleton).toHaveLength(1)
        expect(skeleton.props()).toEqual({ ratio: DEFAULT_RATIO })
    })

    it('set the width and height in the embed data of the image for small blots', async () => {
        const getImageSizeSpy = jest
            .spyOn(ImageEmbedContainer.prototype, 'getImageSize')
            .mockImplementation(
                jest.fn(() => ({
                    width: 100,
                    height: 100
                }))
            )
        const imageUrl = 'http://image'
        const props = {
            ...baseProps,
            embedData: { id: '123' }
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        await setImmediatePromise()

        wrapper.find('img').simulate('load')

        expect(getImageSizeSpy).toHaveBeenCalledWith(imageUrl)
        expect(fakeQuillBlotElement.setAttribute).toBeCalledWith(
            'data-props',
            '{"version":1,"service":"image","uuid":"123456","authorId":"1","embedData":{"id":"123","width":100,"height":100},"createdAt":"2018-11-08T21:18:24.424Z","size":"small"}'
        )
        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('img')
                .first()
                .html()
        ).toBe(
            `<img class="imageEmbedNode" style="width: ${containerWidth /
                2}px; height: ${containerHeight /
                2}px;" src="${imageUrl}" id="image_test" data-filename="test.png" data-author-id="1" data-size="small">`
        )
    })
    it('should call expand when the image is expanded', () => {
        const props = {
            ...baseProps,
            asset: {
                id: 'id'
            },
            embedData: {
                url: 'http://image-from-url'
            }
        }
        const provider = new ImageEmbedContainer(props)
        provider.quillBlotElement = document.createElement('div')
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )

        wrapper.find('img').simulate('load')

        wrapper.find('img').simulate('click')
        expect(trackSpy).toHaveBeenCalled()
    })
    it('should set the image container to 100% for medium blots', async () => {
        const getImageSizeSpy = jest
            .spyOn(ImageEmbedContainer.prototype, 'getImageSize')
            .mockImplementation(
                jest.fn(() => ({
                    width: 100,
                    height: 100
                }))
            )
        const containerNode = {
            getBoundingClientRect: () => {
                return {
                    width: 1200
                }
            }
        }
        const imageUrl = 'http://image'
        const props = {
            ...baseProps,
            size: BlotSize.Medium,
            embedData: { id: '123' },
            container: containerNode as any
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        await setImmediatePromise()

        wrapper.find('img').simulate('load')

        expect(getImageSizeSpy).toHaveBeenCalledWith(imageUrl)
        expect(fakeQuillBlotElement.setAttribute).toBeCalledWith(
            'data-props',
            '{"version":1,"service":"image","uuid":"123456","authorId":"1","embedData":{"id":"123","width":100,"height":100},"createdAt":"2018-11-08T21:18:24.424Z","size":"medium"}'
        )
        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('.ImageEmbed')
                .first()
                .prop('style')
        ).toEqual({ width: '100%', height: 1200 })
    })
    it('should set the image container width to 50% for small blots if the image is larger', async () => {
        const getImageSizeSpy = jest
            .spyOn(ImageEmbedContainer.prototype, 'getImageSize')
            .mockImplementation(
                jest.fn(() => ({
                    width: 1200,
                    height: 1200
                }))
            )
        const containerNode = {
            getBoundingClientRect: () => {
                return {
                    width: 100
                }
            }
        }
        const imageUrl = 'http://image'
        const props = {
            ...baseProps,
            size: BlotSize.Small,
            embedData: { id: '123' },
            container: containerNode as any
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        await setImmediatePromise()

        wrapper.find('img').simulate('load')

        expect(getImageSizeSpy).toHaveBeenCalledWith(imageUrl)
        expect(fakeQuillBlotElement.setAttribute).toBeCalledWith(
            'data-props',
            '{"version":1,"service":"image","uuid":"123456","authorId":"1","embedData":{"id":"123","width":1200,"height":1200},"createdAt":"2018-11-08T21:18:24.424Z","size":"small"}'
        )
        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('.ImageEmbed')
                .first()
                .prop('style')
        ).toEqual({ width: '50%', height: 50 })
    })
    it('should set the image container width to the image width for small blots if the image is smaller', async () => {
        const getImageSizeSpy = jest
            .spyOn(ImageEmbedContainer.prototype, 'getImageSize')
            .mockImplementation(
                jest.fn(() => ({
                    width: 10,
                    height: 10
                }))
            )
        const containerNode = {
            getBoundingClientRect: () => {
                return {
                    width: 100
                }
            }
        }
        const imageUrl = 'http://image'
        const props = {
            ...baseProps,
            size: BlotSize.Small,
            embedData: { id: '123' },
            container: containerNode as any
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        await setImmediatePromise()

        wrapper.find('img').simulate('load')

        expect(getImageSizeSpy).toHaveBeenCalledWith(imageUrl)
        expect(fakeQuillBlotElement.setAttribute).toBeCalledWith(
            'data-props',
            '{"version":1,"service":"image","uuid":"123456","authorId":"1","embedData":{"id":"123","width":10,"height":10},"createdAt":"2018-11-08T21:18:24.424Z","size":"small"}'
        )
        expect(wrapper.find('img')).toHaveLength(1)
        expect(
            wrapper
                .find('.ImageEmbed')
                .first()
                .prop('style')
        ).toEqual({ width: 10, height: 10 })
    })
    it('should set styles for large blots', async () => {
        const getImageSizeSpy = jest
            .spyOn(ImageEmbedContainer.prototype, 'getImageSize')
            .mockImplementation(
                jest.fn(() => ({
                    width: 100,
                    height: 100
                }))
            )
        const containerNode = {
            getBoundingClientRect: () => {
                return {
                    width: 1200
                }
            }
        } as HTMLElement

        const ratio = calculateAspectRatio(100, 100)
        const embedStyles = getEmbedStyles(ratio, containerNode, BlotSize.Large)

        const imageUrl = 'http://image'
        const props = {
            ...baseProps,
            size: BlotSize.Large,
            embedData: { id: '123' },
            container: containerNode as any
        }

        const provider = new ImageEmbedContainer(props)
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        await setImmediatePromise()

        wrapper.find('img').simulate('load')

        expect(getImageSizeSpy).toHaveBeenCalledWith(imageUrl)
        expect(fakeQuillBlotElement.setAttribute).toBeCalledWith(
            'data-props',
            '{"version":1,"service":"image","uuid":"123456","authorId":"1","embedData":{"id":"123","width":100,"height":100},"createdAt":"2018-11-08T21:18:24.424Z","size":"large"}'
        )
        expect(wrapper.find('img')).toHaveLength(1)

        expect(wrapper.find('.imageEmbedNode').prop('style')).toEqual(
            embedStyles
        )
    })
    it('should set styles for large blots on small screens', async () => {
        resizeWindow(768, 735)
        const getImageSizeSpy = jest
            .spyOn(ImageEmbedContainer.prototype, 'getImageSize')
            .mockImplementation(
                jest.fn(() => ({
                    width: 100,
                    height: 100
                }))
            )
        const containerNode = {
            getBoundingClientRect: () => {
                return {
                    width: 735
                }
            }
        } as HTMLElement

        const ratio = calculateAspectRatio(100, 100)
        const embedStyles = getEmbedStyles(ratio, containerNode, BlotSize.Large)

        const imageUrl = 'http://image'
        const props = {
            ...baseProps,
            size: BlotSize.Large,
            embedData: { id: '123' },
            container: containerNode as any
        }

        const provider = new ImageEmbedContainer(props)
        const mediumProvider = new ImageEmbedContainer({
            ...props,
            size: BlotSize.Medium
        })
        const fakeQuillBlotElement = {
            setAttribute: jest.fn()
        } as any
        provider.quillBlotElement = fakeQuillBlotElement
        const mediumWrapper = mount(
            <Provider inject={[mediumProvider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        const wrapper = mount(
            <Provider inject={[provider]}>
                <ImageEmbed {...props} />
            </Provider>
        )
        await setImmediatePromise()
        mediumWrapper.find('img').simulate('load')
        wrapper.find('img').simulate('load')

        expect(getImageSizeSpy).toHaveBeenCalledWith(imageUrl)
        expect(fakeQuillBlotElement.setAttribute).toBeCalledWith(
            'data-props',
            '{"version":1,"service":"image","uuid":"123456","authorId":"1","embedData":{"id":"123","width":100,"height":100},"createdAt":"2018-11-08T21:18:24.424Z","size":"large"}'
        )
        expect(wrapper.find('img')).toHaveLength(1)

        expect(wrapper.find('.imageEmbedNode').prop('style')).toEqual(
            embedStyles
        )
        expect(wrapper.find('.imageEmbedNode').prop('style')).toEqual(
            mediumWrapper.find('.imageEmbedNode').prop('style')
        )
    })
})
