import analytics from '../analytics'

interface EventProperties {
    [key: string]: any
}

export default abstract class AnalyticsBuilder {
    protected abstract eventName: string

    private _properties: EventProperties = {}

    withProperty(key: string, value: any) {
        this._properties[key] = value
        return this
    }

    withProperties(properties: { [key: string]: any }) {
        this._properties = {
            ...this._properties,
            ...properties
        }
        return this
    }

    track() {
        analytics.track(this.eventName, this._properties)
    }

    public getEventName() {
        return this.eventName
    }

    public readProperties() {
        return Object.assign({}, this._properties)
    }
}
