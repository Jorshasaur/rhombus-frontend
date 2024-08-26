import React from 'react'
import { mount } from 'enzyme'
import { ServiceErrorEmbed } from '../../components/pages/Editor/Blots/ServiceErrorEmbed/ServiceErrorEmbed'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'

const text = 'Whoops'
const tooltipText = <React.Fragment>{text}</React.Fragment>

const baseProps = {
    service: 'prototype',
    originalLink:
        'https://no.invisionapp.com/prototype/It-s-turbo-time-cjp1kvlsa0001j001j27tn4qi/play/b4e3d643',
    tooltipText
}

const Component = (props: any) => (
    <ThemeProvider theme={theme}>
        <ServiceErrorEmbed {...props} />
    </ThemeProvider>
)

describe('ServiceErrorEmbed', () => {
    it('should render a warning', () => {
        const wrapper = mount(<Component {...baseProps} />)
        const crossTeamWarning = wrapper.find('.serviceErrorMessageContainer')
        expect(crossTeamWarning).toHaveLength(1)
        expect(crossTeamWarning.text()).toEqual(text)
    })
})
