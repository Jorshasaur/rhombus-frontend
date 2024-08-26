import * as actions from '../../../data/images/actions'
import reducer from '../../../data/images/reducers'

const initialState = {
    activeImage: '',
    imageDatas: {},
    imageList: []
}

const buildState = (updatedState: any = {}) => {
    return Object.assign({}, initialState, updatedState)
}

describe('images actions', () => {
    describe('addImageData', () => {
        it('adds new image data to the store', () => {
            const prevState = buildState()

            const data = {
                id: 'id',
                assetId: 'assetId',
                authorId: '',
                url: '',
                createdAt: ''
            }
            const action = actions.addImageData(data)
            const newState = reducer(prevState, action)
            const expectedState = buildState({
                imageDatas: {
                    [data.id]: data
                }
            })
            expect(newState).toEqual(expectedState)
        })
    })

    describe('addImageDatas', () => {
        it('adds new image datas to the store', () => {
            const prevState = buildState()

            const data = [
                {
                    id: 'id',
                    assetId: 'assetId',
                    authorId: '',
                    url: '',
                    createdAt: ''
                },
                {
                    id: 'id2',
                    authorId: '',
                    url: '',
                    createdAt: ''
                }
            ]
            const action = actions.addImageDatas(data)
            const newState = reducer(prevState, action)
            const expectedState = buildState({
                imageDatas: {
                    [data[0].id]: data[0],
                    [data[1].id]: data[1]
                }
            })
            expect(newState).toEqual(expectedState)
        })
    })

    describe('clearActiveImage', () => {
        it('clears active image from store', () => {
            const prevState = buildState({
                activeImage: 'activeImage'
            })
            const action = actions.clearActiveImage()
            const newState = reducer(prevState, action)
            const expectedState = buildState()
            expect(newState).toEqual(expectedState)
        })
    })

    describe('newActiveImage', () => {
        it('sets an active image to the store', () => {
            const prevState = buildState()
            const activeImage = 'activeImage'
            const action = actions.newActiveImage(activeImage)
            const newState = reducer(prevState, action)
            const expectedState = buildState({
                activeImage
            })
            expect(newState).toEqual(expectedState)
        })
    })

    describe('setImageList', () => {
        it('sets an image list to the store', () => {
            const prevState = buildState()
            const imageList = ['image1']
            const action = actions.setImageList(imageList)
            const newState = reducer(prevState, action)
            const expectedState = buildState({
                imageList
            })
            expect(newState).toEqual(expectedState)
        })
    })
})
