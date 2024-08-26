import quillProvider from '../../components/quill/provider'
import { members } from '../mockData/members'
import store from '../../data/store'
import insertMention from '../../components/quill/utils/insertMention'

const Quill: any = jest.genMockFromModule('quill/core')
beforeEach(() => {
    store.dispatch = jest.fn()
    Quill.deleteText = jest.fn()
    Quill.insertEmbed = jest.fn()
    Quill.focus = jest.fn()
    Quill.setSelection = jest.fn()
    quillProvider.setQuill(Quill)
})
describe('insertMention', () => {
    it('should insert a document mention', () => {
        const quillInstance = quillProvider.getQuill()
        const initialIndex = 1
        const currentIndex = 5
        const documentType = 'document-mention'
        const value = ''
        insertMention(Quill, initialIndex, currentIndex, documentType, value)
        expect(quillInstance.deleteText).toBeCalledWith(
            initialIndex,
            currentIndex - initialIndex,
            'user'
        )
        expect(quillInstance.insertEmbed).toBeCalledWith(
            initialIndex,
            documentType,
            value,
            'user'
        )
        expect(quillInstance.focus).toBeCalled()
        expect(quillInstance.setSelection).toBeCalledWith(
            initialIndex + 1,
            'silent'
        )
        expect(store.dispatch).toBeCalledWith({ type: 'CLEAR_MENTION_LIST' })
    })
    it('should insert a user mention', () => {
        const quillInstance = quillProvider.getQuill()
        const initialIndex = 1
        const currentIndex = 5
        const documentType = 'mention'
        const value = members[0]
        insertMention(Quill, initialIndex, currentIndex, documentType, value)
        expect(quillInstance.deleteText).toBeCalledWith(
            initialIndex,
            currentIndex - initialIndex,
            'user'
        )
        expect(quillInstance.insertEmbed).toBeCalledWith(
            initialIndex,
            documentType,
            value,
            'user'
        )
        expect(quillInstance.focus).toBeCalled()
        expect(quillInstance.setSelection).toBeCalledWith(
            initialIndex + 1,
            'silent'
        )
        expect(store.dispatch).toBeCalledWith({ type: 'CLEAR_MENTION_LIST' })
    })
})
