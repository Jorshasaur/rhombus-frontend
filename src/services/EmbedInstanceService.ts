import { PaneEmbedProvider } from '../components/pages/Editor/Blots/PaneEmbed/PaneEmbedProvider'

type AllowedInstances = PaneEmbedProvider

class EmbedInstanceService {
    instances: Map<string, AllowedInstances>

    constructor() {
        this.instances = new Map()
    }

    public addInstance(id: string, instance: AllowedInstances) {
        this.instances.set(id, instance)
    }

    public removeInstance(id: string) {
        this.instances.delete(id)
    }

    public getInstance(id: string) {
        return this.instances.get(id)
    }
}

export default new EmbedInstanceService()
