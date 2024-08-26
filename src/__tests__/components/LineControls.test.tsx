import React from 'react'
import { shallow, mount } from 'enzyme'
import LineControls, {
    Props
} from '../../components/pages/Editor/LineControls/LineControls'
import { SelectionType } from '../../interfaces/selectionType'
import { RESIZEABLE_SERVICES } from '../../constants/embeds'

jest.mock('../../components/quill/entries/Editor')

let mockViewable = true

jest.mock('../../../src/components/quill/utils/getEmbedFromIndex', () => ({
    __esModule: true,
    default: () => ({
        viewable: () => mockViewable
    })
}))

jest.mock('../../components/pages/Editor/LineDrag/DragButton', () => {
    const React = require('react')
    return () => <div id="DragButton" />
})
jest.mock('../../components/pages/Editor/LineDrag/DragPreviewLayer', () => {
    const React = require('react')
    return () => <div id="DragPreviewLayer" />
})
const props: Props = {
    index: 1,
    blotType: SelectionType.Text,
    blotName: 'block',
    blotData: {},
    top: 0,
    height: 10,
    navigationHeight: 70,
    onUploadFiles: jest.fn(),
    dragging: false,
    canEdit: true,
    canComment: false,
    resizeSmall: true,
    resizeMedium: true,
    resizeLarge: true,
    lineControlComment: true,
    containerWidth: 100,
    onPlusClicked: jest.fn()
}

describe('LineControls', () => {
    it('should be an instance of LineControls', () => {
        const wrapper = shallow(<LineControls {...props} />)
        const inst = wrapper.instance()
        expect(inst).toBeInstanceOf(LineControls)
    })
    it('should render line controls for a text blot', () => {
        const wrapper = mount(<LineControls {...props} />)
        expect(wrapper.find('#DragButton')).toHaveLength(1)
        expect(wrapper.find('#DragPreviewLayer')).toHaveLength(1)
        expect(wrapper.find('.resizeControlButton')).toHaveLength(0)
    })
    it('should not render line controls for a text blot with comment permissions', () => {
        const commentOnlyPermissionsProps = {
            ...props,
            canEdit: false,
            canComment: true
        }
        const wrapper = mount(<LineControls {...commentOnlyPermissionsProps} />)
        expect(wrapper.find('#DragButton')).toHaveLength(0)
        expect(wrapper.find('#DragPreviewLayer')).toHaveLength(0)
        expect(wrapper.find('.resizeControlButton')).toHaveLength(0)
    })
    it('should render line controls for a resizeable blot', () => {
        const resizeableProps = {
            ...props,
            blotName: RESIZEABLE_SERVICES[0],
            blotType: SelectionType.Embed
        }

        const wrapper = mount(<LineControls {...resizeableProps} />)
        expect(wrapper.find('#DragButton')).toHaveLength(1)
        expect(wrapper.find('#DragPreviewLayer')).toHaveLength(1)
        expect(wrapper.find('.resizeControlButton')).toHaveLength(3)
        expect(wrapper.find('.commentControlButton')).toHaveLength(1)
    })
    it('should not render comment render line controls for a resizable blot', () => {
        const commentOnlyResizePermissionsProps = {
            ...props,
            blotType: SelectionType.Embed,
            blotName: RESIZEABLE_SERVICES[0],
            canEdit: false,
            canComment: true
        }
        const wrapper = mount(
            <LineControls {...commentOnlyResizePermissionsProps} />
        )
        expect(wrapper.find('.uploadButton')).toHaveLength(0)
        expect(wrapper.find('#DragButton')).toHaveLength(0)
        expect(wrapper.find('#DragPreviewLayer')).toHaveLength(0)
        expect(wrapper.find('.resizeControlButton')).toHaveLength(0)
        expect(wrapper.find('.commentControlButton')).toHaveLength(0)
    })

    it('does not render resize controls when a blot is not viewable', () => {
        mockViewable = false

        const resizeableProps = {
            ...props,
            blotName: RESIZEABLE_SERVICES[0],
            blotType: SelectionType.Embed
        }

        const wrapper = mount(<LineControls {...resizeableProps} />)
        expect(wrapper.find('#DragButton')).toHaveLength(1)
        expect(wrapper.find('#DragPreviewLayer')).toHaveLength(1)
        expect(wrapper.find('.resizeControlButton')).toHaveLength(0)
        expect(wrapper.find('.commentControlButton')).toHaveLength(1)
    })
    it('renders the plus button', () => {
        mockViewable = false

        const newMenuProps = {
            ...props
        }

        const wrapper = mount(<LineControls {...newMenuProps} />)
        expect(wrapper.find('#plus-container')).toHaveLength(1)
        expect(wrapper.find('#upload-container')).toHaveLength(0)
    })
})
