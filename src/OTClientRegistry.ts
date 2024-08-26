import { OTEditorClient } from './data/panes/OTClient'

const registry = new Map<string, OTEditorClient>()

export function registerClient(id: string, client: OTEditorClient) {
    registry.set(id, client)
}

export function getClient(id: string) {
    return registry.get(id)
}

export function removeClient(id: string) {
    registry.delete(id)
}

function isClientSynchronized(client: OTEditorClient) {
    return client.isSynchronized()
}

export function isSynchronized() {
    return Array.from(registry.values()).every(isClientSynchronized)
}
