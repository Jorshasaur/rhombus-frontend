import { combineReducers, AnyAction } from 'redux'
import { types } from './types'
import { ImagesStoreState, ImageDataStore } from './interfaces'

export const initialState: ImagesStoreState = {
    activeImage: '',
    imageDatas: {},
    imageList: []
}

function activeImage(
    state: ImagesStoreState['activeImage'] = initialState.activeImage,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case types.NEW_ACTIVE_IMAGE:
            return data.imageId
        case types.CLEAR_ACTIVE_IMAGE:
            return initialState.activeImage
        default:
            return state
    }
}

function imageDatas(
    state: ImagesStoreState['imageDatas'] = initialState.imageDatas,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case types.ADD_IMAGE_DATA:
            return {
                ...state,
                [data.id]: data
            }
        case types.ADD_IMAGE_DATAS:
            const newState = Object.assign({}, state)
            data.imageDatas.forEach((imageData: ImageDataStore) => {
                newState[imageData.id] = imageData
            })
            return newState
        default:
            return state
    }
}

function imageList(
    state: ImagesStoreState['imageList'] = initialState.imageList,
    action: AnyAction
) {
    const { type, data } = action
    switch (type) {
        case types.SET_IMAGE_LIST:
            return data.imageList
        default:
            return state
    }
}

export default combineReducers({
    activeImage,
    imageDatas,
    imageList
})
