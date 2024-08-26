import featureFlags, { initialState } from '../../data/reducers/featureFlags'
import { TypeKeys } from '../../data/ActionTypes'

describe('featureFlags reducer', () => {
    it('should return the initial state', () => {
        expect(
            featureFlags(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })

    it('should show banner', () => {
        const data = {
            documentSubscription: true
        }

        expect(
            featureFlags(undefined, {
                type: TypeKeys.SET_FEATURE_FLAGS,
                data
            })
        ).toEqual(data)
    })
})
