import React from 'react'
import { mount } from 'enzyme'
import Axios from 'axios'
import { Provider } from 'unstated'
import PrototypeEmbed from '../../components/pages/Editor/Blots/PrototypeEmbed'
import PrototypeEmbedContainer from '../../components/pages/Editor/Blots/PrototypeEmbedContainer'
import setImmediatePromise from 'set-immediate-promise'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { setupQlEditor, createContainer, resizeWindow } from '../utils'
import * as EmbedHelpers from '../../helpers/EmbedHelper'
import { BlotSize } from '../../interfaces/blotSize'
import { calculateAspectRatio } from '../../lib/utils'
import { PERSISTENT_BAR_HEIGHT } from '../../constants/styles'
import { CROSS_TEAM_FAILURE } from '../../components/pages/Editor/Blots/ServiceErrorEmbed/ServiceErrorMessages'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { EmbedModal } from '../../components/pages/Editor/Blots/EmbedModal'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'

const service: BlockEmbedService = 'prototype'

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

const baseProps = {
    originalLink:
        'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/play/b4e3d643',
    authorId: '1',
    authorName: 'Bob the Builder',
    key: '123456',
    service,
    uuid: '123456',
    version: 1,
    embedData: { id: '123' },
    container: createContainer(100, 100),
    size: BlotSize.Medium
}

jest.useFakeTimers()

