import File from '@invisionapp/helios/icons/File'
import Freehand from '@invisionapp/helios/icons/Freehand'
import Image from '@invisionapp/helios/icons/Image'
import Prototype from '@invisionapp/helios/icons/Prototype'
import React from 'react'
import Table from '../../../../assets/images/icons/line-controls/table.svg'
import { MEDIA_BUTTON_TYPES } from '../../../../constants/general'
import store from '../../../../data/store'
import { BlockEmbedService } from '../../../../interfaces/blockEmbed'
import { keycodes } from '../../../../interfaces/keycodes'
import styles from './PlusMenu.module.css'
import PlusMenuOption from './PlusMenuOption'
import cx from 'classnames'

interface Props {
    onUploadFiles: (files: File[]) => void
    onMenuItemClick: (embedType: BlockEmbedService) => void
    scrollTop: number
    abortPlusMenu: () => void
    onNewPaneClicked: () => void
}

interface MenuPositionStyles {
    top?: React.CSSProperties['top']
    bottom?: React.CSSProperties['bottom']
}

interface State {
    positionStyles: MenuPositionStyles
    currentMediaTypes: string
    showPanes: boolean
}

const PLUS_MENU_HEIGHT = 385
const PLUS_MENU_BUFFER = 56

export default class PlusMenu extends React.Component<Props, State> {
    wrapperRef = React.createRef<HTMLDivElement>()
    uploadInputRef = React.createRef<HTMLInputElement>()

    state = {
        positionStyles: { top: 0 },
        currentMediaTypes: '*',
        showPanes: false
    }

    componentWillUpdate(nextProps: Props, nextState: State) {
        if (this.props.scrollTop !== nextProps.scrollTop) {
            this.movePlusMenu()
        }
    }

    componentDidMount() {
        document.addEventListener('mousedown', this.checkForMenuClose)
        document.addEventListener('keydown', this.checkForEscape)
        window.addEventListener('scroll', this.movePlusMenu)

        this.movePlusMenu()
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.checkForMenuClose)
        document.removeEventListener('keydown', this.checkForEscape)
        window.addEventListener('scroll', this.movePlusMenu)
    }

    movePlusMenu = () => {
        const state = store.getState()
        if (state.plusMenu.showPlusMenu) {
            this.setState({ showPanes: state.featureFlags.panes })
            const scrollTop = this.props.scrollTop
            const insertTop = state.plusMenu.insertTop
            const windowHeight = window.innerHeight
            // If the menu would cross the bottom buffer and get cropped, flip it around
            if (
                windowHeight - (insertTop - scrollTop + PLUS_MENU_HEIGHT) >
                PLUS_MENU_BUFFER
            ) {
                this.positionMenu(insertTop)
            } else {
                this.positionMenu(insertTop - PLUS_MENU_HEIGHT)
            }
        }
    }

    positionMenu = (top: number) => {
        this.setState({
            positionStyles: {
                top: `${top}px`
            }
        })
    }

    checkForMenuClose = (e: MouseEvent) => {
        if (
            this.wrapperRef.current &&
            !this.wrapperRef.current.contains(e.target as Node)
        ) {
            this.props.abortPlusMenu()
        }
    }

    checkForEscape = (e: KeyboardEvent) => {
        if (e.keyCode === keycodes.Escape) {
            this.props.abortPlusMenu()
        }
    }

    updateUploadTypes = (type: string) => {
        switch (type) {
            case MEDIA_BUTTON_TYPES.image:
                this.setState({ currentMediaTypes: 'image/*' })
                break
            default:
                this.setState({ currentMediaTypes: '*' })
        }
    }

    onUpload = () => {
        if (this.uploadInputRef.current) {
            this.uploadInputRef.current.click()
        }
    }

    onImageUploaderChange = () => {
        if (!this.uploadInputRef.current) return

        const files = this.uploadInputRef.current.files ?? []

        if (files[0] != null) {
            this.props.onUploadFiles(Array.from(files))
        }
    }

    render() {
        return (
            <React.Fragment>
                <div
                    ref={this.wrapperRef}
                    className={styles.plusMenu}
                    data-testid="plus-menu"
                    style={this.state.positionStyles}>
                    <div className={styles.container}>
                        {this.state.showPanes && (
                            <React.Fragment>
                                <h4>Create...</h4>
                                <ul>
                                    <PlusMenuOption
                                        testId="pane"
                                        onClickAction={
                                            this.props.onNewPaneClicked
                                        }
                                        icon={
                                            <Table
                                                className={cx(
                                                    styles.imageIcon,
                                                    styles.fillPrimary
                                                )}
                                            />
                                        }>
                                        Table
                                    </PlusMenuOption>
                                </ul>
                            </React.Fragment>
                        )}
                        <h4>Upload...</h4>
                        <ul>
                            <PlusMenuOption
                                testId="image"
                                onClickAction={this.onUpload}
                                onMouseOver={() =>
                                    this.updateUploadTypes(
                                        MEDIA_BUTTON_TYPES.image
                                    )
                                }
                                icon={
                                    <Image
                                        fill="primary"
                                        className={styles.imageIcon}
                                    />
                                }>
                                Image
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="file"
                                onClickAction={this.onUpload}
                                onMouseOver={() =>
                                    this.updateUploadTypes(
                                        MEDIA_BUTTON_TYPES.file
                                    )
                                }
                                icon={<File fill="primary" />}>
                                File
                            </PlusMenuOption>
                        </ul>
                        <h4>Embed...</h4>
                        <ul>
                            <PlusMenuOption
                                testId="prototype"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('prototype')
                                }
                                icon={<Prototype fill="primary" />}>
                                Prototype
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="freehand"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('freehand')
                                }
                                icon={<Freehand fill="primary" />}>
                                Freehand
                            </PlusMenuOption>
                        </ul>
                        <hr />
                        <ul>
                            <PlusMenuOption
                                testId="youtube"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('youtube')
                                }
                                icon={<span className={styles.youtubeIcon} />}>
                                YouTube
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="vimeo"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('vimeo')
                                }
                                icon={<span className={styles.vimeoIcon} />}>
                                Vimeo
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="spotify"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('spotify')
                                }
                                icon={<span className={styles.spotifyIcon} />}>
                                Spotify
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="marvel"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('marvel')
                                }
                                icon={<span className={styles.marvelIcon} />}>
                                Marvel
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="soundcloud"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('soundcloud')
                                }
                                icon={
                                    <span className={styles.soundcloudIcon} />
                                }>
                                Soundcloud
                            </PlusMenuOption>

                            <PlusMenuOption
                                testId="codepen"
                                onClickAction={() =>
                                    this.props.onMenuItemClick('codepen')
                                }
                                icon={<span className={styles.codepenIcon} />}>
                                Codepen
                            </PlusMenuOption>
                        </ul>
                    </div>
                </div>
                <input
                    style={{ display: 'none' }}
                    type="file"
                    ref={this.uploadInputRef}
                    accept={this.state.currentMediaTypes}
                    onChange={this.onImageUploaderChange}
                />
                <div className={styles.scrollStop} />
            </React.Fragment>
        )
    }
}
