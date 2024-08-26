import GlobalNavigation from '@invisionapp/global-navigation'
import {
    Alert,
    Dialog,
    Illustration,
    Modal,
    Radio,
    Text,
    Toast
} from '@invisionapp/helios'
import SpaceHasBeenArchived from '@invisionapp/helios/illustrations/spot/space-has-been-archived.svg'
import cx from 'classnames'
import * as React from 'react'
import { RouteProps } from 'react-router-dom'
import TimeAgo from 'react-timeago'
import { AnyAction } from 'redux'
import analytics from '../../../analytics/analytics'
import { GLOBAL_NAVIGATION_ID, SHORTKEY } from '../../../constants/general'
import {
    ARCHIVE_NAVIGATION_COPY,
    DOCUMENT_HISTORY_NAVIGATION_COPY,
    PRODUCT_NAME,
    SAVE_PRESSED_COPY,
    THEMES_NAVIGATION_COPY
} from '../../../constants/messages'
import { types } from '../../../data/documentHistory/types'
import { NavigationMember } from '../../../data/members/interfaces'
import { BannerState, BannerType } from '../../../data/reducers/banner'
import { PermissionsState } from '../../../data/reducers/permissions'
import { ElementCoordinates } from '../../../interfaces/elementCoordinates'
import { keycodes } from '../../../interfaces/keycodes'
import { UnfollowMethod } from '../../../interfaces/unfollowMethod'
import { formatTime } from '../../../lib/utils'
import styles from './Navigation.module.css'

type Theme = 'system' | 'light' | 'dark'

interface Props extends RouteProps {
    banner: BannerState
    members: NavigationMember[]
    documentId: string
    title: string
    updatedAt: Date
    setElementCoordinates: (
        elementName: string,
        elementCoordinates: ElementCoordinates
    ) => AnyAction
    archiveDocument: (documentId: string) => Promise<void>
    subscribeToDocument: () => Promise<void>
    unsubscribeFromDocument: (unfollowMethod: UnfollowMethod) => Promise<void>
    permissions: PermissionsState
    bannerOffset: boolean
    archivedDocument: boolean
    isArchived: boolean
    updating: boolean
    isSubscribed: boolean
    navigationHeight: number
    showDocumentHistory: () => { type: types }
    canUseDocumentHistory: boolean
    canUseTheme: boolean
}

interface State {
    renderDialog: boolean
    renderAlert: boolean
    renderToast: boolean
    renderThemePicker: boolean
    savePressed: boolean
}

interface SettingsDropdown {
    type: 'default' | 'toggle' | 'divider'
    name: string
    action: string | (() => void)
    toggled?: boolean
    color?: string
}

