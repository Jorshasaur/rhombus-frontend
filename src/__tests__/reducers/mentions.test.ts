import mentions, { initialState } from '../../data/reducers/mentions'
import { TypeKeys } from '../../data/ActionTypes'
import { members } from '../mockData/members'

describe('Members reducer', () => {
    it('should return the initial state', () => {
        expect(
            mentions(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual(initialState)
    })
    it('should set a documents members', () => {
        expect(
            mentions(undefined, {
                type: TypeKeys.SET_MENTION_MEMBERS,
                data: {
                    members
                }
            })
        ).toEqual({
            ...initialState,
            members
        })
    })
    it('should clear the state', () => {
        mentions(undefined, {
            type: TypeKeys.SET_MENTION_MEMBERS,
            data: {
                members
            }
        })
        expect(
            mentions(undefined, {
                type: TypeKeys.CLEAR_MENTION_LIST,
                data: {}
            })
        ).toEqual({
            ...initialState
        })
    })
    it('should set the selected members index', () => {
        const selectedMemberIndex = 1
        expect(
            mentions(undefined, {
                type: TypeKeys.SET_SELECTED_MEMBER_INDEX,
                data: {
                    selectedMemberIndex
                }
            })
        ).toEqual({
            ...initialState,
            selectedMemberIndex
        })
    })
})
