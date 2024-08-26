import { ProjectsList } from '../ProjectsList'
import { screen, render, waitFor } from '@@testing-library'
import React from 'react'
import { TEST_FREEHANDS } from './fixtures'

const createComponent = (props: any = {}) => {
    const baseProps = {
        projects: TEST_FREEHANDS,
        selectedProject: 1,
        filter: 'q1',
        onAdd: jest.fn(),
        onCreateNew: jest.fn()
    }

    return render(<ProjectsList {...baseProps} {...props} />)
}

describe('<ProjectsList />', () => {
    it('renders', async () => {
        createComponent()

        await waitFor(() => {
            expect(screen.queryByAltText('q1 planning thumbnail')).toBeTruthy()
        })
    })
})