describe('PrototypeEmbed component', () => {
    beforeAll(() => {
        setupQlEditor()
        jest.spyOn(EmbedHelpers, 'getContainerWidth').mockReturnValue(100)
        window.getComputedStyle = jest.fn(() => {
            return {}
        })
    })

    beforeEach(() => {
        EmbedModal.mount()
    })

    afterEach(() => {
        EmbedModal.unmount()
    })

    it('should render a prototype embed', async () => {
        const axios = Axios as any

        axios.get = () => {
            return Promise.resolve({
                data: {
                    externalDocument: {
                        width: 100,
                        height: 100,
                        thumbnailUrl: 'img.png'
                    }
                }
            })
        }

        const containerState: PrototypeEmbedContainer['state'] = {
            ...baseProps,
            placeholder: 'some-placeholder',
            unviewable: false,
            url: 'some-url',
            prototype: {
                name: 'name',
                width: 30,
                height: 100,
                thumbnailUrl: 'thumbnailUrl',
                updatedAt: 'updatedAt'
            }
        }

        const provider = new PrototypeEmbedContainer(containerState)

        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...baseProps} />
            </Component>
        )

        jest.runAllTimers()
        wrapper.update()

        expect(wrapper.find('.extendedInfo').prop('style').minHeight).toEqual(
            100
        )

        expect(wrapper.find('.extendedInfo iframe').prop('src')).toEqual(
            `${baseProps.originalLink}?hideNavBar=true`
        )
    })
    it('should render a large embed', async () => {
        const container = createContainer(100, 100)
        const props = {
            ...baseProps,
            embedData: { id: '123' },
            size: BlotSize.Large,
            container
        }
        const axios = Axios as any

        axios.get = () => {
            return Promise.resolve({
                data: {
                    externalDocument: {
                        width: 1200,
                        height: 1200,
                        thumbnailUrl: 'img.png'
                    }
                }
            })
        }

        const provider = new PrototypeEmbedContainer(props)
        const ratio = calculateAspectRatio(100, 100)
        const embedStyles = EmbedHelpers.getEmbedStyles(
            ratio,
            container,
            BlotSize.Large
        )

        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...props} />
            </Component>
        )

        jest.runAllTimers()
        wrapper.update()

        expect(wrapper.find('.container').prop('style')).toEqual({
            ...embedStyles,
            height: embedStyles.height + PERSISTENT_BAR_HEIGHT,
            overflow: 'hidden'
        })
        expect(wrapper.find('.extendedInfo').prop('style')).toEqual({
            minHeight: embedStyles.height
        })

        expect(wrapper.find('.extendedInfo iframe').prop('src')).toEqual(
            `${baseProps.originalLink}?hideNavBar=true`
        )
    })
    it('should render a large embed on small screens', async () => {
        resizeWindow(768, 735)
        const container = createContainer(100, 100)
        const props = {
            ...baseProps,
            embedData: { id: '123' },
            size: BlotSize.Large,
            container
        }
        const axios = Axios as any

        axios.get = () => {
            return Promise.resolve({
                data: {
                    externalDocument: {
                        width: 1200,
                        height: 1200,
                        thumbnailUrl: 'img.png'
                    }
                }
            })
        }

        const provider = new PrototypeEmbedContainer(props)
        const mediumProvider = new PrototypeEmbedContainer({
            ...props,
            size: BlotSize.Medium
        })

        await setImmediatePromise()

        const mediumWrapper = mount(
            <Component provider={mediumProvider}>
                <PrototypeEmbed {...props} size={BlotSize.Medium} />
            </Component>
        )

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...props} />
            </Component>
        )

        jest.runAllTimers()
        wrapper.update()
        mediumWrapper.update()

        expect(wrapper.find('.container').prop('style')).toEqual(
            mediumWrapper.find('.container').prop('style')
        )
        expect(wrapper.find('.extendedInfo').prop('style')).toEqual(
            mediumWrapper.find('.extendedInfo').prop('style')
        )
    })
    it('should set a name', async () => {
        const axios = Axios as any
        axios.get = () => {
            return Promise.resolve({
                data: {
                    externalDocument: {
                        name: 'Document Name'
                    }
                }
            })
        }
        const provider = new PrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...baseProps} />
            </Component>
        )
        const textContent = wrapper.find(testid('persistent-bar-title')).first()
        expect(textContent.text()).toContain('Document Name')
    })
    it('should set a timestamp', async () => {
        const axios = Axios as any
        axios.get = () => {
            return Promise.resolve({
                data: {
                    externalDocument: {
                        name: 'Document Name',
                        updatedAt: '2018-11-14T20:16:45.000Z'
                    }
                }
            })
        }
        const provider = new PrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...baseProps} />
            </Component>
        )
        const textContent = wrapper.find('div.persistentTimestamp').first()
        expect(textContent).toIncludeText('Updated')
        expect(textContent).toIncludeText(`ago by ${baseProps.authorName}`)
    })
    it('render a cross team embed', async () => {
        const axios = Axios as any
        const props = {
            ...baseProps,
            originalLink:
                'https://no.invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/play/b4e3d643'
        }
        axios.get = () => {
            return Promise.resolve({
                data: {
                    externalDocument: {
                        width: 100,
                        height: 100,
                        thumbnailUrl: 'img.png'
                    }
                }
            })
        }

        const provider = new PrototypeEmbedContainer(props)

        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...props} />
            </Component>
        )
        const crossTeamWarning = wrapper.find('.serviceErrorMessageContainer')
        expect(crossTeamWarning).toHaveLength(1)
        expect(crossTeamWarning.html()).toContain(CROSS_TEAM_FAILURE)
    })

    it('should open the modal', async () => {
        const track = jest.fn()
        AnalyticsBuilder.prototype.track = track
        const provider = new PrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...baseProps} />
            </Component>
        )

        wrapper
            .find('Button' + testid('prototype-embed__play-button'))
            .simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
        expect(track).toHaveBeenCalled()
        document
            .querySelector<HTMLAnchorElement>(
                testid('embed-modal__close-button')
            )!
            .click()
        expect(EmbedModal.isShown()).toBe(false)
        expect(track).toHaveBeenCalledTimes(2)
        wrapper.find('.newTabLink').simulate('click')
        expect(track).toHaveBeenCalledTimes(3)
    })

    it('should update its size if receiving a new BlotSize via props', async () => {
        const provider = new PrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...baseProps} />
            </Component>
        )
        const instance = wrapper.find('PrototypeEmbed').instance() as any

        const spy = jest.spyOn(instance, '_updateSize')

        instance.componentDidUpdate({ size: BlotSize.Large })

        expect(spy).toHaveBeenCalled()
    })

    it('should remove the resize listener on unmount', async () => {
        const provider = new PrototypeEmbedContainer(baseProps)
        await setImmediatePromise()

        jest.spyOn(window, 'removeEventListener')

        const wrapper = mount(
            <Component provider={provider}>
                <PrototypeEmbed {...baseProps} />
            </Component>
        )

        // @ts-ignore
        wrapper
            .find('PrototypeEmbed')
            .instance()
            .componentWillUnmount()

        expect(window.removeEventListener).toHaveBeenCalled()
    })
})
