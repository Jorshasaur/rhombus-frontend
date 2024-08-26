import Permissions from '../../components/quill/modules/Permissions'
import quillProvider from '../../components/quill/provider'

const Quill: any = jest.genMockFromModule('quill/core')

beforeEach(() => {
    Quill.enable = jest.fn()
    Quill.disable = jest.fn()
    Quill.root = document.createElement('div')
    Quill.getModule = jest.fn(() => {
        return {
            updateModulePermissions: jest.fn()
        }
    })
    quillProvider.setQuill(Quill)
})

describe('Permissions module', () => {
    it('should set permissions on the module', () => {
        const root = quillProvider.getQuill().root
        const canEdit = true
        const canComment = false
        const isArchived = false
        const newPermissionsModule = new Permissions(
            {
                ...Quill,
                root
            },
            {
                canEdit,
                canComment,
                isArchived
            }
        )
        expect(newPermissionsModule.canEdit).toBe(canEdit)
        expect(newPermissionsModule.canComment).toBe(canComment)
        expect(newPermissionsModule.isArchived).toBe(isArchived)
    })
    it('should allow editing a document', () => {
        const root = quillProvider.getQuill().root
        new Permissions(
            {
                ...Quill,
                root
            },
            {
                canEdit: true,
                canComment: false,
                isArchived: false
            }
        )
        const contentEditable = root.getAttribute('contenteditable')
        expect(contentEditable).toBe('true')
    })
    it('should block editing a document when canEdit permissions are false', () => {
        const root = quillProvider.getQuill().root
        new Permissions(
            {
                ...Quill,
                root
            },
            {
                canEdit: false,
                canComment: true,
                isArchived: false
            }
        )
        const contentEditable = root.getAttribute('contenteditable')
        expect(contentEditable).toBe('false')
    })
    it('should block editing a document when the document is archived', () => {
        const root = quillProvider.getQuill().root
        new Permissions(
            {
                ...Quill,
                root
            },
            {
                canEdit: true,
                canComment: false,
                isArchived: true
            }
        )
        const contentEditable = root.getAttribute('contenteditable')
        expect(contentEditable).toBe('false')
    })
})
