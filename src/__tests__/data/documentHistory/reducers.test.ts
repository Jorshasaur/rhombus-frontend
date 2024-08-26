import * as actions from '../../../data/documentHistory/actions'
import { DocumentHistoryState } from '../../../data/documentHistory/interfaces'
import reducer from '../../../data/documentHistory/reducers'

describe('document history reducers', () => {
    it('updates the show document history state', () => {
        const showAction = actions.showDocumentHistory()
        const showHistoryState = reducer(
            {
                showDocumentHistory: false
            },
            showAction
        )
        expect(showHistoryState.showDocumentHistory).toEqual(true)
        const hideAction = actions.hideDocumentHistory()
        const hideHistoryState = reducer(showHistoryState, hideAction)
        expect(hideHistoryState.showDocumentHistory).toEqual(false)
    })
    it('uses the default state', () => {
        const initialState = ({
            showDocumentHistory: 'banana'
        } as unknown) as DocumentHistoryState
        const defaultState = reducer(initialState, { type: 'NO' })
        expect(defaultState).toEqual(initialState)
    })
})
