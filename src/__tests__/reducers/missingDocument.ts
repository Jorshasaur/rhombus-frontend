import missingDocument from '../../data/reducers/missingDocument'
import { TypeKeys } from '../../data/ActionTypes'

describe('missingDocument reducer', () => {
    it('should return the initial state', () => {
        expect(
            missingDocument(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(false)
    })

    it('should set missing document', () => {
        expect(
            missingDocument(undefined, {
                type: TypeKeys.SET_MISSING_DOCUMENT
            })
        ).toEqual(true)
    })
})
