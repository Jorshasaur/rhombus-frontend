import configureStore from './configureStore'
import initSubscriber from 'redux-subscriber'

const store = configureStore()
export const subscribe = initSubscriber(store)
export default store
