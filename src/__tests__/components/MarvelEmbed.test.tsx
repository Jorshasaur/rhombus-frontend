import React from 'react'
import { mount, shallow } from 'enzyme'
import MarvelEmbed from '../../components/pages/Editor/Blots/MarvelEmbed'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { setupQlEditor, createContainer } from '../utils'
import { BlotSize } from '../../interfaces/blotSize'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { EmbedModal } from '../../components/pages/Editor/Blots/EmbedModal'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'

const service: BlockEmbedService = 'marvel'

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

const Component = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={theme}>{children}</ThemeProvider>
)

const baseProps = {
    createdAt: '2018-11-14T20:16:45.000Z',
    originalLink: 'https://marvelapp.com/8eabb41/screen/56077731',
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

describe('<MarvelEmbed />', () => {
    beforeAll(() => {
        setupQlEditor()
    })

    beforeEach(() => {
        EmbedModal.mount()
    })

    afterEach(() => {
        EmbedModal.unmount()
    })

    it('should render a Marvel embed', async () => {
        const wrapper = shallow(
            <Component>
                <MarvelEmbed {...baseProps} />
            </Component>
        )

        const marvel = wrapper.find('MarvelEmbed').dive()
        expect(marvel).toMatchSnapshot()
    })

    it('should set a timestamp', async () => {
        const wrapper = mount(
            <Component>
                <MarvelEmbed {...baseProps} />
            </Component>
        )
        const timestamp = wrapper.find('div.persistentTimestamp').first()
        expect(timestamp).toIncludeText('Added')
        expect(timestamp).toIncludeText(`ago by ${baseProps.authorName}`)
        const title = wrapper.find(testid('persistent-bar-title')).first()
        expect(title.text()).toContain('Marvel')
    })

    it('should open the modal', async () => {
        const track = jest.fn()
        AnalyticsBuilder.prototype.track = track

        const wrapper = mount(
            <Component>
                <MarvelEmbed {...baseProps} />
            </Component>
        )

        wrapper
            .find('Button' + testid('marvel-embed__expand-button'))
            .simulate('click')
        expect(EmbedModal.isShown()).toBe(true)
        expect(track).toHaveBeenCalled()
        document.querySelector<HTMLAnchorElement>('.newTabLink')!.click()
        expect(track).toHaveBeenCalledTimes(2)
        document
            .querySelector<HTMLAnchorElement>(
                testid('embed-modal__close-button')
            )!
            .click()
        expect(EmbedModal.isShown()).toBe(false)
        expect(track).toHaveBeenCalledTimes(3)
    })
})
