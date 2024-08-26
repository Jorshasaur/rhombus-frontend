import Bugsnag, { NotifiableError } from '@bugsnag/js'
import React from 'react'
import BugsnagPluginReact from '@bugsnag/plugin-react'

export default {
    notify(
        error: NotifiableError,
        options?: { metadata: { [k: string]: any } }
    ) {
        Bugsnag.notify(error, (err) => {
            Object.entries(options?.metadata ?? {}).forEach(([k, v]) => {
                err.addMetadata(k, v)
            })
        })
    }
}

if (process.env.NODE_ENV !== 'test') {
    Bugsnag.start({
        apiKey: window.INVISION_ENV.BUGSNAG_API_KEY,
        appVersion: window.INVISION_ENV.GITHASH,
        releaseStage: window.INVISION_ENV.METADATA_TYPE,
        appType: 'client',
        metadata: {
            cluster: window.INVISION_ENV.METADATA_NAME
        },
        plugins: [new BugsnagPluginReact()],
        enabledReleaseStages: [
            'local',
            'overrideSHA',
            'testing',
            'preview',
            'multi-tenant'
        ]
    })
}

export const ErrorBoundary =
    Bugsnag.getPlugin('react')?.createErrorBoundary(React) ?? 'div'
