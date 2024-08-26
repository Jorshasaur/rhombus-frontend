import Quill from 'quill/core'
const Parchment = Quill.import('parchment')

const Id = new Parchment.Attributor.Attribute('id', 'id', {
    scope: Parchment.Scope.BLOCK_ATTRIBUTE
})

export default Id
