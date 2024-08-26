import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import data from 'emoji-mart/data/emojione.json'
import { CustomCategory } from '../../components/pages/Editor/EmojiPicker/CustomCategory/CustomCategory'
jest.mock('pubsub-js')

Enzyme.configure({ adapter: new Adapter() })

const customNimblePickerProps = {
    id: 'foods',
    name: 'Food & Drink',
    emojis: [],
    perLine: 7,
    native: false,
    hasStickyPosition: jest.fn(() => true),
    data,
    i18n: {
        search: 'Search',
        notfound: 'No Emoji Found',
        categories: {
            search: 'Search Results',
            recent: 'Frequently Used',
            people: 'Smileys & People',
            nature: 'Animals & Nature',
            foods: 'Food & Drink',
            activity: 'Activity',
            places: 'Travel & Places',
            objects: 'Objects',
            symbols: 'Symbols',
            flags: 'Flags',
            custom: 'Custom'
        }
    },
    notFoundEmoji: 'sleuth_or_spy',
    emojiProps: {
        skin: 1,
        onOver: jest.fn(),
        onLeave: jest.fn(),
        onClick: jest.fn()
    },
    searchText: '',
    anchorClicked: false
}

describe('CustomCategory', () => {
    it('should be an instance of CustomCategory', () => {
        const wrapper = mount(<CustomCategory {...customNimblePickerProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(CustomCategory)
    })
    it('should not display a non-search category if there is search text', () => {
        const searchedProps = {
            ...customNimblePickerProps,
            searchText: 'dog'
        }
        const wrapper = mount(<CustomCategory {...searchedProps} />)
        expect(
            wrapper.find('.emoji-mart-category').props().style.display
        ).toEqual('none')
    })
    it('should display a search category if there is search text', () => {
        const searchedProps = {
            ...customNimblePickerProps,
            searchText: 'dog',
            id: 'search',
            name: 'Search Results'
        }
        const wrapper = mount(<CustomCategory {...searchedProps} />)
        expect(
            wrapper.find('.emoji-mart-category').props().style.display
        ).not.toEqual('none')
    })
    it('should display a non-search category if there is search text and a category anchor is clicked', () => {
        const searchedProps = {
            ...customNimblePickerProps,
            searchText: 'dog',
            anchorClicked: true
        }
        const wrapper = mount(<CustomCategory {...searchedProps} />)
        expect(
            wrapper.find('.emoji-mart-category').props().style.display
        ).not.toEqual('none')
    })
})
