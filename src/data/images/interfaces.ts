export interface ActiveImageInfo {
    fileName: string
    author: string
    createdAt?: string
    url?: string
    width?: number
    height?: number
}

export interface ImageCarouselImage {
    url: string
    fileName: string
    width?: number
    height?: number
}

export interface ImageCarouselData {
    left: ImageCarouselImage
    middle: ImageCarouselImage
    right: ImageCarouselImage
}

export interface ImageDataStore {
    id: string
    assetId?: string
    authorId: string
    url: string
    createdAt?: string
    width?: number
    height?: number
}

export interface ImagesStoreState {
    activeImage: string
    imageDatas: { [imageId: string]: ImageDataStore }
    imageList: string[]
}
