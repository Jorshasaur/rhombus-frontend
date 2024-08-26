import * as selectors from '../../../data/images/selectors'

const testState = {
    assets: {
        id1: {
            id: 'id1',
            fileName: 'fileName1',
            url: 'url1',
            createdAt: 'createdAt1'
        }
    },
    currentDocument: {
        members: [
            {
                userId: 0,
                name: 'name1'
            }
        ]
    },
    images: {
        activeImage: '',
        imageDatas: {},
        imageList: []
    }
}

const buildState = (updatedState: any = {}, originalState: any = testState) => {
    return Object.assign({}, originalState, updatedState)
}

const buildImages = (
    updatedImagesState: any = {},
    originalImagesState: any = testState.images,
    originalState: any = testState
) => {
    const updatedState = {
        images: Object.assign({}, originalImagesState, updatedImagesState)
    }
    return buildState(updatedState, originalState)
}

describe('images selectors', () => {
    describe('getActiveImageId', () => {
        it('gives id of active image', () => {
            const activeImage = 'activeImage'
            const state = buildImages({
                activeImage
            })
            const activeImageId = selectors.getActiveImageId(state)
            expect(activeImageId).toEqual(activeImage)
        })
    })

    describe('getActiveImageInfo', () => {
        it('gives info of active image with assetId', () => {
            const activeImage = 'activeImage'
            const imageDatas = {
                activeImage: {
                    id: 'activeImage',
                    assetId: testState.assets.id1.id,
                    authorId: '0'
                }
            }
            const state = buildImages({
                activeImage,
                imageDatas
            })
            const activeImageInfo = selectors.getActiveImageInfo(state)
            const expected = {
                author: testState.currentDocument.members[0].name,
                createdAt: testState.assets.id1.createdAt,
                fileName: testState.assets.id1.fileName
            }
            expect(activeImageInfo).toEqual(expected)
        })

        it('gives info of active image without assetId', () => {
            const activeImage = 'activeImage'
            const imageDatas = {
                activeImage: {
                    id: 'activeImage',
                    authorId: '0',
                    createdAt: testState.assets.id1.createdAt
                }
            }
            const state = buildImages({
                activeImage,
                imageDatas
            })
            const activeImageInfo = selectors.getActiveImageInfo(state)
            const expected = {
                author: testState.currentDocument.members[0].name,
                createdAt: testState.assets.id1.createdAt,
                fileName: 'Untitled'
            }
            expect(activeImageInfo).toEqual(expected)
        })

        it('gives has blank author when none found', () => {
            const activeImage = 'activeImage'
            const imageDatas = {
                activeImage: {
                    authorId: 10
                }
            }
            const state = buildImages({
                activeImage,
                imageDatas
            })
            const activeImageInfo = selectors.getActiveImageInfo(state)
            const expected = ''
            expect(activeImageInfo.author).toEqual(expected)
        })
    })

    describe('getImageCarousel', () => {
        it('gives image carousel', () => {
            const activeImage = 'activeImage'
            const imageDatas = {
                activeImage: {
                    url: 'url1',
                    width: 800,
                    height: 400
                },
                image2: {
                    url: 'url2',
                    width: 600,
                    height: 200
                },
                image3: {
                    url: 'url3',
                    width: 400,
                    height: 100
                }
            }
            const imageList = ['activeImage', 'image2', 'image3']
            const state = buildImages({
                activeImage,
                imageDatas,
                imageList
            })
            const carousel = selectors.getImageCarousel(state)
            const expected = {
                left: {
                    url: 'url3',
                    fileName: 'Untitled',
                    width: 400,
                    height: 100
                },
                middle: {
                    url: 'url1',
                    fileName: 'Untitled',
                    width: 800,
                    height: 400
                },
                right: {
                    url: 'url2',
                    fileName: 'Untitled',
                    width: 600,
                    height: 200
                }
            }
            expect(carousel).toEqual(expected)
        })

        it('gives image carousel when only two images', () => {
            const activeImage = 'activeImage'
            const imageDatas = {
                activeImage: {
                    url: 'url1',
                    width: 800,
                    height: 400
                },
                image2: {
                    url: 'url2',
                    width: 600,
                    height: 200
                }
            }
            const imageList = ['activeImage', 'image2']
            const state = buildImages({
                activeImage,
                imageDatas,
                imageList
            })
            const carousel = selectors.getImageCarousel(state)

            const expectedImage1 = {
                url: 'url1',
                fileName: 'Untitled',
                width: 800,
                height: 400
            }

            const expectedImage2 = {
                url: 'url2',
                fileName: 'Untitled',
                width: 600,
                height: 200
            }

            const expected = {
                left: expectedImage2,
                middle: expectedImage1,
                right: expectedImage2
            }
            expect(carousel).toEqual(expected)
        })

        it('gives image carousel when only one image', () => {
            const activeImage = 'activeImage'
            const imageDatas = {
                activeImage: {
                    url: 'url1',
                    width: 800,
                    height: 400
                }
            }
            const imageList = ['activeImage']
            const state = buildImages({
                activeImage,
                imageDatas,
                imageList
            })
            const carousel = selectors.getImageCarousel(state)
            const expectedImage = {
                url: 'url1',
                fileName: 'Untitled',
                width: 800,
                height: 400
            }
            const expected = {
                left: expectedImage,
                middle: expectedImage,
                right: expectedImage
            }
            expect(carousel).toEqual(expected)
        })
    })

    describe('getNextImageId', () => {
        it('gives next image', () => {
            const activeImage = 'activeImage'
            const imageList = ['activeImage', 'image2']
            const state = buildImages({
                activeImage,
                imageList
            })
            const nextImage = selectors.getNextImageId(state)
            const expected = imageList[1]
            expect(nextImage).toEqual(expected)
        })

        it('gives next image with wrap around', () => {
            const activeImage = 'activeImage'
            const imageList = ['image2', 'activeImage']
            const state = buildImages({
                activeImage,
                imageList
            })
            const nextImage = selectors.getNextImageId(state)
            const expected = imageList[0]
            expect(nextImage).toEqual(expected)
        })

        it('gives same image if just one', () => {
            const activeImage = 'activeImage'
            const imageList = ['activeImage']
            const state = buildImages({
                activeImage,
                imageList
            })
            const nextImage = selectors.getNextImageId(state)
            const expected = imageList[0]
            expect(nextImage).toEqual(expected)
        })
    })

    describe('getPreviousImageId', () => {
        it('gives previous image', () => {
            const activeImage = 'activeImage'
            const imageList = ['image2', 'activeImage']
            const state = buildImages({
                activeImage,
                imageList
            })
            const previousImage = selectors.getPreviousImageId(state)
            const expected = imageList[0]
            expect(previousImage).toEqual(expected)
        })

        it('gives previous image with wrap around', () => {
            const activeImage = 'activeImage'
            const imageList = ['activeImage', 'image2']
            const state = buildImages({
                activeImage,
                imageList
            })
            const previousImage = selectors.getPreviousImageId(state)
            const expected = imageList[1]
            expect(previousImage).toEqual(expected)
        })

        it('gives same image if just one', () => {
            const activeImage = 'activeImage'
            const imageList = ['activeImage']
            const state = buildImages({
                activeImage,
                imageList
            })
            const previousImage = selectors.getPreviousImageId(state)
            const expected = imageList[0]
            expect(previousImage).toEqual(expected)
        })
    })

    describe('isAssetIdInStore', () => {
        it('should say asset is in store', () => {
            const state = buildState()
            const isInStore = selectors.isAssetIdInStore(
                state,
                state.assets.id1.id
            )
            expect(isInStore).toBeTruthy()
        })

        it('should say asset is not in store', () => {
            const state = buildState()
            const isInStore = selectors.isAssetIdInStore(
                state,
                'someIdNotInTheStore'
            )
            expect(isInStore).toBeFalsy()
        })
    })
})
