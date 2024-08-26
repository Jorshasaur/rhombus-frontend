import * as actions from './actions'
import * as selectors from './selectors'
import { Dispatch, Action } from 'redux'
import { RootState } from '../reducers'
import {
    getImageIdsInDocument,
    getImageData
} from '../../quillData/ImageSelectors'
import { ImageDataStore } from './interfaces'

const addImageData = actions.addImageData

const addImageDatas = actions.addImageDatas

const clearActiveImage = actions.clearActiveImage

const newActiveImage = actions.newActiveImage

const expandImage = (imageId: string) => (
    dispatch: Dispatch<Action>,
    getState: () => RootState
) => {
    const imageList = getImageIdsInDocument()
    const imageDatas = imageList
        .map((id: string) => {
            const imageData = getImageData(id)
            if (imageData) {
                if (
                    imageData.assetId &&
                    !selectors.isAssetIdInStore(getState(), imageData.assetId)
                ) {
                    delete imageData.assetId
                }
            }
            return imageData
        })
        .filter((imageData: ImageDataStore | null) => {
            return imageData
        }) as ImageDataStore[]

    dispatch(actions.addImageDatas(imageDatas))
    dispatch(actions.setImageList(imageList))

    if (imageList.indexOf(imageId) !== -1) {
        dispatch(actions.newActiveImage(imageId))
    }
}

const nextImage = () => (
    dispatch: Dispatch<Action>,
    getState: () => RootState
) => {
    dispatch(actions.newActiveImage(selectors.getNextImageId(getState())))
}

const previousImage = () => (
    dispatch: Dispatch<Action>,
    getState: () => RootState
) => {
    dispatch(actions.newActiveImage(selectors.getPreviousImageId(getState())))
}

const setImageList = actions.setImageList

export {
    addImageData,
    addImageDatas,
    clearActiveImage,
    expandImage,
    newActiveImage,
    nextImage,
    previousImage,
    setImageList
}
