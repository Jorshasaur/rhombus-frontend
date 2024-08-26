import * as React from 'react'
import { Provider } from 'react-redux'
import * as ReactDOM from 'react-dom'
import store from './data/store'
import App from './components/App'
import { unregister } from './registerServiceWorker'
import './assets/css/index.module.css'
import { isDevelopment, mapDevModeToWindow } from './dev/devMode'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { ErrorBoundary } from './bugsnag'

if (isDevelopment()) {
    mapDevModeToWindow()
}

let component
if (ErrorBoundary != null) {
    component = (
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    )
} else {
    component = <App />
}

ReactDOM.render(
    <Provider store={store}>
        <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </Provider>,
    document.getElementById('root') as HTMLElement
)
unregister()
