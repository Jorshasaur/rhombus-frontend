import * as url from '../../data/url'
import { UNSAFE_URL_CHARACTERS } from '../../constants/network'

describe('url', () => {
    it('should return documentId and shortId from slugAndShortId', () => {
        expect(
            url.getIds('Bla-bbb-aaaaa-0123-c~_-a5-eXNEfNKEHjaDSqU4gZUv8M')
        ).toEqual({
            shortId: 'eXNEfNKEHjaDSqU4gZUv8M',
            documentId: '71117704-9829-4fb2-96fe-6bf43ffad8a7'
        })

        expect(url.getIds('71117704-9829-4fb2-96fe-6bf43ffad8a7')).toEqual({
            shortId: 'eXNEfNKEHjaDSqU4gZUv8M',
            documentId: '71117704-9829-4fb2-96fe-6bf43ffad8a7'
        })
    })

    it('should return url path', () => {
        expect(
            url.getPath(
                'Bla bbb aaaaa 0123 + ' + UNSAFE_URL_CHARACTERS + ' č…~_	a50%',
                'eXNEfNKEHjaDSqU4gZUv8M'
            )
        ).toEqual('Bla-bbb-aaaaa-0123-c_-a50-eXNEfNKEHjaDSqU4gZUv8M')
    })
})
