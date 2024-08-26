import React from 'react'
import { render, RenderOptions, RenderResult } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import '@testing-library/jest-dom'
// @ts-ignore
import MutationObserver from '@sheerun/mutationobserver-shim'

window.MutationObserver = MutationObserver

const AllTheProviders = ({ children }: { children: React.ReactElement }) => {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

const customRender = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'queries'>
): RenderResult => render(ui, { wrapper: AllTheProviders, ...options })

// re-export everything
export * from '@testing-library/react'

// override render method
export { customRender as render }
