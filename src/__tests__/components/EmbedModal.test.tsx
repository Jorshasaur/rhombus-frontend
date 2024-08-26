import { EmbedModal } from '../../components/pages/Editor/Blots/EmbedModal'

const props = {
    children: 'test',
    actionArea: 'very action area',
    onHide: jest.fn()
}

describe('<EmbedModal />', () => {
    afterEach(() => {
        EmbedModal.unmount()
    })

    it('renders children when it is shown', () => {
        EmbedModal.mount()
        EmbedModal.show(props)

        expect(document.querySelector('.bodyVisible')!.textContent).toBe('test')
    })

    it('does not render children when it is not shown', () => {
        EmbedModal.mount()

        expect(document.querySelector('.body')!.children).toHaveLength(0)
    })

    it('triggers an onHide callback when the Close button is clicked', () => {
        EmbedModal.mount()
        EmbedModal.show(props)

        document
            .querySelector<HTMLAnchorElement>(
                testid('embed-modal__close-button')
            )!
            .click()

        expect(props.onHide).toHaveBeenCalled()
    })
})
