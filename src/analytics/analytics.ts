import loadScript from 'load-script2'

interface EventProperties {
    [key: string]: any
}

function hasRequiredMethods() {
    const requiredAnalyticsMethods = ['initializeSegment', 'collect', 'page']
    return requiredAnalyticsMethods.every((methodName) => {
        return typeof window.measure![methodName] === 'function'
    })
}

loadScript('/measure/utilities.js', (err) => {
    if (err) {
        console.log('Unable to load measure script', err)
        return
    }

    if (window.measure == null || !hasRequiredMethods()) {
        console.log('Measure loaded but unavailable on window')
        return
    }

    window.measure.initializeSegment()
})

const DOCUMENT_VIEWED = 'App.Rhombus.Viewed'
const COMMENT_SUBMITTED = 'App.Rhombus.Comment.Submitted'
const SSO_EXPIRATION_MESSAGE_PRESENTED =
    'App.Rhombus.SSOExpirationMessagePresented'
const SSO_LOGIN_STATUS_CHECKED = 'App.Rhombus.SSOLoginStatusChecked'
const DOCUMENT_RESTORED = 'App.Document.Restored'
const DOCUMENT_ARCHIVED = 'App.Document.Archived'
const DOCUMENT_UNFOLLOWED = 'App.Rhombus.Doc.Unfollowed'
const DOCUMENT_UNFOLLOWED_METHODS = {
    navigation: 'UnfollowedManually',
    toast: 'UnfollowedviaHelios'
}
const DOCUMENT_CREATED = 'App.Rhombus.Created'

function track(eventName: string, properties?: EventProperties) {
    if (window.measure && window.measure.collect) {
        try {
            window.measure.collect(eventName, properties)
        } catch (analyticsError) {
            console.log('Error tracking analytics', analyticsError)
        }
    }
}

function page(label?: string, category?: string) {
    if (window.measure && window.measure.page) {
        try {
            window.measure.page(label, category)
        } catch (analyticsError) {
            console.log('Error setting analytics page', analyticsError)
        }
    }
}

function identifyUser() {
    if (window.measure && window.measure.identifyUser) {
        try {
            window.measure.identifyUser()
        } catch (analyticsError) {
            console.log('Error identifying user in analytics', analyticsError)
        }
    }
}

export default {
    DOCUMENT_VIEWED,
    COMMENT_SUBMITTED,
    SSO_EXPIRATION_MESSAGE_PRESENTED,
    SSO_LOGIN_STATUS_CHECKED,
    DOCUMENT_RESTORED,
    DOCUMENT_ARCHIVED,
    DOCUMENT_UNFOLLOWED,
    DOCUMENT_UNFOLLOWED_METHODS,
    DOCUMENT_CREATED,
    track,
    page,
    identifyUser
}
