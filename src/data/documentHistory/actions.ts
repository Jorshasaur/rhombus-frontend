import { types } from './types'

const showDocumentHistory = () => ({
    type: types.SHOW_DOCUMENT_HISTORY
})

const hideDocumentHistory = () => ({
    type: types.HIDE_DOCUMENT_HISTORY
})

export { showDocumentHistory, hideDocumentHistory }
