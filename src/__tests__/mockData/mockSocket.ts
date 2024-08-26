import { EventEmitter } from 'events'

class SocketEmitter extends EventEmitter {}

// tslint:disable-next-line
export class mockSocket {
    emitter = new SocketEmitter()

    disconnect = jest.fn()
    connect = jest.fn()
    reconnect = jest.fn()
    close = jest.fn()

    on = jest.fn((event: string, listener: (...args: any[]) => void) => {
        this.emitter.on(event, listener)
    })

    off = jest.fn((event: string, listener: (...args: any[]) => void) => {
        this.emitter.removeListener(event, listener)
    })

    emit = jest.fn((event: string, ...args: any[]) => {
        this.emitter.emit(event, ...args)
    })
}
