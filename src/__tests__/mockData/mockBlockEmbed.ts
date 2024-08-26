import { BlotSize } from '../../interfaces/blotSize'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import { BlockEmbedValue } from '../../interfaces/blockEmbed'

const blockEmbedValue: BlockEmbedValue = {
    version: 1,
    originalLink: 'https://link.com',
    service: 'freehand',
    size: BlotSize.Medium,
    type: 'test',
    uuid: '1',
    authorId: '1',
    embedData: {},
    createdAt: '2018-11-08T21:18:24.424Z'
}

export const createMockBlockEmbed = () =>
    new BlockEmbed(BlockEmbed.create(blockEmbedValue))
