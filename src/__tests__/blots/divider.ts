import { Divider } from '../../components/quill/blots/Divider'

describe('Block embed blot', () => {
    it('should create a divider', () => {
        const newDivider = Divider.create(true)
        expect(newDivider.nodeName).toBe('HR')
        expect(newDivider.getAttribute('contenteditable')).toBe('false')
    })
})
