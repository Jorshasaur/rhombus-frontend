import React from 'react'
import { mount, MountRendererProps } from 'enzyme'
import Axios from 'axios'
import { Provider } from 'unstated'
import FreehandEmbed from '../../../components/pages/Editor/Blots/FreehandEmbed/FreehandEmbed'
import FreehandEmbedContainer from '../../../components/pages/Editor/Blots/FreehandEmbed/FreehandEmbedContainer'
import setImmediatePromise from 'set-immediate-promise'
import { BlockEmbedService } from '../../../interfaces/blockEmbed'
import { setupQlEditor, createContainer } from '../../utils'
import URI from 'urijs'
import PagesApiService from '../../../data/services/PagesApiService'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import AnalyticsBuilder from '../../../analytics/AnalyticsBuilders/AnalyticsBuilder'
import { Button } from '@invisionapp/helios'
import FreehandCanvas from '../../../components/pages/Editor/Blots/FreehandEmbed/FreehandCanvas'
import { ACCESS_FAILURE } from '../../../components/pages/Editor/Blots/ServiceErrorEmbed/ServiceErrorMessages'
import { EmbedModal } from '../../../components/pages/Editor/Blots/EmbedModal'

jest.mock('../../../data/store', () => {
    return {
        subscribe: jest.fn(),
        getState: () => ({
            permissions: {
                canEdit: true
            },
            featureFlags: {
                nightly: false
            },
            user: {
                userId: 1,
                teamId: '2'
            }
        })
    }
})

jest.mock('@invisionapp/freehand-canvas-2d', () => {
    const { noop } = require('lodash')
    return {
        FreehandCanvas2D: class FreehandCanvas2D {
            on = noop
            updateContent = noop
            updateSize = noop
        }
    }
})

const clickEvent: Object = {
    preventDefault() {
        //
    },
    stopPropagation() {
        //
    }
}
const trackSpy = jest
    .spyOn(AnalyticsBuilder.prototype, 'track')
    .mockImplementation(jest.fn())

const createComponent = async (
    props: any = {},
    options?: MountRendererProps
) => {
    const subdomain = new URI().subdomain()

    const baseProps = {
        originalLink: `https://${subdomain}.invisionapp.com/freehand/document/rD4MXMdKY`,
        authorId: '1',
        authorName: 'James Dean',
        key: '123456',
        service: 'file' as BlockEmbedService,
        uuid: '123456',
        version: 1,
        container: createContainer(100, 100),
        embedData: {}
    }

    const provider = new FreehandEmbedContainer({ ...baseProps, ...props })
    await setImmediatePromise()

    return mount(
        <ThemeProvider theme={theme}>
            <Provider inject={[provider]}>
                <FreehandEmbed {...baseProps} {...props} />
            </Provider>
        </ThemeProvider>,
        options
    )
}

