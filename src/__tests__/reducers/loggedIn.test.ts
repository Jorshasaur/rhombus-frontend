import loggedIn from '../../data/reducers/loggedIn'
import { TypeKeys } from '../../data/ActionTypes'

describe('loggedIn reducer', () => {
    it('should return the initial state', () => {
        expect(
            loggedIn(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(true)
    })
    it('should set the user as logged out', () => {
        expect(
            loggedIn(undefined, {
                type: TypeKeys.USER_LOGGED_OUT
            })
        ).toEqual(false)
    })
    it('should set the user as logged in', () => {
        expect(
            loggedIn(undefined, {
                type: TypeKeys.USER_LOGGED_IN
            })
        ).toEqual(true)
    })
})
