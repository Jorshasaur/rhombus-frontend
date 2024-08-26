import { DOCUMENT_REGEX } from '../constants'

describe('url', () => {
    it('should match document url', () => {
        expect(DOCUMENT_REGEX.test('/rhombus/Untitled-eXNEfNKEHjaDSqU4gZUv8M')).toBeTruthy()
        expect(DOCUMENT_REGEX.test('/rhombus/Bla-bbb-aaaaa-0123-c~_-a50-eXNEfNKEHjaDSqU4gZUv8M')).toBeTruthy()
        expect(DOCUMENT_REGEX.test('/rhombus/favicon.ico')).toBeFalsy()
    })
})