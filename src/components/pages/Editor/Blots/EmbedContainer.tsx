import { includes } from 'lodash'
import { Container } from 'unstated'
import Quill from 'quill/core'
import { RootState } from '../../../../data/reducers'
import store, { subscribe } from '../../../../data/store'
import { BlotSize } from '../../../../interfaces/blotSize'
import { Permissions } from '../../../../interfaces/permissions'

const Parchment = Quill.import('parchment')

export interface EmbedContainerAppState {
    uuid: string
    service: string
    version: number
    authorId: string
    embedData: any
    hasOpenThread?: boolean
    type?: string
    originalLink?: string
    createdAt?: string
    canEdit?: boolean
    size?: BlotSize
    unviewable?: boolean
    unviewableReason?: string
}

const defaultState = {
    uuid: '',
    service: '',
    version: 1,
    authorId: '',
    embedData: {},
    canEdit: false,
    size: BlotSize.Medium,
    hasOpenThread: false,
    unviewable: false
}

export default class EmbedContainer extends Container<EmbedContainerAppState> {
    constructor(
        public state: EmbedContainerAppState = defaultState,
        public quillBlotElement?: HTMLElement
    ) {
        super()
        this.receivedNewState()
        this.handlePermissionsUpdate(store.getState().permissions)

        subscribe('permissions', (rootState: RootState) => {
            this.handlePermissionsUpdate(rootState.permissions)
        })

        subscribe('comments.selectedCommentMarkId', (rootState: RootState) => {
            this.checkForLargeResize(
                rootState.comments.selectedCommentMarkId,
                this.state.embedData.threadIds,
                this.state.size
            )
        })

        subscribe('comments.threads', (rootState: RootState) => {
            this.checkForLargeResize(
                rootState.comments.selectedCommentMarkId,
                this.state.embedData.threadIds,
                this.state.size
            )
        })
    }

    setQuillBlockEmbedProps() {
        const props = {
            version: this.state.version,
            originalLink: this.state.originalLink,
            type: this.state.type,
            service: this.state.service,
            uuid: this.state.uuid,
            authorId: this.state.authorId,
            embedData: this.state.embedData,
            createdAt: this.state.createdAt,
            size: this.state.size
        }
        if (this.quillBlotElement != null) {
            this.quillBlotElement.setAttribute(
                'data-props',
                JSON.stringify(props)
            )
        }
    }

    checkForLargeResize = (
        selectedCommentMarkId: string | undefined,
        threadIds: string[] | undefined,
        size: string | undefined
    ) => {
        if (
            size &&
            size === BlotSize.Large &&
            selectedCommentMarkId &&
            threadIds &&
            includes(threadIds, selectedCommentMarkId)
        ) {
            this.setState({ hasOpenThread: true })
        } else {
            this.setState({ hasOpenThread: false })
        }
    }

    setDataAttribute(name: string, value: string) {
        if (this.quillBlotElement != null) {
            this.quillBlotElement.setAttribute(`data-${name}`, value)
        }
        this.setState({ [name]: value })
        this.setQuillBlockEmbedProps()
    }

    setSize(size: BlotSize) {
        this.setDataAttribute('size', size)
    }

    receivedNewState() {
        // you could override this function in your subclass
    }

    getEmbedData() {
        return this.state.embedData
    }

    setState(state: any) {
        super.setState(state)
        this.receivedNewState()
    }

    /**
     * Completely overwrite the blot's embed data
     * @param embedData
     */
    resetEmbedData(embedData: object) {
        this.setState({ embedData })
        this.setQuillBlockEmbedProps()
    }

    /**
     * Merge the provided object with the blot's embed data, like React's `setState`
     * @param embedData
     */
    setEmbedData(embedData: object) {
        this.setState({ embedData: { ...this.state.embedData, ...embedData } })
        this.setQuillBlockEmbedProps()
    }

    handlePermissionsUpdate = (permissions: Permissions) => {
        const canEdit = permissions.canEdit
        const newState = { canEdit }
        this.setState(newState)
    }

    setEmbedDataValue(
        keyOrValues: string | { [key: string]: any },
        value?: any
    ) {
        const embedData = this.state.embedData
        let newEmbedData = Object.assign({}, embedData)
        if (typeof keyOrValues === 'string') {
            newEmbedData[keyOrValues] = value
        } else {
            newEmbedData = Object.assign({}, embedData, keyOrValues)
        }
        this.resetEmbedData(newEmbedData)
    }

    addComment = () => {
        const quillBlot = Parchment.find(this.quillBlotElement)
        if (quillBlot) {
            quillBlot.addComment()
        }
    }
}
