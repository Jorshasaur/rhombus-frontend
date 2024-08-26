import React from 'react'
import { mount } from 'enzyme'
import { BlotSize } from '../../interfaces/blotSize'
import { AnimatedEmbedWrapper } from '../../components/pages/Editor/Blots/AnimatedEmbedWrapper'

const baseProps = {
    renderSmall: () => <div />,
    renderFullSize: () => <div />,
    size: BlotSize.Medium,
    getEmbedSize: () => ({ height: 10, width: 10 }),
    container: document.createElement('div'),
    popoutOpen: false,
    hasOpenThread: false,
    onTransitionEnd: jest.fn()
}

describe('AnimatedEmbedWrapper component', () => {
    it('should render', async () => {
        const component = mount(<AnimatedEmbedWrapper {...baseProps} />)
        const a = component.find(testid('animated-embed-wrapper__medium'))
        expect(a).toExist()
    })

    // eslint-disable-next-line
    it('should call transitionEnd input if it exists', async (done) => {
        const component = mount<AnimatedEmbedWrapper['props']>(
            <AnimatedEmbedWrapper {...baseProps} />
        )
        component.setProps({ size: BlotSize.Large })
        setTimeout(() => {
            expect(component.props().onTransitionEnd).toBeCalled()
            done()
        }, 300)
    })
})
