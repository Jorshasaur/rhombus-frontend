import banner, { BannerType, BannerColor } from '../../data/reducers/banner'
import { TypeKeys } from '../../data/ActionTypes'

describe('banner reducer', () => {
    it('should return the initial state', () => {
        expect(
            banner(undefined, {
                type: 'NO_ACTION'
            })
        ).toEqual({})
    })

    it('should show banner', () => {
        const data = {
            type: BannerType.RESET_DOC,
            color: 'red'
        }

        expect(
            banner(undefined, {
                type: TypeKeys.SHOW_BANNER,
                data
            })
        ).toEqual(data)
    })

    it('should not transition from RESET_DOC to another banner state', () => {
        const initial = {
            type: BannerType.RESET_DOC,
            color: BannerColor.DANGER
        }
        const data = {
            type: BannerType.CONNECTION_LOST_WARN,
            color: BannerColor.WARNING
        }

        expect(
            banner(initial, {
                type: TypeKeys.SHOW_BANNER,
                data
            })
        ).toEqual(initial)
    })

    it('should hide banner', () => {
        expect(
            banner(undefined, {
                type: TypeKeys.HIDE_BANNER,
                data: {}
            })
        ).toEqual({})
    })
})
