import {
    applyMiddleware,
    createStore,
    combineReducers,
    Middleware,
    Store
} from 'redux'
import { createLogger } from 'redux-logger'
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension/developmentOnly'

// Reducers
import { reducer, RootState } from './reducers/index'
import { TypeKeys } from './ActionTypes'
import { includes } from 'lodash'

const middlewares: Middleware[] = [thunk]

if (process.env.NODE_ENV !== 'production' && process.env.APP_ENV !== 'test') {
    const loggerMiddleware = createLogger({
        collapsed: true,
        diff: true,
        predicate: (getState, action) =>
            !includes(
                [
                    TypeKeys.SET_MOUSEOVER,
                    TypeKeys.RESET_MOUSEOVER,
                    TypeKeys.USER_LOGGED_IN
                ],
                action.type
            )
    })
    middlewares.push(loggerMiddleware)
}

export default function configureStore(
    initialState?: RootState
): Store<RootState> {
    const reducers = combineReducers<RootState>(reducer)

    const composeEnhancers = composeWithDevTools({})

    return createStore<RootState>(
        reducers,
        composeEnhancers(applyMiddleware(...middlewares))
    )
}
