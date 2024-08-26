import { mount } from 'enzyme'
import React from 'react'
import { CreateEmbedModal } from '../../components/pages/Editor/Blots/CreateEmbedModal'

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

const createComponent = (props: any = {}) => {
    const baseProps = {
        isShown: true,
        embedType: 'spotify',
        onAddAndClose: jest.fn(),
        onClose: jest.fn()
    }

    return mount(<CreateEmbedModal {...baseProps} {...props} />)
}

describe('<CreateEmbedModal />', () => {
    beforeAll(() => {
        const nav = document.createElement('div')
        nav.id = 'global-navigation'
        document.body.appendChild(nav)
    })

    it('renders', () => {
        const component = createComponent()

        expect(component.find('Modal')).toExist()
        expect(component.find('Input')).toExist()
        expect(component.find('Button')).toExist()
    })

    it('sends a URL back to the caller when it closes', () => {
        const component = createComponent()

        const value = 'http://google.com'
        component
            .find('Input' + testid('create-embed-modal__input'))
            .simulate('change', {
                target: {
                    value
                }
            })
        component.find('form').simulate('submit')

        expect(component.prop('onAddAndClose')).toHaveBeenCalledWith(value)
    })
})
