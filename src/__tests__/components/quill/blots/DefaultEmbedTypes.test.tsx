import Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import DefaultEmbedTypes from '../../../../components/quill/blots/DefaultEmbedTypes'
import theQuill from 'quill/core'
import { BlotSize } from '../../../../interfaces/blotSize'
import { BlockEmbedService } from '../../../../interfaces/blockEmbed'
const Parchment = theQuill.import('parchment')

Enzyme.configure({ adapter: new Adapter() })

describe('DefaultEmbedTypes', () => {
    describe('PrototypeEmbed', () => {
        it('should transform motion URLs', () => {
            const parentNode = document.createElement('div')
            const embedNode = document.createElement('div')
            embedNode.setAttribute('data-props', '{}')
            const node: HTMLDivElement = new Parchment.Embed(embedNode).domNode
            parentNode.appendChild(node)

            const prototypePlayUrl =
                'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/play/b4e3d643'

            const service: BlockEmbedService = 'prototype'
            const prototypeData = {
                version: 1,
                originalLink:
                    'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/inspect/b4e3d643/motion',
                service,
                type: 'prototype',
                uuid: 'string',
                authorId: 'string',
                embedData: {},
                embed: {},
                createdAt: 'string',
                size: BlotSize.Medium,
                dataUrl: 'string',
                unviewable: false
            }
            const prototypeEmbed: any = DefaultEmbedTypes.prototype(
                prototypeData,
                node
            )
            expect(prototypeEmbed[0].props.children.props.originalLink).toEqual(
                prototypePlayUrl
            )
        })
        it('should transform a motion URL if the segments contain uppercase', () => {
            const parentNode = document.createElement('div')
            const embedNode = document.createElement('div')
            embedNode.setAttribute('data-props', '{}')
            const node: HTMLDivElement = new Parchment.Embed(embedNode).domNode
            parentNode.appendChild(node)

            const prototypePlayUrl =
                'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/play/b4e3d643'

            const service: BlockEmbedService = 'prototype'
            const prototypeData = {
                version: 1,
                originalLink:
                    'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/inspect/b4e3d643/motion',
                service,
                type: 'prototype',
                uuid: 'string',
                authorId: 'string',
                embedData: {},
                embed: {},
                createdAt: 'string',
                size: BlotSize.Medium,
                dataUrl: 'string',
                unviewable: false
            }
            const prototypeEmbed: any = DefaultEmbedTypes.prototype(
                prototypeData,
                node
            )
            expect(prototypeEmbed[0].props.children.props.originalLink).toEqual(
                prototypePlayUrl
            )
        })
        it('should transform comment URLs', () => {
            const parentNode = document.createElement('div')
            const embedNode = document.createElement('div')
            embedNode.setAttribute('data-props', '{}')
            const node: HTMLDivElement = new Parchment.Embed(embedNode).domNode
            parentNode.appendChild(node)

            const prototypePlayUrl =
                'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/play/b4e3d643'

            const service: BlockEmbedService = 'prototype'
            const prototypeData = {
                version: 1,
                originalLink:
                    'https://invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/comment/b4e3d643',
                service,
                type: 'prototype',
                uuid: 'string',
                authorId: 'string',
                embedData: {},
                embed: {},
                createdAt: 'string',
                size: BlotSize.Medium,
                dataUrl: 'string',
                unviewable: false
            }
            const prototypeEmbed: any = DefaultEmbedTypes.prototype(
                prototypeData,
                node
            )
            expect(prototypeEmbed[0].props.children.props.originalLink).toEqual(
                prototypePlayUrl
            )
        })
    })
})
