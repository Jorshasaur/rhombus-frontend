import React from 'react'
import { mount, shallow } from 'enzyme'
import CodepenEmbed from '../../components/pages/Editor/Blots/CodepenEmbed'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { setupQlEditor, createContainer } from '../utils'
import { BlotSize } from '../../interfaces/blotSize'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { EmbedModal } from '../../components/pages/Editor/Blots/EmbedModal'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'

const service: BlockEmbedService = 'codepen'

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
    originalLink: 'https://codepen.io/FilipVitas/pen/yWyvwy',
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

describe('<CodepenEmbed />', () => {
    beforeAll(() => {
        setupQlEditor()
    })

    beforeEach(() => {
        EmbedModal.mount()
    })

    afterEach(() => {
        EmbedModal.unmount()
    })

    it('should render a Codepen embed', async () => {
        const wrapper = shallow(
            <Component>
                <CodepenEmbed {...baseProps} />
            </Component>
        )

        const codepen = wrapper.find('CodepenEmbed').dive()
        expect(codepen).toMatchSnapshot()
    })

    it('should set a timestamp', async () => {
        const wrapper = mount(
            <Component>
                <CodepenEmbed {...baseProps} />
            </Component>
        )
        const timestamp = wrapper.find('div.persistentTimestamp').first()
        expect(timestamp).toIncludeText('Added')
        expect(timestamp).toIncludeText(`ago by ${baseProps.authorName}`)
        const title = wrapper.find(testid('persistent-bar-title')).first()
        expect(title.text()).toContain('Codepen')
    })

    it('should open the modal', async () => {
        const track = jest.fn()
        AnalyticsBuilder.prototype.track = track

        const wrapper = mount(
            <Component>
                <CodepenEmbed {...baseProps} />
            </Component>
        )

        wrapper
            .find('Button' + testid('codepen-embed__expand-button'))
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
