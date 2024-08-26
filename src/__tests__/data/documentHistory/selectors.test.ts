import { getDocumentHistoryDisplayState } from '../../../data/documentHistory/selectors'
import { RootState } from '../../../data/reducers'

describe('documentHistory Selectors', () => {
    it('gets the document history display state', () => {
        const state = {
            documentHistory: {
                showDocumentHistory: true
            }
        } as RootState

        const displayState = getDocumentHistoryDisplayState(state)

        expect(displayState).toEqual(state.documentHistory.showDocumentHistory)
    })
})