class Navigation extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            renderDialog: false,
            renderAlert: false,
            renderToast: false,
            renderThemePicker: false,
            savePressed: false
        }
    }

    private _mediaQueryInterval: number

    private _mediaQuery = () => matchMedia('(prefers-color-scheme: dark)')

    componentDidUpdate(prevProps: Props, prevState: State) {
        if (prevProps.updating !== this.props.updating) {
            this.setState({ savePressed: false })
        }

        const theme = (localStorage.getItem('@rhombus/theme') ||
            'system') as Theme
        const rootEl = document.querySelector('html')!
        const radioEl = document.querySelector<HTMLInputElement>(
            `#theme-${theme}`
        )

        if (!prevProps.canUseTheme && this.props.canUseTheme) {
            import('../../../assets/css/DarkMode.module.css')

            if (radioEl) {
                radioEl.checked = true
            }
            this._initializeTheme(theme)
        }

        if (!this.props.canUseTheme) {
            clearInterval(this._mediaQueryInterval)
            rootEl.setAttribute('color-scheme', 'light')
        }
    }

    private _initializeTheme(theme: Theme) {
        const rootEl = document.querySelector('html')!

        if (theme === 'system') {
            rootEl.setAttribute(
                'color-scheme',
                this._mediaQuery().matches ? 'dark' : 'light'
            )
            this._setTheme(theme)
            this._mediaQueryInterval = setInterval(this._setTheme, 1000, theme)
        } else {
            clearInterval(this._mediaQueryInterval)
            this._setTheme(theme)
        }
    }

    private _setTheme = (theme: Theme) => {
        const rootEl = document.querySelector('html')!
        localStorage.setItem('@rhombus/theme', theme)

        if (theme !== 'system') {
            rootEl.setAttribute('color-scheme', theme)
        } else {
            rootEl.setAttribute(
                'color-scheme',
                this._mediaQuery().matches ? 'dark' : 'light'
            )
        }
    }

    componentDidMount() {
        window.addEventListener('keydown', this._savePagePressed)
    }

    componentWillUnmount() {
        window.removeEventListener('keydown', this._savePagePressed)
    }

    render() {
        const { canEdit, canComment } = this.props.permissions
        // Add settings to the global nav
        const settings: SettingsDropdown[] = [
            {
                type: 'default',
                name: 'Create New Doc',
                action: () => {
                    this.handleNewClick()
                }
            }
        ]
        if (this.props.isArchived === false && canEdit) {
            settings.push({
                type: 'default',
                name: ARCHIVE_NAVIGATION_COPY,
                action: () => {
                    this.handleArchive()
                }
            })
        }

        if (this.props.canUseDocumentHistory) {
            settings.push({
                type: 'default',
                name: DOCUMENT_HISTORY_NAVIGATION_COPY,
                action: () => {
                    this.props.showDocumentHistory()
                }
            })
        }

        if (this.props.canUseTheme) {
            settings.push({
                type: 'default',
                name: THEMES_NAVIGATION_COPY,
                action: () => {
                    this.setState({ renderThemePicker: true })
                }
            })
        }

        settings.push({
            type: 'toggle',
            name: this.props.isSubscribed ? 'Following' : 'Follow',
            action: this.toggleSubscribe,
            toggled: this.props.isSubscribed
        })

        const className = cx(styles.globalNavigation, styles.pageNavigation, {
            [styles.noPermissions]: !canEdit && !canComment,
            [styles.bannerOffset]: this.props.bannerOffset
        })

        let renderAlert
        if (this.state.renderAlert === true) {
            renderAlert = this._renderAlert(
                'danger',
                'There was an issue archiving your document.'
            )
        }

        let renderToast
        if (this.state.renderToast === true) {
            renderToast = this._renderToast(
                'success',
                'The document has been archived.'
            )
        }

        let archiveDialog
        if (this.state.renderDialog) {
            archiveDialog = this._renderArchiveDialog()
        }
        let lastEditText = (
            <React.Fragment>
                {'Last updated '}
                <TimeAgo
                    date={this.props.updatedAt}
                    formatter={(
                        value: number,
                        unit: string,
                        suffix: string,
                        date: Date
                    ) => formatTime(value, unit, suffix, date, 'just now')}
                />
                {this.state.savePressed ? SAVE_PRESSED_COPY.updated : ''}
            </React.Fragment>
        )
        if (this.props.updating) {
            const offlineBannerShown =
                this.props.banner.type === BannerType.TRYING_RECONNECT ||
                this.props.banner.type === BannerType.CONNECTION_LOST_WARN ||
                this.props.banner.type === BannerType.CONNECTION_LOST_ERROR
            lastEditText = (
                <React.Fragment>
                    {this.props.banner.type && offlineBannerShown
                        ? 'Updates pending'
                        : 'Updating...'}
                    {this.state.savePressed &&
                        !offlineBannerShown &&
                        SAVE_PRESSED_COPY.updating}
                </React.Fragment>
            )
        }

        return (
            <React.Fragment>
                <div
                    id={GLOBAL_NAVIGATION_ID}
                    className={className}
                    ref={(element) => {
                        element && this.getAndSetCoordinates(element)
                    }}>
                    {this.props.documentId && (
                        <GlobalNavigation
                            avatarColor="dark"
                            context="document"
                            documentType="rhombus"
                            documentID={this.props.documentId}
                            isDocument={true}
                            logoURL="/"
                            members={this.props.members}
                            settings={settings}
                            viewSpace={true}
                            title={this.props.title}
                            updatedAt={this.props.updatedAt}
                            lastEditText={lastEditText}
                        />
                    )}
                </div>
                {renderAlert}
                {renderToast}
                {archiveDialog}
                {this.props.canUseTheme && this._renderThemePicker()}
            </React.Fragment>
        )
    }

    private async handleNewClick() {
        return window.open('create', '_blank')
    }

    private handleArchive() {
        this.setState({ renderDialog: true })
    }

    private toggleSubscribe = () => {
        if (this.props.isSubscribed) {
            this.props.unsubscribeFromDocument('navigation')
        } else {
            this.props.subscribeToDocument()
        }
    }

    private _renderArchiveDialog() {
        return (
            <div className={styles.archiveDocument}>
                <Dialog
                    className={styles.archiveDocumentDialog}
                    closeOnEsc={true}
                    closeOnOverlay={true}
                    aria-label="Archive Document"
                    negativeText="Never Mind"
                    onRequestClose={() => {
                        this._closeDialog()
                    }}
                    onRequestPositive={() => {
                        this._doArchive()
                    }}
                    open={true}
                    positiveText="Archive">
                    <Illustration order="scene" size="larger">
                        <SpaceHasBeenArchived />
                    </Illustration>

                    <Text
                        className={styles.archiveDocumentLabel}
                        element="div"
                        order="title">
                        Are you sure?
                    </Text>

                    <Text
                        className={styles.archiveDocumentLabel}
                        element="div"
                        order="body">
                        If you archive this {PRODUCT_NAME}, nobody will be able
                        to access it until it's restored
                    </Text>
                </Dialog>
            </div>
        )
    }

    private _renderThemePicker() {
        const currentTheme = localStorage.getItem('@rhombus/theme') || 'system'
        const isShown = this.state.renderThemePicker

        return (
            <Modal
                maxWidth={300}
                className={cx({
                    [styles.themePicker]: !isShown,
                    [styles.themePickerOpen]: isShown
                })}
                closeOnEsc
                aria-label="Theme picker"
                open={isShown}
                onRequestClose={() =>
                    this.setState({ renderThemePicker: false })
                }>
                <form
                    data-testid="navigation__theme-form"
                    className={styles.themeForm}>
                    {
                        <Radio
                            className={styles.themeOption}
                            // @ts-ignore
                            isChecked={currentTheme === 'system'}
                            onChange={() => this._initializeTheme('system')}
                            data-testid="theme-system"
                            id="theme-system"
                            name="theme">
                            System Default
                        </Radio>
                    }
                    <Text
                        order="label"
                        size="smaller"
                        className={styles.themeLabel}>
                        The appearance for all text documents will sync
                        automatically with your device's settings.
                    </Text>
                    {
                        <Radio
                            className={styles.themeOption}
                            // @ts-ignore
                            isChecked={currentTheme === 'light'}
                            onChange={() => this._initializeTheme('light')}
                            data-testid="theme-light"
                            id="theme-light"
                            name="theme">
                            Light
                        </Radio>
                    }
                    {
                        <Radio
                            className={styles.themeOption}
                            // @ts-ignore
                            isChecked={currentTheme === 'dark'}
                            onChange={() => this._initializeTheme('dark')}
                            data-testid="theme-dark"
                            id="theme-dark"
                            name="theme">
                            Dark
                        </Radio>
                    }
                </form>
            </Modal>
        )
    }

    private _renderAlert = (
        status: 'danger',
        message: string,
        top: number = 0
    ) => {
        return (
            <Alert
                style={{
                    top: `${top}px`,
                    zIndex: 1
                }}
                className="alert"
                status={status}>
                {message}
            </Alert>
        )
    }

    private _renderToast = (
        status: 'success',
        message: string,
        placement: React.ComponentProps<
            typeof Toast
        >['placement'] = 'top-center'
    ) => {
        return (
            <Toast
                style={{
                    top: `90px`
                }}
                className="toast"
                status={status}
                placement={placement}>
                {message}
            </Toast>
        )
    }

    private _closeDialog() {
        this.setState({ renderDialog: false })
    }

    private async _doArchive() {
        const { documentId } = this.props
        await this.props.archiveDocument(documentId)

        analytics.track(analytics.DOCUMENT_ARCHIVED, {
            documentId,
            documentType: 'rhombus',
            documentContext: 'documents',
            archiveContext: 'nav'
        })

        if (this.props.archivedDocument) {
            this.setState({
                renderToast: true
            })
        } else {
            this.setState({
                renderAlert: true
            })
        }
    }

    private getAndSetCoordinates(element: Element) {
        const {
            top,
            right,
            bottom,
            left,
            width,
            height,
            x,
            y
        } = element.getBoundingClientRect() as DOMRect
        if (bottom !== this.props.navigationHeight) {
            this.props.setElementCoordinates('navigation', {
                top,
                right,
                bottom,
                left,
                width,
                height,
                x,
                y
            })
        }
    }

    private _savePagePressed = (event: KeyboardEvent) => {
        const which = event.which || event.keyCode
        const shortKey = event[SHORTKEY]
        if (shortKey && which === keycodes.S) {
            const { canEdit } = this.props.permissions
            event.preventDefault()
            if (canEdit) {
                this.setState({ savePressed: true })
            }
        }
    }
}

export default Navigation
