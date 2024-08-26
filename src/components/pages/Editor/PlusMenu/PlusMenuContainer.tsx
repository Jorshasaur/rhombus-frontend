import cuid from 'cuid'
import Quill from 'quill'
import React from 'react'
import SmoothScroll from 'smoothscroll-polyfill'
import { v4 as uuid } from 'uuid'
import EmbedAddAnalytics from '../../../../analytics/AnalyticsBuilders/EmbedAddAnalytics'
import {
    BLOCK_EMBED_BLOT_NAME,
    PANE_SERVICE_NAME
} from '../../../../constants/embeds'
import { NEW_LINE } from '../../../../constants/general'
import { RootState } from '../../../../data/reducers'
import PagesApiService from '../../../../data/services/PagesApiService'
import store from '../../../../data/store'
import { FILE_CREATE_METHOD, URL_TYPES } from '../../../../helpers/EmbedHelper'
import { BlockEmbedService } from '../../../../interfaces/blockEmbed'
import { BlotSize } from '../../../../interfaces/blotSize'
import FileBlotCreater from '../../../quill/modules/FileBlotCreator'
import getFileEmbedOptions from '../../../quill/modules/FileEmbedOptions'
import { matchEmbedUrl } from '../../../quill/modules/matchEmbedUrl'
import QuillSources from '../../../quill/modules/QuillSources'
import getEmbedFromIndex from '../../../quill/utils/getEmbedFromIndex'
import { CreateEmbedModal } from '../Blots/CreateEmbedModal'
import { CreateFreehandModal } from '../Blots/CreateFreehandModal/CreateFreehandModal'
import PlusMenu from './PlusMenu'
import styles from './PlusMenu.module.css'

interface Props {
    quill: Quill
    index: number | null
    onClosePlusMenu: () => void
    showPlusMenu: boolean
    quillScrollTop: number
}

interface State {
    isModalShown: boolean
    embedType: BlockEmbedService | null
    currentLineIndex: number
    lineOffset: number
    showPlaceHolder: boolean
    isInsertingOnBlankLine: boolean
}

const LINE_HEIGHT = 22
const SCROLL_TOP_BUFFER = 96

