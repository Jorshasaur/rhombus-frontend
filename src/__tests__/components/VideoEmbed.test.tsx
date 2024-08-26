import React from 'react'
import { mount } from 'enzyme'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { Provider } from 'unstated'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { createContainer, setupQlEditor } from '../utils'
import { BlotSize } from '../../interfaces/blotSize'
import * as EmbedHelpers from '../../helpers/EmbedHelper'
import FileEmbedContainer from '../../components/pages/Editor/Blots/FileEmbedContainer'
import VideoEmbed from '../../components/pages/Editor/Blots/VideoEmbed'
import MockDate from 'mockdate'

const asset = {
    id: '123',
    url: 'http://video.mp4',
    fileName: 'test.mp4'
}

jest.mock('../../data/store', () => {
    return {
        subscribe: jest.fn(),
        getState: jest.fn(() => ({
            permissions: {
                canEdit: true
            },
            assets: {
                '123': asset
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

const service: BlockEmbedService = 'video'

const baseProps = {
    authorId: '1',
    authorName: 'Bob the Builder',
    key: '123456',
    service,
    uuid: '123456',
    version: 1,
    embedData: { id: '123', fileName: 'test.mp4' },
    container: createContainer(100, 100),
    size: BlotSize.Medium,
    createdAt: '2018-04-24T20:09:17.175Z'
}

describe('VideoEmbed component', () => {
    beforeAll(() => {
        setupQlEditor()
        jest.spyOn(EmbedHelpers, 'getContainerWidth').mockReturnValue(100)
        jest.spyOn(EmbedHelpers, 'getEmbedSize').mockReturnValue({
            height: 100,
            width: 100
        })
        window.getComputedStyle = jest.fn(() => {
            return {}
        })
    })

    it('should render a video embed', () => {
        MockDate.set('2019-04-24T20:09:17.175Z')
        const provider = new FileEmbedContainer(baseProps)

        const wrapper = mount(
            <Component provider={provider}>
                <VideoEmbed {...baseProps} />
            </Component>
        )

        const video = wrapper.find('VideoEmbed')
        expect(video).toMatchSnapshot()
    })

    it('should render a placeholder when there is no asset', () => {
        const props = {
            ...baseProps,
            embedData: { id: '222', fileName: 'placeholder.mp4' }
        }

        const provider = new FileEmbedContainer(props)

        const wrapper = mount(
            <Component provider={provider}>
                <VideoEmbed {...props} />
            </Component>
        )

        expect(wrapper.find('Skeleton')).toHaveLength(1)
    })
})
