import * as React from 'react'
import { BrowserRouter as Router, Switch, Route } from 'react-router-dom'

import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'

import Navigation from './pages/Navigation/NavigationContainer'
import Banner from './pages/Banner/BannerContainer'
import EditorContainer from './pages/Editor/EditorContainer'
import { CreateDocument } from './pages/CreateDocument/CreateDocument'
import NotFound from './errors/NotFound'
import styles from '../assets/css/App.module.css'
import '../assets/css/common/vars.module.css'

import '../lib/prototypes'

interface Props {}
interface State {}

export default class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {}
    }

    render() {
        return (
            <ThemeProvider theme={theme}>
                <Router basename="/rhombus/">
                    <div id="app" className={styles.App}>
                        <Banner />
                        <Navigation />
                        <Switch>
                            <Route path="/create" component={CreateDocument} />
                            <Route
                                path="/:slugAndShortId"
                                component={EditorContainer}
                            />
                            <Route path="/" component={NotFound} />
                        </Switch>
                    </div>
                </Router>
            </ThemeProvider>
        )
    }
}
