import { createImageToImageAnimation } from '../../helpers/ImageHelper'

describe('createImageToImageAnimation', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it("returns nothing if first selector isn't found", () => {
        const img2 = document.createElement('img')
        img2.id = 'selector2'
        document.body.appendChild(img2)

        const cancelFunc = createImageToImageAnimation(
            '#selector1',
            '#selector2'
        )
        expect(cancelFunc).toBeUndefined()
    })

    it("returns nothing if second selector isn't found", () => {
        const img1 = document.createElement('img')
        img1.id = 'selector1'
        document.body.appendChild(img1)

        const cancelFunc = createImageToImageAnimation(
            '#selector1',
            '#selector2'
        )
        expect(cancelFunc).toBeUndefined()
    })

    it('returns a cancel function', () => {
        const img1 = document.createElement('img')
        img1.id = 'selector1'
        document.body.appendChild(img1)

        const img2 = document.createElement('img')
        img2.id = 'selector2'
        document.body.appendChild(img2)

        const cancelFunc = createImageToImageAnimation(
            '#selector1',
            '#selector2'
        )
        expect(cancelFunc).toEqual(expect.any(Function))
    })
})
