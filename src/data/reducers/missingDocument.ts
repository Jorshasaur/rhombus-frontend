import { AnyAction } from 'redux'
import { TypeKeys } from '../ActionTypes'

export default function missingDocumentReducer(
    state: boolean = false,
    action: AnyAction
) {
    const { type } = action
    switch (type) {
        case TypeKeys.SET_MISSING_DOCUMENT:
            return true
        default:
            return state
    }
}
