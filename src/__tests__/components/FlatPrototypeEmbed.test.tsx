import React from 'react'
import { mount, shallow } from 'enzyme'
import Axios from 'axios'
import { Provider } from 'unstated'
import URI from 'urijs'
import * as sinon from 'sinon'
import FlatPrototypeEmbed from '../../components/pages/Editor/Blots/FlatPrototypeEmbed/FlatPrototypeEmbed'
import FlatPrototypeEmbedContainer, {
    defaultFlatPrototype
} from '../../components/pages/Editor/Blots/FlatPrototypeEmbed/FlatPrototypeEmbedContainer'
import setImmediatePromise from 'set-immediate-promise'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { setupQlEditor, createContainer, resizeWindow } from '../utils'
import { BlotSize } from '../../interfaces/blotSize'
import { calculateAspectRatio } from '../../lib/utils'
import * as EmbedHelpers from '../../helpers/EmbedHelper'
import { PERSISTENT_BAR_HEIGHT, DEFAULT_RATIO } from '../../constants/styles'
import { CROSS_TEAM_FAILURE } from '../../components/pages/Editor/Blots/ServiceErrorEmbed/ServiceErrorMessages'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { AnimatedEmbedWrapper } from '../../components/pages/Editor/Blots/AnimatedEmbedWrapper'
import { PagesApiService } from '../../data/services/PagesApiService'
import { EmbedModal } from '../../components/pages/Editor/Blots/EmbedModal'

jest.mock('../../data/store', () => {
    return {
        subscribe: jest.fn(),
        getState: jest.fn(() => ({
            permissions: {
                canEdit: true
            }
        }))
    }
})
Object.defineProperty(Image.prototype, 'src', {
    set(src: string) {
        setTimeout(() => this.onload())
    }
})
const baseProps = {
    originalLink:
        'https://invisionapp.com/overview/Test-Prototype-cjoirq3vp0rlu017ovt5o8vb3/screens',
    url:
        'https://invisionapp.com/console/Test-Prototype-cjoirq3vp0rlu017ovt5o8vb3',
    authorId: '1',
    authorName: 'James Dean',
    key: '123456',
    service: 'file' as BlockEmbedService,
    uuid: '123456',
    version: 1,
    container: createContainer(100, 100),
    embedData: { id: '123' },
    size: BlotSize.Medium,
    prototype: {
        isMobile: false,
        width: 1920,
        height: 1080,
        thumbnail: 'thumbnail.jpg',
        name: 'My Prototype',
        updatedAt: '26 Mar 2018, 10:30am'
    },
    imageDimensions: {
        aspect: 0.05625,
        width: 1920,
        height: 1080
    }
}

const Component = ({
    children,
    provider
}: {
    children: React.ReactNode
    provider: any
}) => (
    <ThemeProvider theme={theme}>
        <Provider inject={[provider]}>{children}</Provider>
    </ThemeProvider>
)