export default class PlusMenuContainer extends React.Component<Props, State> {
    state: State = {
        isModalShown: false,
        embedType: null,
        lineOffset: 0,
        currentLineIndex: 0,
        showPlaceHolder: false,
        isInsertingOnBlankLine: false
    }

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (
            prevProps.showPlusMenu === false &&
            this.props.showPlusMenu === true
        ) {
            this.insertPlusMenuLine(prevProps, prevState)
        }
    }

    componentDidMount = () => {
        SmoothScroll.polyfill()
    }

    insertPlusMenuLine = (prevProps: Props, prevState: State) => {
        const state = store.getState() as RootState
        let insertPoint = state.mouseover.index
        const insertCharacter = NEW_LINE
        let isBlankLine = false
        const [, insertOffset] = this.props.quill.getLine(insertPoint)
        if (!prevState.showPlaceHolder) {
            let offset = this.props.quill.getBounds(insertPoint).top
            if (getEmbedFromIndex(insertPoint)) {
                // If there is an embed we actually want the next index to insert on
                insertPoint++
                offset = this.props.quill.getBounds(insertPoint).top
            } else if (insertOffset === 0) {
                // If it's a blank line we need to handle things a bit differently
                isBlankLine = true
            } else {
                offset += LINE_HEIGHT
            }
            if (!isBlankLine) {
                this.props.quill.insertText(
                    insertPoint,
                    insertCharacter,
                    { id: cuid() },
                    QuillSources.USER
                )
            }
            this.setState({
                lineOffset: offset,
                currentLineIndex: state.mouseover.index,
                showPlaceHolder: true,
                isInsertingOnBlankLine: isBlankLine
            })
            this.props.quill.enable(false)
        }
    }

    closePlusMenuAndEnableQuill = () => {
        this.props.onClosePlusMenu()
        this.props.quill.enable(true)
    }

    handleClosePlusMenu = () => {
        this.closePlusMenuAndEnableQuill()
        this.removePlaceholderLine()
        this.setState({
            embedType: null,
            isModalShown: false
        })
    }

    abortPlusMenu = () => {
        this.closePlusMenuAndEnableQuill()
        if (this.state.isInsertingOnBlankLine) {
            this.setState({ lineOffset: 0, showPlaceHolder: false })
        } else {
            this.removePlaceholderLine()
        }
    }

    removePlaceholderLine = () => {
        const lineText = this.props.quill.getText(this.getInsertionIndex(), 1)
        if (lineText.length === 1 && lineText === NEW_LINE) {
            this.props.quill.deleteText(
                this.getInsertionIndex(),
                1,
                QuillSources.USER
            )
        }
        this.setState({ lineOffset: 0, showPlaceHolder: false })
    }

    getInsertionIndex = () => {
        // Blank lines are going to overwrite with the insert
        // New lines are going to inside in that new index
        if (this.state.isInsertingOnBlankLine) {
            return this.state.currentLineIndex
        } else {
            return this.state.currentLineIndex + 1
        }
    }

    handleAddEmbed = (url: string) => {
        this.handleClosePlusMenu()
        const { quill } = this.props
        const index = this.getInsertionIndex()
        const service = matchEmbedUrl(url)

        const createdInRhombus =
            new URL(url).searchParams.get('createdInRhombus') === 'true'

        const {
            user: { userId, teamId, email },
            currentDocument: { id }
        } = store.getState()

        const analytics = new EmbedAddAnalytics().isURL()

        if (createdInRhombus) {
            analytics.viaEmbedModalCreate()
        } else {
            analytics.viaEmbedModal()
        }

        analytics
            .urlType(service as URL_TYPES)
            .withProperties({
                userId,
                teamId,
                email,
                documentId: id,
                embedHost: new URL(url).host
            })
            .track()

        const embedValue = {
            version: 1,
            originalLink: url,
            service,
            size: BlotSize.Medium,
            type: 'iframe',
            uuid: uuid(),
            authorId: quill.getModule('authorship').options.authorId,
            embedData: {},
            createdAt: new Date()
        }

        quill.insertEmbed(
            index,
            BLOCK_EMBED_BLOT_NAME,
            embedValue,
            QuillSources.USER
        )
        this.animateContainer(index)
        if (index === quill.getLength() - 1) {
            quill.insertText(index + 1, '\n', { id: cuid() }, QuillSources.USER)
        }
    }

    handleMenuItemClick = (embedType: BlockEmbedService) => {
        this.props.onClosePlusMenu()
        this.setState({
            embedType
        })
        setTimeout(() => {
            this.setState({
                embedType,
                isModalShown: true
            })
        }, 150)
    }

    handleAddPane = async () => {
        this.handleClosePlusMenu()
        const { quill } = this.props
        const index = this.getInsertionIndex()
        const pane = await PagesApiService.createPane()
        const embedValue = {
            version: 1,
            service: PANE_SERVICE_NAME,
            uuid: uuid(),
            authorId: quill.getModule('authorship').options.authorId,
            embedData: {
                pane: pane.id
            },
            createdAt: new Date()
        }

        quill.insertEmbed(index, 'pane-embed', embedValue, QuillSources.USER)
        this.animateContainer(index)
        if (index === quill.getLength() - 1) {
            quill.insertText(index + 1, '\n', { id: cuid() }, QuillSources.USER)
        }
    }

    onUploadFiles = (files: File[]) => {
        this.handleClosePlusMenu()
        const index = this.getInsertionIndex()
        FileBlotCreater.createBlotFromFiles(
            files,
            this.props.quill,
            BLOCK_EMBED_BLOT_NAME,
            { getEmbedOptions: this.getEmbedOptions, index },
            FILE_CREATE_METHOD.plusButton
        )
        this.animateContainer(index)
    }

    animateContainer = (index: number) => {
        setTimeout(() => {
            const [line] = this.props.quill.getLine(index)
            const node = line.domNode
            if (node && node.classList) {
                node.classList.add(styles.plusMenuEmbed)
                node.addEventListener('animationend', () => {
                    node.classList.remove(styles.plusMenuEmbed)
                    node.removeEventListener('animationend')
                })
                document.querySelector('#app')!.scrollTo({
                    top:
                        store.getState().plusMenu.insertTop - SCROLL_TOP_BUFFER,
                    behavior: 'smooth'
                })
            }
        }, 100)
    }

    getEmbedOptions = (file: File) => {
        return getFileEmbedOptions(file, this.props.quill)
    }

    renderEmbedModal() {
        if (this.state.embedType === 'freehand') {
            return (
                <CreateFreehandModal
                    isShown={this.state.isModalShown}
                    embedType={this.state.embedType || 'prototype'}
                    onAddAndClose={this.handleAddEmbed}
                    onClose={() => {
                        this.handleClosePlusMenu()
                        this.setState({
                            embedType: null,
                            isModalShown: false
                        })
                    }}
                />
            )
        }

        return (
            <CreateEmbedModal
                isShown={this.state.isModalShown}
                embedType={this.state.embedType || 'prototype'}
                onAddAndClose={this.handleAddEmbed}
                onClose={() => {
                    this.handleClosePlusMenu()
                }}
            />
        )
    }

    render() {
        return (
            <React.Fragment>
                {this.state.embedType && this.renderEmbedModal()}
                {this.props.showPlusMenu && (
                    <PlusMenu
                        onMenuItemClick={this.handleMenuItemClick}
                        scrollTop={this.props.quillScrollTop}
                        onUploadFiles={this.onUploadFiles}
                        abortPlusMenu={this.abortPlusMenu}
                        onNewPaneClicked={this.handleAddPane}
                    />
                )}
                {this.state.showPlaceHolder && (
                    <div
                        className={styles.plusMenuLineBar}
                        style={{ top: `${this.state.lineOffset}px` }}
                    />
                )}
            </React.Fragment>
        )
    }
}
