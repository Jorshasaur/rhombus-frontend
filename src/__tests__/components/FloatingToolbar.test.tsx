import { shallow } from 'enzyme'
import React from 'react'
import FloatingToolbar from '../../components/pages/Editor/FloatingToolbar/FloatingToolbar'

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

const floatingToolbarProps = {
    createComment: jest.fn(),
    formatSelection: jest.fn(),
    selection: {
        index: 2,
        selectionLength: 4,
        selectionType: 0,
        blotName: '',
        isFirstLine: false,
        text: 'test',
        blockquote: false,
        header: null,
        codeBlock: false,
        list: null,
        bold: false,
        italic: false,
        link: null,
        strike: false,
        underline: false,
        left: 0,
        top: 0,
        width: 0
    },
    insertLink: jest.fn(),
    onDividerClick: jest.fn(),
    canEdit: true,
    canComment: false,
    scrollTop: 0
}

document.getSelection = jest.fn(() => {
    return {
        anchorNode: document.createElement('div'),
        focusNode: document.createElement('div'),
        anchorOffset: 0,
        focusOffset: 100
    }
})

describe('Floating Toolbar', () => {
    it('should be an instance of FloatingToolbar', () => {
        const wrapper = shallow(<FloatingToolbar {...floatingToolbarProps} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(FloatingToolbar)
    })
    it('should only display the comment button in comment only mode', () => {
        const cannotEditProps = {
            ...floatingToolbarProps,
            canEdit: false,
            canComment: true
        }
        const wrapper = shallow(<FloatingToolbar {...cannotEditProps} />)
        expect(wrapper.children).toHaveLength(1)
        expect(wrapper.childAt(0).text()).toEqual(' Comment')
    })
})
