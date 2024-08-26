import title from '../../data/reducers/title'
import { TypeKeys } from '../../data/ActionTypes'

describe('title reducer', () => {
    it('should return the initial state', () => {
        expect(
            title(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual('')
    })

    it('should set a title', () => {
        expect(
            title(undefined, {
                type: TypeKeys.SET_TITLE,
                data: {
                    title: 'New Title'
                }
            })
        ).toEqual('New Title')
    })

    it('should set a title from document', () => {
        expect(
            title(undefined, {
                type: TypeKeys.SET_CURRENT_DOCUMENT,
                data: {
                    document: {
                        title: 'New Title'
                    }
                }
            })
        ).toEqual('New Title')
    })
})
