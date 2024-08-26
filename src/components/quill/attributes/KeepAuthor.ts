import Quill from 'quill/core'
const Parchment = Quill.import('parchment')

const config = {
    scope: Parchment.Scope.INLINE
}

export const KeepAuthorAttribute = new Parchment.Attributor.Class(
    'keepAuthor',
    'keep-author',
    config
)
