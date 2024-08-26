import React from 'react'
import { CreateFreehandModal } from '../CreateFreehandModal'
import { render, fireEvent, screen, waitFor } from '@@testing-library'
import PagesApiService from '../../../../../../data/services/PagesApiService'
import { TEST_FREEHANDS } from './fixtures'

window.INVISION_ENV = {
    BASE_URL: 'http://test'
}

jest.spyOn(PagesApiService, 'getFreehands').mockResolvedValue({
    success: true,
    freehands: TEST_FREEHANDS
})

const createComponent = (props: any = {}) => {
    const baseProps = {
        isShown: true,
        embedType: 'freehand',
        onAddAndClose: jest.fn(),
        onClose: jest.fn()
    }

    return render(<CreateFreehandModal {...baseProps} {...props} />)
}

describe('<CreateFreehandModal />', () => {
    beforeAll(() => {
        const nav = document.createElement('div')
        nav.id = 'global-navigation'
        document.body.appendChild(nav)
    })

    it('renders', async () => {
        createComponent()

        await waitFor(() => {
            expect(screen.queryByTestId('create-freehand-modal')).toBeTruthy()
            expect(
                screen.queryByTestId('create-freehand-modal__input')
            ).toBeTruthy()
        })
    })

    it('sends a URL back to the caller when it closes', async () => {
        const onAddAndClose = jest.fn()
        createComponent({ onAddAndClose })
        const expected = TEST_FREEHANDS[0]

        const input = screen.getByTestId('create-freehand-modal__input')
        fireEvent.change(input, {
            target: {
                value: expected.name
            }
        })
        const suggestion = await screen.findByAltText(/test freehand/)
        fireEvent.click(suggestion)

        await waitFor(() => {
            expect(onAddAndClose).toHaveBeenCalledWith(
                'http://test' + expected.path
            )
        })
    })
})