describe('FlatPrototypeEmbed component', () => {
    const sandbox = sinon.createSandbox()

    beforeAll(() => {
        setupQlEditor()
        window.getComputedStyle = jest.fn(() => {
            return {}
        })
        sandbox.stub(Axios, 'get').resolves({
            data: {
                isMobile: false,
                width: 1920,
                height: 1080,
                thumbnail: 'thumbnail.jpg',
                name: 'My Prototype',
                updatedAt: '26 Mar 2018, 10:30am'
            }
        })
    })

    beforeEach(() => {
        EmbedModal.mount()
    })

    afterEach(() => {
        sandbox.restore()
        EmbedModal.unmount()
    })

    it('should render a flat prototype embed', async () => {
        const provider = new FlatPrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...baseProps} />
            </Component>
        )
        expect(wrapper.find('.thumbnailEmbed').prop('style')).toEqual({
            '--aspect-ratio': 16 / 9,
            backgroundImage: 'url(thumbnail.jpg)',
            height: 'auto',
            width: '100%'
        })
    })
    it('should render a large flat prototype embed', async () => {
        const getEmbedSizeSpy = jest
            .spyOn(EmbedHelpers, 'getEmbedSize')
            .mockReturnValue({
                width: 1920,
                height: 1080
            })
        const props = {
            ...baseProps,
            size: BlotSize.Large
        }

        const provider = new FlatPrototypeEmbedContainer(props)
        const ratio = calculateAspectRatio(1920, 1080)
        const embedStyles = EmbedHelpers.getEmbedStyles(
            ratio,
            props.container,
            BlotSize.Large
        )
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )
        expect(wrapper.find('.container').prop('style')).toEqual({
            ...embedStyles,
            height:
                embedStyles.width *
                    (props.imageDimensions.height /
                        props.imageDimensions.width) +
                PERSISTENT_BAR_HEIGHT,
            overflow: 'hidden'
        })
        getEmbedSizeSpy.mockRestore()
    })
    it('correctly sets the height when a prototype width is smaller than the embed, but the height is taller', async () => {
        const props = {
            ...baseProps,
            size: BlotSize.Large,
            prototype: {
                ...baseProps.prototype,
                height: 1080,
                width: 25
            },
            imageDimensions: {
                width: 25,
                height: 1080
            }
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )
        expect(wrapper.find('.container').prop('style')).toHaveProperty(
            'height',
            props.imageDimensions.height + PERSISTENT_BAR_HEIGHT
        )
    })
    it('should render a large flat prototype embed on large screens', async () => {
        resizeWindow(768, 1800)
        const getEmbedSizeSpy = jest
            .spyOn(EmbedHelpers, 'getEmbedSize')
            .mockReturnValue({
                width: 100,
                height: 100
            })
        const props = {
            ...baseProps,
            size: BlotSize.Large
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        const ratio = calculateAspectRatio(100, 100)
        const embedStyles = EmbedHelpers.getEmbedStyles(
            ratio,
            props.container,
            BlotSize.Large
        )
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        expect(wrapper.find('.container').prop('style')).toEqual({
            ...embedStyles,
            height:
                embedStyles.width *
                    (props.imageDimensions.height /
                        props.imageDimensions.width) +
                PERSISTENT_BAR_HEIGHT,
            overflow: 'hidden'
        })
        getEmbedSizeSpy.mockRestore()
    })
    it('should render a large flat prototype embed on small screens', async () => {
        resizeWindow(768, 735)
        const getEmbedSizeSpy = jest
            .spyOn(EmbedHelpers, 'getEmbedSize')
            .mockReturnValue({
                width: 100,
                height: 100
            })
        const props = {
            ...baseProps,
            size: BlotSize.Large
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        const mediumProvider = new FlatPrototypeEmbedContainer({
            ...props,
            size: BlotSize.Medium
        })
        const ratio = calculateAspectRatio(100, 100)
        const embedStyles = EmbedHelpers.getEmbedStyles(
            ratio,
            props.container,
            BlotSize.Large
        )
        await setImmediatePromise()

        const mediumWrapper = shallow(
            <Component provider={mediumProvider}>
                <FlatPrototypeEmbed {...props} size={BlotSize.Medium} />
            </Component>
        )
        const wrapper = shallow(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )
        const expectedHeight =
            embedStyles.width *
                (props.imageDimensions.height / props.imageDimensions.width) +
            PERSISTENT_BAR_HEIGHT
        expect(wrapper.html()).toContain(
            `class="container popoutClosed" style="height:${expectedHeight}px;overflow:hidden;width:${embedStyles.width}px;left:${embedStyles.left}"`
        )
        // Large embed should be the same size as a medium embed on small screens
        expect(mediumWrapper.html()).toContain(
            `class="container" style="height:${expectedHeight}px;overflow:hidden;width:${embedStyles.width}px;left:${embedStyles.left}"`
        )
        getEmbedSizeSpy.mockRestore()
    })
    it('should render a cross team embed', async () => {
        const props = {
            ...baseProps,
            originalLink:
                'https://no.invisionapp.com/freehand/document/rD4MXMdKY'
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )
        const crossTeamWarning = wrapper.find('.serviceErrorMessageContainer')
        expect(crossTeamWarning).toHaveLength(1)
        expect(crossTeamWarning.html()).toContain(CROSS_TEAM_FAILURE)
    })
    it('renders a mobile prototype in the embed', async () => {
        const props = {
            ...baseProps,
            prototype: {
                ...baseProps.prototype,
                isMobile: true
            }
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        expect(wrapper.find('.thumbnailEmbed').prop('style')).toEqual({
            '--aspect-ratio': 16 / 9,
            backgroundImage: `url(${props.prototype.thumbnail})`,
            height: `${props.container.clientWidth * DEFAULT_RATIO}px`,
            width: `${props.container.clientWidth}px`
        })
    })
    it('renders a smaller mobile prototype in the embed', async () => {
        const props = {
            ...baseProps,
            prototype: {
                ...baseProps.prototype,
                isMobile: true,
                height: 25,
                width: 25
            }
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        expect(wrapper.find('.thumbnailEmbed').prop('style')).toEqual({
            '--aspect-ratio': 16 / 9,
            backgroundImage: `url(${props.prototype.thumbnail})`,
            height: `${props.prototype.height}px`,
            width: `${props.prototype.width}px`
        })
    })
    it('should fall back to a placeholder if there is no prototype object', async () => {
        const props = {
            ...baseProps,
            prototype: null
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        expect(wrapper.find('.thumbnailEmbed').prop('style')).toEqual({
            backgroundImage: 'url(prototype-placeholder.png)'
        })

        wrapper.find('#open-popout-extended').simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
    })
    it('should open the popout', async () => {
        const provider = new FlatPrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...baseProps} />
            </Component>
        )

        wrapper.find('#open-popout-extended').simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
    })
    it('should open the popout on a small size', async () => {
        const props = {
            ...baseProps,
            size: BlotSize.Small
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        wrapper.find('#open-popout-extended').simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
    })
    it('should use the original link in the popout if there is no transformed url', async () => {
        const props = {
            ...baseProps,
            url: null
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        wrapper.find('#open-popout-extended').simulate('click')
        expect(
            document.querySelector('.modal iframe')!.getAttribute('src')
        ).toEqual(props.originalLink)
    })
    it('should open the popout using the button', async () => {
        const provider = new FlatPrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...baseProps} />
            </Component>
        )

        const preventDefaultMock = jest.fn()
        wrapper
            .find('button.editButton')
            .simulate('mouseDown', { preventDefault: preventDefaultMock })
        expect(preventDefaultMock).toHaveBeenCalled()
        wrapper.find('button.editButton').simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
    })
    it('should open the popout using the button on a placeholder', async () => {
        const props = {
            ...baseProps,
            prototype: null
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )
        const preventDefaultMock = jest.fn()

        wrapper
            .find('button.editButton')
            .simulate('mouseDown', { preventDefault: preventDefaultMock })
        expect(preventDefaultMock).toHaveBeenCalled()
        wrapper.find('button.editButton').simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
    })
    it('should use medium as the blot size if one is not provided', async () => {
        const props = {
            ...baseProps,
            size: undefined
        }
        const provider = new FlatPrototypeEmbedContainer(props)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <FlatPrototypeEmbed {...props} />
            </Component>
        )

        expect(
            wrapper.find(AnimatedEmbedWrapper).instance().props
        ).toHaveProperty('size', BlotSize.Medium)
    })
    it('should transform URLs for the popout view', async () => {
        const provider = new FlatPrototypeEmbedContainer(baseProps)
        const consoleUrl =
            'https://invisionapp.com/console/My-Prototype-cjoirq3vp0rlu017ovt5o8vb3/'
        expect(
            provider.getPlayUrl(
                new URI(
                    'https://invisionapp.com/overview/My-Prototype-cjoirq3vp0rlu017ovt5o8vb3/screens'
                )
            )
        ).toEqual(consoleUrl)
        expect(
            provider.getPlayUrl(
                new URI(
                    'https://invisionapp.com/public/share/K3WTI79J6#/screens'
                )
            )
        ).toEqual('https://invisionapp.com/public/share/K3WTI79J6#/screens')
        expect(provider.getPlayUrl(new URI(consoleUrl))).toEqual(consoleUrl)
    })
    it('should make the correct calls to get prototype info', async () => {
        const provider = new FlatPrototypeEmbedContainer(baseProps)
        PagesApiService.prototype.getFlatPrototypeByScreen = jest.fn()
        PagesApiService.prototype.getFlatPrototypeByHash = jest.fn()
        PagesApiService.prototype.getFlatPrototypeByShareKey = jest.fn()

        await provider.getPrototypeInfo(
            new URI(
                'https://invisionapp.com/overview/My-Prototype-cjoirq3vp0rlu017ovt5o8vb3/screens'
            )
        )
        expect(
            PagesApiService.prototype.getFlatPrototypeByHash
        ).toHaveBeenCalled()
        await provider.getPrototypeInfo(
            new URI(
                'https://slate.invisionbeta.com/console/Test-Prototype-cjoirq3vp0rlu017ovt5o8vb3/cjoirqq680rm0017oc83y49v0/play'
            )
        )
        expect(
            PagesApiService.prototype.getFlatPrototypeByScreen
        ).toHaveBeenCalled()
        await provider.getPrototypeInfo(
            new URI(
                'https://slate.invisionbeta.com/console/Test-Prototype-cjoirq3vp0rlu017ovt5o8vb3'
            )
        )
        expect(
            PagesApiService.prototype.getFlatPrototypeByHash
        ).toHaveBeenCalledTimes(2)
        await provider.getPrototypeInfo(
            new URI('https://invisionapp.com/public/share/K3WTI79J6#/screens')
        )
        expect(
            PagesApiService.prototype.getFlatPrototypeByShareKey
        ).toHaveBeenCalled()
        const notValid = await provider.getPrototypeInfo(
            new URI(
                'https://invisionapp.com/notathing/share/K3WTI79J6#/screens'
            )
        )
        expect(notValid).toEqual(defaultFlatPrototype)
        const defaultResponse = await provider.getPrototypeInfo(
            new URI('https://nomatch.com')
        )
        expect(defaultResponse).toEqual(defaultFlatPrototype)
    })
})
