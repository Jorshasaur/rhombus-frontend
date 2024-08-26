import { includes, startsWith } from 'lodash'
import URI from 'urijs'
import {
    INVISION_DOMAINS,
    YOUTUBE_DOMAINS,
    JIRA_PATTERN
} from '../../../constants/clipboard'

export function matchEmbedUrl(url: string) {
    let uri = URI(url)

    // If the url has no protocol, we prepend https and reparse it
    if (uri.protocol().length === 0) {
        uri.protocol('https')
        uri = URI(uri.valueOf())
    }

    if (
        includes(INVISION_DOMAINS, uri.domain()) &&
        startsWith(uri.path(), '/prototype/')
    ) {
        return 'prototype'
    }
    // Invision expanded share url
    if (
        includes(INVISION_DOMAINS, uri.domain()) &&
        (startsWith(uri.path(), '/share/') ||
            startsWith(uri.path(), '/public/share/') ||
            startsWith(uri.path(), '/console/') ||
            startsWith(uri.path(), '/overview/'))
    ) {
        return 'invision'
    }
    // InVision Freehand
    if (
        includes(INVISION_DOMAINS, uri.domain()) &&
        (startsWith(uri.path(), '/freehand/') ||
            startsWith(uri.path(), '/public/freehand/'))
    ) {
        return 'freehand'
    }
    // Invision shortened share url
    if (uri.domain() === 'invis.io') {
        return 'invision'
    }

    // Marvel share url
    if (
        uri.domain() === 'marvelapp.com' &&
        !startsWith(uri.path(), '/project/')
    ) {
        return 'marvel'
    }

    // Codepen share url
    if (uri.domain() === 'codepen.io' && includes(uri.path(), '/pen/')) {
        return 'codepen'
    }

    // Jira
    if (
        uri.host().includes('atlassian.net') &&
        JIRA_PATTERN.test(uri.pathname())
    ) {
        return 'jira'
    }

    // Youtube links
    if (
        uri.domain() === 'youtu.be' ||
        (includes(YOUTUBE_DOMAINS, uri.domain()) &&
            (startsWith(uri.path(), '/embed/') ||
                startsWith(uri.path(), '/v/') ||
                startsWith(uri.path(), '/watch')))
    ) {
        return 'youtube'
    }

    // Vimeo links
    if (
        includes('vimeo.com', uri.domain()) &&
        (!isNaN(parseInt(uri.path().replace('/', ''), 10)) ||
            startsWith(uri.path(), '/video/'))
    ) {
        return 'vimeo'
    }

    // Soundcloud Links
    if (uri.domain() === 'soundcloud.com' && uri.path().length > 1) {
        return 'soundcloud'
    }

    // Spotify Links
    if (
        uri.domain() === 'spotify.com' &&
        uri.subdomain() === 'open' &&
        uri.path().length > 1
    ) {
        return 'spotify'
    }

    // Linkedin Links
    // TODO: re-enable linkedin embeds
    // if (
    //     uri.domain() === 'linkedin.com' &&
    //     (startsWith(uri.path(), '/in/') || startsWith(uri.path(), '/company/'))
    // ) {
    //     return 'linkedin'
    // }

    return false
}
