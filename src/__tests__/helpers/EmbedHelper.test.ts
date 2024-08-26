import {
    getEmbedType,
    FILE_TYPES,
    getEmbedStyles
} from '../../helpers/EmbedHelper'
import * as utils from '../../lib/utils'
import { BlotSize } from '../../interfaces/blotSize'

const getFileExtensionSpy = jest.spyOn(utils, 'getFileExtension')

describe('getEmbedType', () => {
    it('keeps the file type if it is passed in', () => {
        const fileName = 'file.jpg'
        const embedType = getEmbedType(FILE_TYPES.jpg, fileName)
        expect(getFileExtensionSpy).not.toBeCalled()
        expect(embedType).toBe(FILE_TYPES.jpg)
    })

    it('returns an embed type file type is blank and the extension is allowed', () => {
        const fileType = ''
        const fileName = 'file.jpg'
        getFileExtensionSpy.mockImplementationOnce(() => 'jpg')
        const embedType = getEmbedType(fileType, fileName)
        expect(getFileExtensionSpy).toBeCalledWith(fileName)
        expect(embedType).toBe(FILE_TYPES.jpg)
    })

    it("returns undefined if the file type is blank and the extension isn't allowed", () => {
        const fileType = ''
        const fileName = 'file.jpg'
        getFileExtensionSpy.mockImplementationOnce(() => 'notallowed')
        const embedType = getEmbedType(fileType, fileName)
        expect(getFileExtensionSpy).toBeCalledWith(fileName)
        expect(embedType).toBeUndefined()
    })
    it('returns a width with the left position included if the thread is opened', () => {
        const container = document.createElement('div')
        container.setAttribute('width', '100')
        container.setAttribute('height', '100')
        const styles = getEmbedStyles(1, container, BlotSize.Large)
        expect(styles).toEqual({
            height: 776,
            width: 776,
            left: -424
        })
        const secondStyles = getEmbedStyles(1, container, BlotSize.Large, true)
        expect(secondStyles).toEqual({
            height: 424,
            width: 424,
            left: -424
        })
    })
})
