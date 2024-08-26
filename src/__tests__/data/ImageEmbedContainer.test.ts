import ImageEmbedContainer from '../../components/pages/Editor/Blots/ImageEmbedContainer'
import setImmediatePromise from 'set-immediate-promise'
import { BlotSize } from '../../interfaces/blotSize'
jest.mock('../../data/store', () => {
    return {
        subscribe: jest.fn(() => ({
            permissions: {
                canEdit: true
            }
        })),
        getState: jest.fn(() => ({
            permissions: {
                canEdit: true
            },
            assets: {
                '123': {
                    id: '123',
                    url: 'http://asset'
                }
            }
        }))
    }
})
describe('ImageEmbedContainer', () => {
    const imageEmbedData = {
        embedData: {
            id: '123'
        },
        uuid: '1',
        service: 'image',
        version: 1,
        authorId: '1'
    }

    it('should set width and height', async () => {
        ImageEmbedContainer.prototype.setEmbedDataValue = jest.fn()
        ImageEmbedContainer.prototype.setDataAttribute = jest.fn()

        const size = {
            width: 600,
            height: 600
        }

        ImageEmbedContainer.prototype.getImageSize = jest.fn(() => {
            return Promise.resolve(size)
        })

        new ImageEmbedContainer(imageEmbedData)

        await setImmediatePromise()

        expect(ImageEmbedContainer.prototype.setEmbedDataValue).toBeCalledWith(
            size
        )
    })

    it('should set size', async () => {
        ImageEmbedContainer.prototype.setEmbedDataValue = jest.fn()
        ImageEmbedContainer.prototype.setDataAttribute = jest.fn()

        const size = {
            width: 600,
            height: 600
        }

        ImageEmbedContainer.prototype.getImageSize = jest.fn(() => {
            return Promise.resolve(size)
        })

        new ImageEmbedContainer(imageEmbedData)

        await setImmediatePromise()

        expect(ImageEmbedContainer.prototype.setDataAttribute).toBeCalledWith(
            'size',
            BlotSize.Medium
        )
    })

    it('should set small size when ratio is lower than SMALL_SIZE_RATIO', async () => {
        ImageEmbedContainer.prototype.setEmbedDataValue = jest.fn()
        ImageEmbedContainer.prototype.setDataAttribute = jest.fn()

        const size = {
            width: 300,
            height: 600
        }

        ImageEmbedContainer.prototype.getImageSize = jest.fn(() => {
            return Promise.resolve(size)
        })

        new ImageEmbedContainer(imageEmbedData)

        await setImmediatePromise()

        expect(ImageEmbedContainer.prototype.setDataAttribute).toBeCalledWith(
            'size',
            BlotSize.Small
        )
    })

    it('should set size if there is already width and height in initial state', async () => {
        ImageEmbedContainer.prototype.setDataAttribute = jest.fn()

        const initialData = Object.assign({}, imageEmbedData, {
            embedData: {
                id: '123',
                width: 300,
                height: 600
            }
        })

        new ImageEmbedContainer(initialData)

        await setImmediatePromise()

        expect(ImageEmbedContainer.prototype.setDataAttribute).toBeCalledWith(
            'size',
            BlotSize.Small
        )
    })
})
