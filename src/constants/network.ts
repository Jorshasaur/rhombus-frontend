export const SOCKET = {
    connect: 'connect',
    disconnect: 'disconnect',
    update: 'update',
    operation: 'operation',
    cursor: 'cursor',
    commentsUpdated: 'comments-updated',
    documentArchived: 'document-archived',
    documentUnarchived: 'document-unarchived',
    subscribedToDocument: 'subscribed-to-document',
    documentPermissionsChanged: 'document-permissions-changed',
    freehandDocumentUpdated: 'freehand-document-updated'
}

export const KEEP_ALIVE_REQUEST_INTERVAL = 10000 // 10s

export const AXIOS_RETRY = 3

export const UNSAFE_URL_CHARACTERS = '"<>#%{}|\\^~[]`'
