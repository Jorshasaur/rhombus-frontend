import plusMenu from '../../data/reducers/plusMenu'
import { TypeKeys } from '../../data/ActionTypes'

describe('plus meun reducer', () => {
    it('should return the initial state', () => {
        expect(
            plusMenu(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual({ insertTop: 0, showPlusMenu: false })
    })

    it('should set the insertTop and show the menu on open plus menu', () => {
        expect(
            plusMenu(undefined, {
                type: TypeKeys.OPEN_PLUS_MENU,
                data: {
                    insertTop: 100
                }
            })
        ).toEqual({ insertTop: 100, showPlusMenu: true })
    })

    it('should reset to showPlusMenu false when the menu is closed', () => {
        const oldState = {
            insertTop: 50,
            showPlusMenu: true
        }
        expect(
            plusMenu(oldState, {
                type: TypeKeys.CLOSE_PLUS_MENU
            })
        ).toEqual({ insertTop: 50, showPlusMenu: false })
    })

    it('should override the state when opening the menu', () => {
        expect(
            plusMenu(
                { insertTop: 10, showPlusMenu: false },
                {
                    type: TypeKeys.OPEN_PLUS_MENU,
                    data: {
                        insertTop: 100
                    }
                }
            )
        ).toEqual({ insertTop: 100, showPlusMenu: true })
    })
})
