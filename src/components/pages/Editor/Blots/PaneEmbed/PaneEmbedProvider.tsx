import { includes } from 'lodash'
import PubSub from 'pubsub-js'
import Quill from 'quill/core'
import React from 'react'
import { createPortal } from 'react-dom'
import { PANE_SERVICE_NAME } from '../../../../../constants/embeds'
import { MAIN_EDITOR_ID } from '../../../../../constants/general'
import { DND_ANIMATION_SPEED } from '../../../../../constants/styles'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../../constants/topics'
import store from '../../../../../data/store'
import { BlotSize } from '../../../../../interfaces/blotSize'
import { Permissions } from '../../../../../interfaces/permissions'
import { getBlotPositioning } from '../../../../../lib/getBlotPositioning'
import { addRootElement, createRootElement } from '../../../../../lib/utils'
import resizeObserverService from '../../../../../services/ResizeObserverService'
import QuillEvents from '../../../../quill/modules/QuillEvents'
import quillProvider from '../../../../quill/provider'
import PaneEmbedContainer from './PaneEmbedContainer'
import { defaultPaneState, PaneEmbedContext } from './PaneEmbedContext'

const Parchment = Quill.import('parchment')

interface PaneEmbedProviderProps {
    authorId: string
    authorName?: string
    createdAt?: string
    embedData?: {}
    key: string
    originalLink?: string
    size?: BlotSize
    title?: string
    type?: string
    version?: number
    quillBlotElement: HTMLElement
    uuid: string
}

export class PaneEmbedProvider extends React.Component<PaneEmbedProviderProps> {
    state: PaneEmbedContext
    quillBlotElement: HTMLElement
    rootElem: HTMLDivElement
    scrollContainer: HTMLElement | null
    editorQuill: Quill
    token: string

    constructor(props: PaneEmbedProviderProps) {
        super(props)
        this.editorQuill = quillProvider.getQuill()

        this.quillBlotElement = props.quillBlotElement
        this.scrollContainer = document.getElementById(MAIN_EDITOR_ID)

        this._createPortalTarget(props.uuid)

        this._syncPortalPositioning()

        this.editorQuill.on(QuillEvents.TEXT_CHANGE, () => {
            this._syncBlotTopPositioning()
        })
        this.state = {
            ...defaultPaneState,
            ...props
        }
        this.token = PubSub.subscribe(
            DOCUMENT_CHANGE_REPOSITION,
            this._subscribe.bind(this)
        )
    }

    private _subscribe(
        _event: typeof DOCUMENT_CHANGE_REPOSITION,
        immediate: boolean
    ) {
        const speed = immediate ? 0 : DND_ANIMATION_SPEED
        setTimeout(() => {
            this._syncBlotTopPositioning()
        }, speed)
    }

    private _syncBlotTopPositioning(suppliedTop?: number) {
        const blotTop =
            suppliedTop ||
            getBlotPositioning(this.quillBlotElement, this.scrollContainer).top

        if (this.rootElem && this.rootElem.style.top !== `${blotTop}px`) {
            this.rootElem.style.top = `${blotTop}px`
        }
    }

    private _syncPortalPositioning() {
        resizeObserverService.observe(this.rootElem, (target: Element) => {
            if (
                this.quillBlotElement.style.height !==
                `${target.clientHeight}px`
            ) {
                this.quillBlotElement.style.height = `${target.clientHeight}px`
            }
        })

        resizeObserverService.observe(
            this.quillBlotElement,
            (target: HTMLElement) => {
                const { width, top, left } = getBlotPositioning(
                    target,
                    this.scrollContainer
                )

                this._syncBlotTopPositioning(top)

                if (this.rootElem.style.position !== 'absolute') {
                    this.rootElem.style.position = 'absolute'
                }

                if (this.rootElem.style.width !== `${width}px`) {
                    this.rootElem.style.width = `${width}px`
                }

                if (this.rootElem.style.left !== `${left}px`) {
                    this.rootElem.style.left = `${left}px`
                }
            }
        )
    }

    private _createPortalTarget(uuid: string) {
        const id = `portal-${uuid}`
        const existingParent = document.querySelector(`#${id}`)
        // Parent is either a new root or the existing dom element
        const parentElem = existingParent || createRootElement(id)

        // If there is no existing DOM element, add a new one.
        if (!existingParent) {
            addRootElement(this.scrollContainer, parentElem)
        }

        // Add the detached element to the parent
        const rootElem = this._getRootElem()
        parentElem.appendChild(rootElem)
    }

    private _getRootElem() {
        if (!this.rootElem) {
            this.rootElem = document.createElement('div')
        }
        return this.rootElem
    }

    private _setQuillBlockEmbedProps(updateData = {}) {
        const props = {
            version: this.state.version,
            service: PANE_SERVICE_NAME,
            uuid: this.state.uuid,
            authorId: this.state.authorId,
            embedData: this.state.embedData,
            createdAt: this.state.createdAt,
            size: this.state.size,
            ...updateData
        }
        this.quillBlotElement.setAttribute('data-props', JSON.stringify(props))
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
        this.quillBlotElement.setAttribute(`data-${name}`, value)
        const dataAttributeUpdate = { [name]: value }
        this.setState(dataAttributeUpdate)
        this._setQuillBlockEmbedProps(dataAttributeUpdate)
    }

    setSize(size: BlotSize) {
        this.setDataAttribute('size', size)
    }

    /**
     * Completely overwrite the blot's embed data
     * @param embedData
     */
    resetEmbedData(embedData: object) {
        this.setState({ embedData })
        this._setQuillBlockEmbedProps({ embedData })
    }

    setEmbedDataValue(key: string, value?: any) {
        const embedData = this.state.embedData
        const newEmbedData = Object.assign({}, embedData, { [key]: value })
        this.resetEmbedData(newEmbedData)
    }

    handlePermissionsUpdate = (permissions: Permissions) => {
        const canEdit = permissions.canEdit
        const newState = { canEdit }
        this.setState(newState)
    }

    selectBlot(event: React.MouseEvent<Element, MouseEvent>) {
        const quillBlot = Parchment.find(this.quillBlotElement)
        quillBlot.handleClick(event)
    }

    render() {
        return createPortal(
            <PaneEmbedContext.Provider
                value={{
                    ...this.state,
                    selectBlot: (event) => {
                        this.selectBlot(event)
                    },
                    setState: (state) => {
                        this.setState(state)
                    },
                    setEmbedDataValue: (key: string, value?: any) => {
                        this.setEmbedDataValue(key, value)
                    }
                }}>
                {/*
                    // @ts-ignore */}
                <PaneEmbedContainer store={store} />
            </PaneEmbedContext.Provider>,
            this._getRootElem()
        )
    }
}