describe('<FreehandEmbed />', () => {
    beforeAll(() => {
        setupQlEditor()
        window.getComputedStyle = () => ({} as CSSStyleDeclaration)
    })

    beforeEach(() => {
        jest.useRealTimers()
        EmbedModal.mount()
    })

    afterEach(() => {
        jest.resetAllMocks()
        EmbedModal.unmount()
    })

    it('renders', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })

        const props = {
            embedData: { id: '123' }
        }
        Axios.get = jest.fn(() =>
            Promise.resolve({
                data: { externalDocument: { thumbnailUrl: 'img.png' } }
            })
        )
        const wrapper = await createComponent(props)
        expect(wrapper.find('.ratio')).toExist()
        expect(wrapper.find(FreehandCanvas)).toExist()
        expect(wrapper.find(Button).text()).toContain('Edit')
    })

    it('should render a placeholder on a 404', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: null,
            name: null,
            id: '',
            updatedAt: null
        })

        Axios.get = jest.fn(() =>
            Promise.resolve({
                data: { externalDocument: { thumbnailUrl: 'img.png' } }
            })
        )
        const wrapper = await createComponent()

        expect(wrapper.find('.ratio')).toExist()
        expect(wrapper.find(FreehandCanvas)).not.toExist()
    })

    it('should render a small embed with a warning on permission error', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: false,
            error: ACCESS_FAILURE
        })

        const props = {
            embedData: { id: '123' }
        }
        Axios.get = jest.fn(() =>
            Promise.resolve({
                data: { externalDocument: { thumbnailUrl: 'img.png' } }
            })
        )
        const wrapper = await createComponent(props)

        expect(wrapper.find('Text')).toHaveText(
            'You do not have access to this document'
        )

        wrapper.find('ServiceErrorEmbed').simulate('click')
        expect(trackSpy).toHaveBeenCalledTimes(2)
    })

    it('should open the modal', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })
        const wrapper = await createComponent()
        const freehand = wrapper.find('FreehandEmbed')

        expect(EmbedModal.isShown()).toBe(false)
        freehand.find('Button').simulate('click', clickEvent)
        expect(EmbedModal.isShown()).toBe(true)
        // @ts-ignore
        freehand.instance().handleIframeLoad()
        const iframe = document.querySelector('iframe')
        expect(document.activeElement).toBe(iframe)
        expect(trackSpy).toHaveBeenCalledTimes(1)
    })

    it('should automatically open the modal for freshly-created freehands', async () => {
        jest.useFakeTimers()

        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })

        const subdomain = new URI().subdomain()

        const originalLink = `https://${subdomain}.invisionapp.com/freehand/document/rD4MXMdKY?createdInRhombus=true`

        await createComponent({ originalLink })
        expect(EmbedModal.isShown()).toBe(false)

        jest.runAllTimers()

        expect(EmbedModal.isShown()).toBe(true)
    })

    it('should close the modal', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })
        const wrapper = await createComponent()
        const freehand = wrapper.find('FreehandEmbed')

        expect(EmbedModal.isShown()).toBe(false)
        freehand.find('Button').simulate('click', clickEvent)
        expect(EmbedModal.isShown()).toBe(true)
        document
            .querySelector<HTMLAnchorElement>(
                testid('embed-modal__close-button')
            )!
            .click()
        expect(EmbedModal.isShown()).toBe(false)
        expect(trackSpy).toHaveBeenCalledTimes(2)
    })

    it('should open in a new tab', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })
        const wrapper = await createComponent({})
        const freehand = wrapper.find('FreehandEmbed')

        freehand.find('Button').simulate('click', clickEvent)
        document
            .querySelector<HTMLAnchorElement>(
                testid('freehand-embed__new-tab')
            )!
            .click()
        expect(trackSpy).toHaveBeenCalledTimes(2)
    })

    it('should track zooming an dragging', async () => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })

        const component = await createComponent({})

        const instance = component
            .find('FreehandCanvas')
            .instance() as FreehandCanvas

        instance.props.onZoom()
        expect(trackSpy).toHaveBeenCalled()

        instance.props.onPan()
        expect(trackSpy).toHaveBeenCalledTimes(2)
    })

    // eslint-disable-next-line
    it('should update the size of the freehandCanvas', async (done) => {
        jest.spyOn(PagesApiService, 'getFreehand').mockResolvedValue({
            success: true,
            content: '↵�↵Initial thoughts�cjsw8020a00033e5d7o3',
            name: 'Super neat freehand',
            updatedAt: '2019-03-05T20:23:09Z'
        })

        const component = await createComponent({})

        const embed = component.find(FreehandEmbed)
        const embedInstance = embed.instance() as FreehandEmbed

        embedInstance.freehandCanvas.updateSize = jest.fn()

        component
            .find('AnimatedEmbedWrapper')
            .instance()
            .setState({ height: 3000 })

        setTimeout(() => {
            expect(embedInstance.freehandCanvas.updateSize).toBeCalled()
            done()
        }, 300)
    })
})
