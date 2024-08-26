import React from 'react'
import PagesApiService from '../../../data/services/PagesApiService'
import { RouteProps } from 'react-router'
import analytics from '../../../analytics/analytics'

export class CreateDocument extends React.Component<RouteProps> {
    constructor(props: RouteProps) {
        super(props)
        this.createNewDocument()
    }
    async createNewDocument() {
        const document = await PagesApiService.createDocument()

        analytics.track(analytics.DOCUMENT_CREATED, {
            createdFrom: 'Doc'
        })

        let documentUrl = document.url
        if (this.props.location != null && this.props.location.search != null) {
            documentUrl = `${documentUrl}${this.props.location.search}`
        }
        return (window.location.href = documentUrl)
    }
    render() {
        return null
    }
}
