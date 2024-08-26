import Delta from 'quill-delta'
import getTitle from '../../components/quill/utils/getTitle'

describe('getTitle', () => {
    it('should get title from document contents', () => {
        const contents = new Delta([
            { insert: 'Untitled' },
            { insert: '\n', attributes: { header: 1 } },
            { insert: 'This is a document whose text is synced in real time\n' }
        ])

        expect(getTitle(contents)).toEqual('Untitled')
    })
})
