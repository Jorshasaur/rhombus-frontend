import { RootState } from '../reducers'
import { findIndex, find } from 'lodash'
import { AssetsState } from '../reducers/assets'
import { Member } from '../../interfaces/member'
import {
    ImageCarouselData,
    ActiveImageInfo,
    ImagesStoreState,
    ImageCarouselImage
} from './interfaces'

function _getActiveImageIndex(activeImage: string, imageList: string[]) {
    return findIndex(imageList, (imageId: string) => {
        return imageId === activeImage
    })
}

function _getImageCarouselImage(
    imageId: string,
    imageDatas: ImagesStoreState['imageDatas'],
    assets: AssetsState,
    members: Member[]
): ImageCarouselImage {
    const imageData = _getImageData(imageId, imageDatas, assets, members)
    return {
        url: imageData.url || '',
        fileName: imageData.fileName,
        width: imageData.width,
        height: imageData.height
    }
}

function _getAuthor(authorId: string, members: Member[]) {
    const author = find(members, (member: Member) => {
        return member.userId === parseInt(authorId, 10)
    })
    if (author) {
        return author.name
    }
    return ''
}

function _getImageData(
    imageId: string,
    imageDatas: ImagesStoreState['imageDatas'],
    assets: AssetsState,
    members: Member[]
): ActiveImageInfo {
    const data = imageDatas[imageId]
    if (data.assetId) {
        const asset = assets[data.assetId]
        return {
            url: asset.url,
            fileName: asset.fileName,
            createdAt: asset.createdAt,
            width: data.width,
            height: data.height,
            author: _getAuthor(data.authorId, members)
        }
    }
    return {
        url: data.url,
        fileName: 'Untitled',
        createdAt: data.createdAt,
        width: data.width,
        height: data.height,
        author: _getAuthor(data.authorId, members)
    }
}

function getActiveImageId(state: RootState) {
    return state.images.activeImage
}

function getActiveImageInfo(state: RootState): ActiveImageInfo {
    const data = _getImageData(
        getActiveImageId(state),
        state.images.imageDatas,
        state.assets,
        state.currentDocument.members
    )
    return {
        fileName: data.fileName,
        createdAt: data.createdAt,
        author: data.author
    }
}

function getImageCarousel(state: RootState): ImageCarouselData {
    return {
        left: _getImageCarouselImage(
            getPreviousImageId(state),
            state.images.imageDatas,
            state.assets,
            state.currentDocument.members
        ),
        middle: _getImageCarouselImage(
            getActiveImageId(state),
            state.images.imageDatas,
            state.assets,
            state.currentDocument.members
        ),
        right: _getImageCarouselImage(
            getNextImageId(state),
            state.images.imageDatas,
            state.assets,
            state.currentDocument.members
        )
    }
}

function getNextImageId(state: RootState) {
    const { activeImage, imageList } = state.images
    const ind = _getActiveImageIndex(activeImage, imageList)
    if (ind < 0) {
        return ''
    }
    if (ind + 1 === imageList.length) {
        return imageList[0]
    }
    return imageList[ind + 1]
}

function getPreviousImageId(state: RootState) {
    const { activeImage, imageList } = state.images
    const ind = _getActiveImageIndex(activeImage, imageList)
    if (ind < 0) {
        return ''
    }
    if (ind === 0) {
        return imageList[imageList.length - 1]
    }
    return imageList[ind - 1]
}

function isAssetIdInStore(state: RootState, assetId: string) {
    return Boolean(state.assets[assetId])
}

export {
    getActiveImageId,
    getActiveImageInfo,
    getImageCarousel,
    getNextImageId,
    getPreviousImageId,
    isAssetIdInStore
}
