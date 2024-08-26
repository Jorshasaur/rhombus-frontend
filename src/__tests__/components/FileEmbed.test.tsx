import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { Provider } from 'unstated'
import * as sinon from 'sinon'
import FileEmbed from '../../components/pages/Editor/Blots/FileEmbed'
import FileEmbedContainer from '../../components/pages/Editor/Blots/FileEmbedContainer'
import * as dataUtils from '../../data/utils/assets'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'
import { BlockEmbedService } from '../../interfaces/blockEmbed'

jest.mock('../../quillData/ImageSelectors')

Enzyme.configure({ adapter: new Adapter() })

const trackSpy = jest
    .spyOn(AnalyticsBuilder.prototype, 'track')
    .mockImplementation(jest.fn())

const service: BlockEmbedService = 'file'
const baseProps = {
    authorId: '1',
    key: '123456',
    service,
    uuid: '123456',
    version: 1
}

function getAssetLink(asset: { url: string; fileName: string | null }) {
    return `a[href="${asset.url}?filename=${asset.fileName}"]`
}

const sandbox = sinon.createSandbox()
describe('FileEmbed component', () => {
    afterEach(() => {
        sandbox.restore()
    })

    it('should render studio file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.studio' }
        }

        const asset = {
            id: '1',
            url: 'http://studio',
            fileName: 'test.studio'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.studio')).toHaveLength(1)
    })

    it('should render sketch file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.sketch' }
        }

        const asset = {
            id: '1',
            url: 'http://sketch',
            fileName: 'test.sketch'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.sketch')).toHaveLength(1)
    })

    it('should render pdf file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.pdf' }
        }

        const asset = {
            id: '1',
            url: 'http://pdf',
            fileName: 'test.pdf'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.pdf')).toHaveLength(1)
    })

    it('should render excel file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.xlsx' }
        }

        const asset = {
            id: '1',
            url: 'http://excel',
            fileName: 'test.xlsx'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.excel')).toHaveLength(1)
    })

    it('should render word file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.docx' }
        }

        const asset = {
            id: '1',
            url: 'http://word',
            fileName: 'test.docx'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.word')).toHaveLength(1)
    })

    it('should render powerpoint file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.ppt' }
        }

        const asset = {
            id: '1',
            url: 'http://powerpoint',
            fileName: 'test.ppt'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.powerpoint')).toHaveLength(1)
    })

    it('should render movie file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.mp4' }
        }

        const asset = {
            id: '1',
            url: 'http://movie',
            fileName: 'test.mp4'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.movie')).toHaveLength(1)
    })

    it('should render generic file', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.sql' }
        }

        const asset = {
            id: '1',
            url: 'http://generic',
            fileName: 'test.sql'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.unknown')).toHaveLength(1)
    })

    it('should render generic file for no filename', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: null }
        }

        const asset = {
            id: '1',
            url: 'http://generic',
            fileName: props.embedData.fileName
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )

        expect(wrapper.find(getAssetLink(asset))).toHaveLength(1)
        expect(wrapper.find('.serviceIcon.unknown')).toHaveLength(1)
    })

    it('should track when a download is triggered', () => {
        const props = {
            ...baseProps,
            embedData: { id: '123', fileName: 'test.sql' }
        }

        const asset = {
            id: '1',
            url: 'http://generic',
            fileName: 'test.sql'
        }
        sandbox.stub(dataUtils, 'getAsset').returns(asset)

        const provider = new FileEmbedContainer(props)
        const wrapper = mount(
            <Provider inject={[provider]}>
                <FileEmbed {...props} />
            </Provider>
        )
        wrapper.find('span.actionLink a').simulate('mouseDown')
        expect(trackSpy).toHaveBeenCalled()
    })
})
