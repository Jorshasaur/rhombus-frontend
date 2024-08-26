import * as actionCreators from '../../../data/images/actionCreators'
import * as actions from '../../../data/images/actions'
import * as selectors from '../../../data/images/selectors'

jest.mock('../../../data/images/actions')
jest.mock('../../../data/images/selectors')

const dispatch = jest.fn()
const getState = jest.fn()

describe('images action dispatchers', () => {
    describe('addImageData', () => {
        it('calls addImageData action', () => {
            const image = {
                id: '',
                assetId: '',
                authorId: '',
                url: '',
                createdAt: ''
            }
            actionCreators.addImageData(image)
            expect(actions.addImageData).toBeCalled()
        })
    })

    describe('clearActiveImage', () => {
        it('calls clearActiveImage action', () => {
            actionCreators.clearActiveImage()
            expect(actions.clearActiveImage).toBeCalled()
        })
    })

    describe('newActiveImage', () => {
        it('calls newActiveImage action', () => {
            const image = 'image1'
            actionCreators.newActiveImage(image)
            expect(actions.newActiveImage).toBeCalledWith(image)
        })
    })

    describe('nextImage', () => {
        it('calls newActiveImage action with next image', () => {
            const image = 'image1'
            // @ts-ignore
            selectors.getNextImageId.mockImplementationOnce(() => {
                return image
            })
            actionCreators.nextImage()(dispatch, getState)
            expect(actions.newActiveImage).toBeCalledWith(image)
        })
    })

    describe('previousImage', () => {
        it('calls newActiveImage action with previous image', () => {
            const image = 'image1'
            // @ts-ignore
            selectors.getPreviousImageId.mockImplementationOnce(() => {
                return image
            })
            actionCreators.previousImage()(dispatch, getState)
            expect(actions.newActiveImage).toBeCalledWith(image)
        })
    })

    describe('setImageList', () => {
        it('calls setImageList action', () => {
            const imageList = ['image1']
            actionCreators.setImageList(imageList)
            expect(actions.setImageList).toBeCalledWith(imageList)
        })
    })
})
