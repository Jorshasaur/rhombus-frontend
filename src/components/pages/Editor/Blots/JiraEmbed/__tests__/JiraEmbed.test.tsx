import React from 'react'
import { mount } from 'enzyme'
import { Provider } from 'unstated'
import JiraEmbed from '../JiraEmbed'
import JiraEmbedContainer from '../JiraEmbedContainer'
import { BlockEmbedService } from '../../../../../../interfaces/blockEmbed'

const service: BlockEmbedService = 'jira'
const baseProps = {
    originalLink: 'https://invisionapp.atlassian.net/browse/SLATE-1704',
    authorId: '1',
    key: '123456',
    service,
    uuid: '123456',
    version: 1
}

describe('JiraEmbed component', () => {
    it('should render a jira link as a block embed', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.studio' }
        }

        const provider = new JiraEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <JiraEmbed {...props} />
            </Provider>
        )

        expect(
            wrapper
                .find('.title')
                .render()
                .text()
        ).toBe('SLATE-1704')
        expect(wrapper.find('.newTabLink').prop('href')).toBe(
            baseProps.originalLink
        )
    })
})
