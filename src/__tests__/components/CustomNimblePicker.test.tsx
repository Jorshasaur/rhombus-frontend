import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import data from 'emoji-mart/data/emojione.json'
import { CustomCategory } from '../../components/pages/Editor/EmojiPicker/CustomCategory/CustomCategory'
import Anchors from 'emoji-mart/dist/components/anchors'
import Search from 'emoji-mart/dist/components/search'
import { CustomNimblePicker } from '../../components/pages/Editor/EmojiPicker/CustomNimblePicker'
import { NimbleEmojiIndex } from 'emoji-mart'
jest.mock('pubsub-js')

Enzyme.configure({ adapter: new Adapter() })

const customNimblePickerProps = {
    set: 'emojione',
    title: 'Select an emoji',
    emojiSize: 24,
    onSelect: jest.fn(),
    exclude: [],
    perLine: 7,
    data,
    notFoundEmoji: 'sleuth_or_spy',
    searchText: ''
}

describe('EmojiPicker', () => {
    it('should be an instance of EmojiPicker', () => {
        const wrapper = shallow(
            <CustomNimblePicker {...customNimblePickerProps} />
        )
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(CustomNimblePicker)
    })
    it('should have anchors', () => {
        const wrapper = shallow(
            <CustomNimblePicker {...customNimblePickerProps} />
        )
        expect(wrapper.find(Anchors).length).toBeGreaterThan(0)
    })
    it('should have categories', () => {
        const wrapper = shallow(
            <CustomNimblePicker {...customNimblePickerProps} />
        )
        expect(wrapper.find(CustomCategory).length).toBeGreaterThan(0)
    })
    it('should have search', () => {
        const wrapper = shallow(
            <CustomNimblePicker {...customNimblePickerProps} />
        )
        expect(wrapper.find(Search).length).toBeGreaterThan(0)
    })
    it('should update the search data', () => {
        const CustomNimblePickerPrototype = CustomNimblePicker.prototype as any
        CustomNimblePickerPrototype.handleSearch = jest.fn()
        CustomNimblePickerPrototype.updateCategoriesSize = jest.fn()
        const wrapper = shallow(
            <CustomNimblePicker {...customNimblePickerProps} />
        )
        const emojiIndex = new NimbleEmojiIndex(data)
        const searchData = emojiIndex.search('dog')
        wrapper.setProps({ searchData })
        expect(CustomNimblePicker.prototype.handleSearch).toHaveBeenCalledWith(
            searchData
        )
    })
})
