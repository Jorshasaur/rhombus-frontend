import EmbedContainer from '../../components/pages/Editor/Blots/EmbedContainer'
import { BlotSize } from '../../interfaces/blotSize'
import { subscribe } from '../../data/store'
jest.mock('../../data/store', () => {
    return {
        subscribe: jest.fn(),
        getState: jest.fn(() => ({
            permissions: {
                canEdit: true
            }
        }))
    }
})
describe('EmbedContainer', () => {
    it('should call receivedNewState when it receives new state', () => {
        EmbedContainer.prototype.receivedNewState = jest.fn()
        const container = new EmbedContainer()

        expect(EmbedContainer.prototype.receivedNewState).toBeCalled()

        container.setState({ size: 'test' })

        expect(EmbedContainer.prototype.receivedNewState).toBeCalledTimes(3)
    })

    it('should subscribe to permissions changes', () => {
        new EmbedContainer()
        expect(subscribe).toHaveBeenNthCalledWith(
            1,
            'permissions',
            expect.any(Function)
        )
    })

    it('should subscribe to comments.selectedCommentMarkId changes', () => {
        new EmbedContainer()
        expect(subscribe).toHaveBeenNthCalledWith(
            2,
            'comments.selectedCommentMarkId',
            expect.any(Function)
        )
    })

    it('should subscribe to comment threads changes', () => {
        new EmbedContainer()
        expect(subscribe).toHaveBeenNthCalledWith(
            3,
            'comments.threads',
            expect.any(Function)
        )
    })

    it('should set hasOpenThread to true if the blot is large and the selected thread is a thread on the blot', () => {
        EmbedContainer.prototype.setState = jest.fn()
        const container = new EmbedContainer()
        container.checkForLargeResize('123', ['222', '123'], BlotSize.Large)
        expect(EmbedContainer.prototype.setState).toHaveBeenCalledWith({
            hasOpenThread: true
        })
    })

    it('should set hasOpenThread to false if the blot isnt large or the selected thread isnt a thread on the blot', () => {
        EmbedContainer.prototype.setState = jest.fn()
        const container = new EmbedContainer()
        container.checkForLargeResize('123', ['222'], BlotSize.Large)
        expect(EmbedContainer.prototype.setState).toHaveBeenCalledWith({
            hasOpenThread: false
        })
        container.checkForLargeResize('123', ['222'], BlotSize.Small)
        expect(EmbedContainer.prototype.setState).toHaveBeenCalledWith({
            hasOpenThread: false
        })
    })

    it('should set hasOpenThread to false if the blot has no threads', () => {
        EmbedContainer.prototype.setState = jest.fn()
        const container = new EmbedContainer()
        container.checkForLargeResize('123', undefined, BlotSize.Large)
        expect(EmbedContainer.prototype.setState).toHaveBeenCalledWith({
            hasOpenThread: false
        })
    })

    it('should setDataAttribute', () => {
        EmbedContainer.prototype.setState = jest.fn()
        const setQuillBlockEmbedProps = jest.spyOn(
            EmbedContainer.prototype,
            'setQuillBlockEmbedProps'
        )

        const div = document.createElement('div')

        const container = new EmbedContainer()
        container.quillBlotElement = div

        const size = 'small'

        container.setDataAttribute('size', size)

        expect(EmbedContainer.prototype.setState).toBeCalledWith({
            size
        })
        expect(setQuillBlockEmbedProps).toBeCalled()
        expect(div.getAttribute('data-size')).toEqual(size)
    })

    it('should setEmbedData', () => {
        EmbedContainer.prototype.setState = jest.fn()
        const setQuillBlockEmbedProps = jest
            .spyOn(EmbedContainer.prototype, 'setQuillBlockEmbedProps')
            .mockImplementationOnce(jest.fn())

        const container = new EmbedContainer()
        container.resetEmbedData({ id: '1' })

        expect(EmbedContainer.prototype.setState).toBeCalledWith({
            embedData: { id: '1' }
        })
        expect(setQuillBlockEmbedProps).toBeCalled()
    })

    it('should setEmbedDataValue', () => {
        const resetEmbedData = jest
            .spyOn(EmbedContainer.prototype, 'resetEmbedData')
            .mockImplementation(jest.fn())

        const url = 'http://test'
        const id = '1'
        const width = 100
        const height = 100
        const initialState: any = {
            embedData: {
                url
            }
        }
        const container = new EmbedContainer(initialState)
        container.setEmbedDataValue('id', id)

        expect(resetEmbedData).toBeCalledWith({ id, url })

        resetEmbedData.mockClear()
        container.setEmbedDataValue({ width, height })

        expect(resetEmbedData).toBeCalledWith({ url, width, height })
    })

    it('should setQuillBlockEmbedProps', () => {
        const div = document.createElement('div')

        const embedData = {
            embedData: {
                id: '123'
            },
            originalLink: 'http://test',
            type: 'test',
            uuid: '1',
            service: 'image',
            version: 1,
            authorId: '1',
            createdAt: new Date().toString(),
            size: BlotSize.Small,
            randomProp: 'aaa',
            hasOpenThread: false
        }

        const container = new EmbedContainer(embedData)
        container.quillBlotElement = div

        container.setQuillBlockEmbedProps()

        expect(div.getAttribute('data-props')).toEqual(
            JSON.stringify({
                version: 1,
                originalLink: 'http://test',
                type: 'test',
                service: 'image',
                uuid: '1',
                authorId: '1',
                embedData: { id: '123' },
                createdAt: embedData.createdAt,
                size: 'small'
            })
        )
    })
})
