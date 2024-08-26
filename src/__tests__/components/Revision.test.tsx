import { mount } from 'enzyme'
import React from 'react'
import { act } from 'react-dom/test-utils'
import {
    DATE_STRING_FORMAT_OPTIONS,
    TIME_STRING_FORMAT_OPTIONS,
    Revision
} from '../../components/pages/Editor/DocumentHistory/Revision/Revision'
import { Member } from '../../interfaces/member'

const props = {
    id: 'ec8054b7-8783-4d5e-83ff-cb91bdc1fcfc',
    users: [1, 2, 3],
    date: new Date('2015-03-25T12:00:00Z'),
    onClick: jest.fn(),
    members: ([
        {
            id: 1,
            userId: 1,
            name: 'Gandalf'
        },
        {
            id: 2,
            userId: 2,
            name: 'Frodo'
        },
        {
            id: 3,
            userId: 3,
            name: 'Boromir'
        }
    ] as unknown) as Member[],
    isActive: true,
    documentOwnerId: 1,
    isCurrent: false
}

jest.mock('@invisionapp/helios', () => {
    return {
        Text: ({ children }) => <p className="revision-text">{children}</p>
    }
})

describe('History', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should render the component and display the revision with the correct date and authors', async () => {
        let wrapper
        act(() => {
            wrapper = mount(<Revision {...props} />)
        })
        wrapper.update()
        expect(
            wrapper
                .find('.revision-text')
                .at(0)
                .text()
        ).toEqual(
            props.date.toLocaleDateString('en-US', DATE_STRING_FORMAT_OPTIONS)
        )
        expect(
            wrapper
                .find('.revision-text')
                .at(1)
                .text()
        ).toEqual(
            props.date.toLocaleTimeString('en-US', TIME_STRING_FORMAT_OPTIONS)
        )
        expect(
            wrapper
                .find('.revision-text')
                .at(2)
                .text()
        ).toEqual(
            `By ${props.members[0].name}, ${props.members[1].name}, ${props.members[2].name}`
        )
    })
    it('should display the document owner as the author if the supplied user is null', async () => {
        let wrapper
        const nullUserProps = {
            ...props,
            users: [null]
        }
        act(() => {
            wrapper = mount(<Revision {...nullUserProps} />)
        })
        wrapper.update()
        expect(
            wrapper
                .find('.revision-text')
                .at(2)
                .text()
        ).toEqual(`By ${props.members[0].name}`)
    })
    it('should mark the first revision as current', async () => {
        let wrapper
        const nullUserProps = {
            ...props,
            users: [null],
            isCurrent: true
        }
        act(() => {
            wrapper = mount(<Revision {...nullUserProps} />)
        })
        wrapper.update()
        expect(
            wrapper
                .find('.revision-text')
                .at(0)
                .text()
        ).toEqual(`Current Version`)
    })
})
