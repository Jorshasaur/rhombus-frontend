export interface FreehandMetaData {
    success: true
    name: string | null
    updatedAt: string | null
    id: string
    assets?: {
        [uuid: string]: string
    }
}

export interface FreehandContent {
    content: ArrayBuffer | null
}

export type FreehandSuccess = FreehandMetaData & FreehandContent

export interface FreehandAccessError {
    success: false
    error: string
}

export interface FreehandNotFound extends FreehandMetaData {
    success: true
    content: null
    id: ''
}

export type FreehandResponse =
    | FreehandSuccess
    | FreehandAccessError
    | FreehandNotFound

export interface FreehandDocumentSuccess {
    slug: string
    name: string
    path: string
    thumbnailUrl: string | null
    createdAt: string
    updatedAt: string
}

export interface FreehandsSuccess {
    success: true
    freehands: FreehandDocumentSuccess[]
}

export type FreehandsResponse = FreehandsSuccess | FreehandAccessError

interface CreateFreehandSuccess {
    success: true
    freehand: FreehandDocumentSuccess
}
export type CreateFreehandResponse = CreateFreehandSuccess | FreehandAccessError
