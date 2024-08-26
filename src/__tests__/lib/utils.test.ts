import { getFileExtension } from '../../lib/utils'

describe('getFileExtension', () => {
    it('give a file extension when there is one', () => {
        const fileExt = getFileExtension('file.test')
        expect(fileExt).toBe('test')
    })

    it('gives file extension in lower case', () => {
        const fileExt = getFileExtension('FILE.TEST')
        expect(fileExt).toBe('test')
    })

    it('gives file extension when there are multiple periods', () => {
        const fileExt = getFileExtension('file.name.test')
        expect(fileExt).toBe('test')
    })

    it("returns undefined if there's no period", () => {
        const fileExt = getFileExtension('FILETEST')
        expect(fileExt).toBe(undefined)
    })
})
