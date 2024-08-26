import PagesApiService from '../../../../../../data/services/PagesApiService'
import { useCallback } from 'react'

export function useCreateFreehandHandler(
    name: string,
    onSuccess: (path: string) => void,
    onError: (error: string) => void
) {
    return useCallback(
        () =>
            PagesApiService.createFreehand(name).then((res) => {
                if (!res.success) {
                    onError(res.error)
                    return
                }

                onSuccess(res.freehand.path + '?createdInRhombus=true')
            }),
        [name, onError, onSuccess]
    )
}
