import { getImageScaleFactor } from '../../lib/utils'

describe('getImageScaleFactor', () => {
    it('should get image scale factor', () => {
        expect(getImageScaleFactor('image.png')).toEqual(1)
        expect(getImageScaleFactor('image@2x.png')).toEqual(2)
        expect(getImageScaleFactor('image@3x.png')).toEqual(3)
        expect(getImageScaleFactor('image@4x.png')).toEqual(4)
    })
})
