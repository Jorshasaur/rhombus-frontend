import { Dispatch, Action } from 'redux'
import { RootState } from '../reducers'
import { setPermissions, setCommentOnlyPermissions } from '../actions'
import * as selectors from './selectors'

const setDocumentPermissions = () => (
    dispatch: Dispatch<Action>,
    getState: () => RootState
) => {
    const documentPermissions = selectors.getDocumentPermissions(getState())
    if (documentPermissions != null) {
        dispatch(
            setPermissions(
                documentPermissions.canEdit,
                documentPermissions.canComment
            )
        )
    }
}

export default {
    setDocumentPermissions,
    setCommentOnlyPermissions
}
