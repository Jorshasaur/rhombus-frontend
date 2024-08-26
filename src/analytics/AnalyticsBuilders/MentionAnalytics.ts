import AnalyticsBuilder from './AnalyticsBuilder'

const USER_MENTIONED = {
    event: 'App.Rhombus.User.Mentioned',
    properties: {
        type: {
            name: 'type',
            FROM_COMMENTING: 'MentionFrom.Commenting',
            FROM_DOCUMENT: 'MentionFrom.Document'
        }
    }
}

export default class MentionAnalytics extends AnalyticsBuilder {
    protected eventName: string = USER_MENTIONED.event

    constructor() {
        super()
    }

    public fromCommenting = () =>
        this.withProperty(
            USER_MENTIONED.properties.type.name,
            USER_MENTIONED.properties.type.FROM_COMMENTING
        )

    public fromDocument = () =>
        this.withProperty(
            USER_MENTIONED.properties.type.name,
            USER_MENTIONED.properties.type.FROM_DOCUMENT
        )
}
