import Quill from '../../quill/entries/Editor'
import { Permissions as PermissionsInterface } from '../../../interfaces/permissions'
import { PERMISSIONS_MODULE_NAME } from '../../../constants/quill-modules'
import quillProvider from '../provider'

interface PermissionsModuleOptions extends PermissionsInterface {
    isArchived: boolean
}

export default class Permissions {
    canEdit: boolean
    canComment: boolean
    isArchived: boolean

    constructor(quill: Quill, options: PermissionsModuleOptions) {
        this.canEdit = options.canEdit
        this.canComment = options.canComment
        this.isArchived = options.isArchived
        updateQuillPermissions(options)
    }

    public updateModulePermissions(permissions: PermissionsModuleOptions) {
        this.canEdit = permissions.canEdit
        this.canComment = permissions.canComment
        this.isArchived = permissions.isArchived
    }
}

export function updateQuillPermissions(permissions: PermissionsModuleOptions) {
    const { canEdit, canComment, isArchived } = permissions
    const quill = quillProvider.getQuill()

    if (!quill) {
        return
    }

    const permissionsModule = quill.getModule(PERMISSIONS_MODULE_NAME)
    permissionsModule.updateModulePermissions(permissions)

    if (canEdit && !isArchived) {
        enableEditMode(quill)
    } else if (canComment && !isArchived) {
        enableCommentMode(quill)
    } else if (isArchived) {
        disableEditor(quill)
    }
}

function enableEditMode(quill: Quill) {
    quill.enable()
    quill.root.setAttribute('contenteditable', 'true')
}

function enableCommentMode(quill: Quill) {
    quill.enable()
    quill.root.setAttribute('contenteditable', 'false')
}

function disableEditor(quill: Quill) {
    quill.disable()
    quill.root.setAttribute('contenteditable', 'false')
}
