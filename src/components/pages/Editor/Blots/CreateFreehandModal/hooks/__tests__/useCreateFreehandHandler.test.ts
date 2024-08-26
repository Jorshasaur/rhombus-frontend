import { TEST_FREEHANDS } from '../../_tests_/fixtures'
import PagesApiService from 'data/services/PagesApiService'
import { useCreateFreehandHandler } from '../useCreateFreehandHandler'
import React from 'react'
import { identity } from 'lodash'

React.useCallback = jest.fn(identity)

const name = 'q1 planning'

describe('useCreateFreehandHandler', () => {
    it('calls onSuccess when freehands load successfully', async () => {
        jest.spyOn(PagesApiService, 'createFreehand').mockResolvedValue({
            success: true,
            freehand: TEST_FREEHANDS[1]
        })

        const onSuccess = jest.fn()
        const onError = jest.fn()

        const handler = useCreateFreehandHandler(name, onSuccess, onError)
        await handler()

        expect(onSuccess).toHaveBeenCalledTimes(1)
        expect(onError).not.toHaveBeenCalled()
    })

    it('calls onError when there is an error', async () => {
        jest.spyOn(PagesApiService, 'createFreehand').mockResolvedValue({
            success: false,
            error: 'an error occurred'
        })

        const onSuccess = jest.fn()
        const onError = jest.fn()

        const handler = useCreateFreehandHandler(name, onSuccess, onError)
        await handler()

        expect(onSuccess).not.toHaveBeenCalled()
        expect(onError).toHaveBeenCalledTimes(1)
    })
})
