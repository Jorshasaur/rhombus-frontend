import React from 'react'
import styles from './EmbedModal.module.css'
import { Close } from '@invisionapp/helios/icons'
import ReactDOM from 'react-dom'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { ErrorBoundary } from '../../../../bugsnag'

function invariant(predicate: boolean, message: string) {
    if (process.env.NODE_ENV !== 'production') {
        if (!predicate) {
            console.error(message)
        }
    }
}

export interface EmbedModalProps {
    actionArea?: React.ReactNode
    children: React.ReactNode
    onHide: (event: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
}

interface State {
    isMounted: boolean
    isShown: boolean
}

/**
 * This is not a normal React component, but a static singleton that must be used
 * via its public static methods. It is used by mounting it with specific data, and
 * then even when the "parent" component unmounts, the EmbedModal remains open and
 * unaffected until it is explicitly unmounted.
 *
 * In a Quill context, blots are often deleted and inserted which means any child components
 * are deleted and recreated (not just updated) all the time, and the modal needs to persist
 * those changes.
 *
 * Here is an example:
 * ```tsx
 * class NeatComponent extends React.Component {
 *   componentDidMount() {
 *     EmbedModal.mount()
 *   }
 *
 *   getEmbedModalData = (): EmbedModalProps => ({
 *     onHide: (event) => this.handleModalClose(event),
 *     actionArea: <a>Open in new tab...</a>,
 *     children: <iframe src='http://google.com' />
 *   })
 *
 *   handleModalOpen = () => {
 *     EmbedModal.show(this.getEmbedModalData())
 *   }
 *
 *   handleModalClose = () => {
 *     EmbedModal.unmount()
 *   }
 *
 *   render() {
 *     return <button onClick={this.handleModalOpen}>open modal</button>
 *   }
 * }
 * ```
 */
export class EmbedModal extends React.Component<Partial<EmbedModalProps>> {
    static defaultProps = {
        onHide: () => undefined
    }
    private static root: HTMLDivElement = document.createElement('div')
    private static state: State = {
        isMounted: false,
        isShown: false
    }
    private static props: Partial<EmbedModalProps> = {}

    /**
     * Initialize the modal and prepare it to be shown. This method does *not*
     * actually show the modal, but just attaches the content to the DOM ahead of time
     * so that it is animatable when it opens. This only really needs to be done once.
     */
    public static mount() {
        if (!EmbedModal.state.isMounted) {
            EmbedModal.setState({
                isMounted: true,
                isShown: false
            })
            EmbedModal.render()
        }
    }

    /**
     * Once the modal is mounted, call `EmbedModal.show()` to make it open. This
     * will typically happen as a result of a button click or something similar.
     *
     * @param props the content to hydrate the modal with
     */
    public static show(props: EmbedModalProps) {
        invariant(
            EmbedModal.state.isMounted,
            `Warning: you are trying to call EmbedModal.show, but EmbedModal.mount must be called first and it wasn't. The modal will not work correctly before it is mounted.`
        )

        if (EmbedModal.state.isMounted) {
            EmbedModal.props = props
            EmbedModal.setState({ isShown: true })
            EmbedModal.render()
        }
    }

    /**
     * A utility method to determine whether the modal is currently open or not.
     */
    public static isShown() {
        return EmbedModal.state.isShown
    }

    /**
     * For when you need to update any props since the modal was mounted
     * @param props any props that need to be updated
     */
    public static update(props: Partial<EmbedModalProps>) {
        EmbedModal.props = { ...EmbedModal.props, ...props }
    }

    /**
     * This method will close the modal. *Note*: this does not remove the nodes from
     * the DOM, because otherwise you would have to mount it again before you could open it.
     */
    public static hide() {
        if (EmbedModal.state.isMounted && EmbedModal.isShown()) {
            EmbedModal.setState({ isShown: false })
            EmbedModal.render()
        }
    }

    /**
     * Call `unmount` to completely remove the modal content from the DOM. *Note*: You probably
     * do _not_ want to call this in the parent's `componentWillUnmount` because then it will be
     * removed from the DOM when a Quill blot gets deleted/inserted.
     */
    public static unmount() {
        if (EmbedModal.state.isMounted) {
            EmbedModal.setState({ isMounted: false })
            EmbedModal.hide()
            setTimeout(() => {
                ReactDOM.unmountComponentAtNode(EmbedModal.root)
            }, 500)
        }
    }

    /**
     * This private method acts similarly to `React.createPortal` except it decouples
     * the rendered modal from the parent's lifecycle.
     */
    private static render() {
        ReactDOM.render(
            <ErrorBoundary>
                <EmbedModal {...EmbedModal.props} />
            </ErrorBoundary>,
            EmbedModal.root
        )
    }

    private static setState(state: Partial<State>) {
        EmbedModal.state = { ...EmbedModal.state, ...state }
    }

    private constructor(props: EmbedModalProps) {
        super(props)
        if (!document.querySelector('#embed-modal')) {
            EmbedModal.root.id = 'embed-modal'
            document.body.appendChild(EmbedModal.root)
        }
    }

    render() {
        return (
            <ThemeProvider theme={theme}>
                <div
                    className={
                        EmbedModal.isShown()
                            ? styles.backdropVisible
                            : styles.backdrop
                    }>
                    <div className={styles.modal}>
                        <div className={styles.closeButtonContainer}>
                            <a
                                onClick={this.props.onHide}
                                className={styles.closeButton}
                                data-testid="embed-modal__close-button">
                                <Close fill="white" size={24} />
                            </a>
                        </div>
                        <div className={styles.actionArea}>
                            {this.props.actionArea}
                        </div>
                        <div
                            className={
                                EmbedModal.isShown()
                                    ? styles.bodyVisible
                                    : styles.body
                            }>
                            {EmbedModal.isShown() && this.props.children}
                        </div>
                    </div>
                </div>
            </ThemeProvider>
        )
    }
}
