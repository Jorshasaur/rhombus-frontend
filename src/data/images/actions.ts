import { types } from './types'
import { ImageDataStore } from './interfaces'

const addImageData = (imageData: ImageDataStore) => ({
    type: types.ADD_IMAGE_DATA,
    data: {
        ...imageData
    }
})

const addImageDatas = (imageDatas: ImageDataStore[]) => ({
    type: types.ADD_IMAGE_DATAS,
    data: {
        imageDatas
    }
})

const clearActiveImage = () => ({
    type: types.CLEAR_ACTIVE_IMAGE
})

const newActiveImage = (imageId: string) => ({
    type: types.NEW_ACTIVE_IMAGE,
    data: {
        imageId
    }
})

const setImageList = (imageList: string[]) => ({
    type: types.SET_IMAGE_LIST,
    data: {
        imageList
    }
})

export {
    addImageData,
    addImageDatas,
    clearActiveImage,
    newActiveImage,
    setImageList
}
