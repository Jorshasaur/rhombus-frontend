import React from 'react'
import Enzyme, { shallow, mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { EmojiPicker } from '../../components/pages/Editor/EmojiPicker/EmojiPicker'
import { NimbleEmojiIndex } from 'emoji-mart'
import data from 'emoji-mart/data/emojione.json'
import quillProvider from '../../components/quill/provider'
import QuillSources from '../../components/quill/modules/QuillSources'
import { Emoji } from '../../components/quill/modules/Emoji'
const Quill: any = jest.genMockFromModule('quill/core')

jest.mock('pubsub-js')

Enzyme.configure({ adapter: new Adapter() })

let emojiPickerProps = {
    clearEmojiPicker: jest.fn(),
    left: 0,
    showEmojiPicker: false,
    bottom: 0,
    emojiText: 'dog',
    initialIndex: 0
}

beforeEach(() => {
    emojiPickerProps = {
        clearEmojiPicker: jest.fn(),
        left: 0,
        showEmojiPicker: false,
        bottom: 0,
        emojiText: 'dog',
        initialIndex: 0
    }
    Quill.scrollingContainer = {
        scrollTop: 0
    }
    Quill.deleteText = jest.fn()
    Quill.insertEmbed = jest.fn()
    Quill.setSelection = jest.fn()
    quillProvider.setQuill(Quill)
})

describe('EmojiPicker', () => {
    it('should be an instance of EmojiPicker', () => {
        const wrapper = shallow(<EmojiPicker {...emojiPickerProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(EmojiPicker)
    })
    it('should set the wrapperRef', () => {
        const wrapper = mount(<EmojiPicker {...emojiPickerProps} />)
        const instance: any = wrapper.instance()
        expect(instance.pickerRef).toBeTruthy()
    })
    it('should update the searched emojis', () => {
        const wrapper = shallow<EmojiPicker>(
            <EmojiPicker {...emojiPickerProps} />
        )
        const inst = wrapper.instance()
        const emojiIndex = new NimbleEmojiIndex(data)
        const dogData = emojiIndex.search('dog')
        expect(inst.state.searchData).toEqual(dogData)
        const catData = emojiIndex.search('cat')
        wrapper.setProps({ emojiText: 'cat' })
        expect(inst.state.searchData).toEqual(catData)
    })
    it('should clear when clicked outside of the picker', () => {
        const shownProps = {
            ...emojiPickerProps,
            showEmojiPicker: true
        }
        const wrapper = mount(<EmojiPicker {...shownProps} />)
        const instance: any = wrapper.instance()
        instance._handleClickOutside({ target: new Text('test') })
        expect(emojiPickerProps.clearEmojiPicker).toHaveBeenCalled()
    })
    it('should insert an emoji when clicked', () => {
        const shownProps = {
            ...emojiPickerProps,
            showEmojiPicker: true
        }
        const wrapper = mount(<EmojiPicker {...shownProps} />)
        const instance: any = wrapper.instance()
        const emoji = {
            native: '😍'
        }
        const emojiData = Emoji.getEmoji(emoji.native, 'native')
        instance._insertEmoji(emoji)
        expect(Quill.deleteText).toHaveBeenCalledWith(
            emojiPickerProps.initialIndex,
            emojiPickerProps.emojiText.length + 1,
            QuillSources.USER
        )
        expect(Quill.insertEmbed).toHaveBeenCalledWith(
            emojiPickerProps.initialIndex,
            'emoji-embed',
            emojiData,
            QuillSources.USER
        )
        expect(Quill.setSelection).toHaveBeenCalledWith(
            emojiPickerProps.initialIndex + 1,
            QuillSources.USER
        )
        expect(emojiPickerProps.clearEmojiPicker).toHaveBeenCalled()
    })
    it('should position the picker down correctly', () => {
        const shownProps = {
            ...emojiPickerProps,
            showEmojiPicker: true
        }
        const wrapper = mount(<EmojiPicker {...shownProps} />)
        const instance: any = wrapper.instance()
        const position = instance._calculateTopPosition(0)
        expect(position).toEqual('15px')
    })
    it('should position the picker up correctly', () => {
        const shownProps = {
            ...emojiPickerProps,
            showEmojiPicker: true
        }
        const wrapper = mount(<EmojiPicker {...shownProps} />)
        const instance: any = wrapper.instance()
        global.eval('window.innerHeight=1000')
        const position = instance._calculateTopPosition(1000)
        expect(position).toEqual('613px')
    })
    it('should update the searched emojis in the component', () => {
        const wrapper = mount(<EmojiPicker {...emojiPickerProps} />)
        wrapper.setProps({ emojiText: 'cat' })
        const catSearchLength = wrapper.find('.emoji-mart-emoji').length
        wrapper.setProps({ emojiText: 'wave' })
        const waveSearchLength = wrapper.find('.emoji-mart-emoji').length
        expect(catSearchLength).toBeGreaterThan(0)
        expect(waveSearchLength).toBeGreaterThan(0)
        expect(catSearchLength).not.toEqual(waveSearchLength)
    })
})
