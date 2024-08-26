import React from 'react'
import { shallow } from 'enzyme'
import PlusButton from '../../components/pages/Editor/PlusMenu/PlusButton'
import { RootState } from '../../data/reducers'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'

jest.mock('../../data/store', () => {
    return {
        getState(): Partial<RootState> {
            return {
                user: {
                    userId: 1,
                    teamId: '2',
                    email: 'foo@bar.com'
                } as RootState['user'],
                currentDocument: {
                    id: '1'
                } as RootState['currentDocument'],
                plusMenu: {
                    showPlusMenu: true,
                    insertTop: 0
                }
            }
        }
    }
})

const defaultProps = {
    dragging: false,
    onClick: () => {
        return
    }
}

AnalyticsBuilder.prototype.track = jest.fn()

describe('PlusButton', () => {
    it('should be an instance of PlusButton', () => {
        const wrapper = shallow(<PlusButton {...defaultProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(PlusButton)
    })

    it('should render PlusButton', () => {
        const wrapper = shallow(<PlusButton {...defaultProps} />)
        expect(wrapper.children()).toHaveLength(1)
    })

    it('should fire analytics when the plus button is clicked', () => {
        const stopPropagation = jest.fn()
        const onClick = jest.fn()
        const wrapper = shallow(
            <PlusButton {...defaultProps} onClick={onClick} />
        )
        wrapper.find('.plusButton').simulate('click', {
            stopPropagation
        })
        expect(stopPropagation).toHaveBeenCalled()
        expect(AnalyticsBuilder.prototype.track).toHaveBeenCalled()
        expect(onClick).toHaveBeenCalled()
    })
})
