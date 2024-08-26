import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

import DirectIframeBlockEmbed from '../../components/pages/Editor/Blots/DirectIframeBlockEmbed'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
Enzyme.configure({ adapter: new Adapter() })

const directIframeBlockEmbedProps = {
    authorId: '1',
    originalLink: 'https://link.com',
    key: '123456',
    service: 'none' as BlockEmbedService,
    title: 'Prototype',
    type: 'iframe',
    uuid: '123456',
    version: 1
}

describe('Authors', () => {
    it('should be an instance of DirectIframeBlockEmbed', () => {
        const wrapper = shallow(
            <DirectIframeBlockEmbed {...directIframeBlockEmbedProps} />
        )
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(DirectIframeBlockEmbed)
    })
    it('should not render an unknown service', () => {
        const wrapper = shallow(
            <DirectIframeBlockEmbed {...directIframeBlockEmbedProps} />
        )
        expect(wrapper.find('iframe')).toHaveLength(0)
    })
    it('should render a YouTube iframe', () => {
        const youTubeProps = {
            ...directIframeBlockEmbedProps,
            originalLink: 'https://www.youtube.com/watch?v=Yn2XpuxDBgY',
            service: 'youtube' as BlockEmbedService
        }
        const wrapper = shallow(<DirectIframeBlockEmbed {...youTubeProps} />)
        expect(wrapper.find('iframe')).toHaveLength(1)
        expect(
            wrapper.find('iframe').filterWhere((item) => {
                return (
                    item.prop('src') ===
                    'https://www.youtube.com/embed/Yn2XpuxDBgY'
                )
            })
        ).toHaveLength(1)
    })
    it('should render a Vimeo iframe', () => {
        const vimeoProps = {
            ...directIframeBlockEmbedProps,
            originalLink: 'https://vimeo.com/204530288',
            service: 'vimeo' as BlockEmbedService
        }
        const wrapper = shallow(<DirectIframeBlockEmbed {...vimeoProps} />)
        expect(wrapper.find('iframe')).toHaveLength(1)
        expect(
            wrapper.find('iframe').filterWhere((item) => {
                return (
                    item.prop('src') ===
                    'https://player.vimeo.com/video/204530288'
                )
            })
        ).toHaveLength(1)
    })
    it('should render a SoundCloud iframe', () => {
        const soundCloudProps = {
            ...directIframeBlockEmbedProps,
            originalLink:
                'https://soundcloud.com/alunageorge/body-music-minimix',
            service: 'soundcloud' as BlockEmbedService
        }
        const wrapper = shallow(<DirectIframeBlockEmbed {...soundCloudProps} />)
        expect(wrapper.find('iframe')).toHaveLength(1)
        expect(
            wrapper.find('iframe').filterWhere((item) => {
                const src =
                    'https://w.soundcloud.com/player/?url=https://soundcloud.com/alunageorge/body-music-minimix&autoplay=false'
                return item.prop('src') === src
            })
        ).toHaveLength(1)
    })
    it('should render a Spotify iframe', () => {
        const spotifyProps = {
            ...directIframeBlockEmbedProps,
            originalLink:
                'https://open.spotify.com/track/3K7Q9PHUWPTaknlbFPThn2',
            service: 'spotify' as BlockEmbedService
        }
        const wrapper = shallow(<DirectIframeBlockEmbed {...spotifyProps} />)
        expect(wrapper.find('iframe')).toHaveLength(1)
        expect(
            wrapper.find('iframe').filterWhere((item) => {
                return (
                    item.prop('src') ===
                    'https://embed.spotify.com/?uri=https://open.spotify.com/track/3K7Q9PHUWPTaknlbFPThn2'
                )
            })
        ).toHaveLength(1)
    })
    it('should render a LinkedIn member scripts', () => {
        const spotifyProps = {
            ...directIframeBlockEmbedProps,
            originalLink: 'https://www.linkedin.com/in/clarkvalberg/',
            service: 'linkedin' as BlockEmbedService
        }
        const wrapper = shallow(<DirectIframeBlockEmbed {...spotifyProps} />)
        expect(wrapper.find('script')).toHaveLength(1)
        expect(
            wrapper.find('script').filterWhere((item) => {
                return (
                    item.prop('data-id') ===
                    'https://www.linkedin.com/in/clarkvalberg/'
                )
            })
        ).toHaveLength(1)
        expect(
            wrapper.find('script').filterWhere((item) => {
                return item.prop('type') === 'IN/MemberProfile'
            })
        ).toHaveLength(1)
    })
    it('should render a LinkedIn company scripts', () => {
        const spotifyProps = {
            ...directIframeBlockEmbedProps,
            originalLink: 'https://www.linkedin.com/company/invisionapp/',
            service: 'linkedin' as BlockEmbedService
        }
        const wrapper = shallow(<DirectIframeBlockEmbed {...spotifyProps} />)
        expect(wrapper.find('script')).toHaveLength(1)
        expect(
            wrapper.find('script').filterWhere((item) => {
                return (
                    item.prop('data-id') ===
                    'https://www.linkedin.com/company/invisionapp/'
                )
            })
        ).toHaveLength(1)
        expect(
            wrapper.find('script').filterWhere((item) => {
                return item.prop('type') === 'IN/CompanyProfile'
            })
        ).toHaveLength(1)
    })
})
