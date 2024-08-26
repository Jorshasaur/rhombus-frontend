import React from 'react'
import { SelectionState } from '../../../../data/reducers/selection'
import styles from './FloatingToolbar.module.css'
// Load the SVG icons. Loading them directly vs. file or url loader allows us to style them via css
import IconBodyText from '../../../../assets/images/icons/icon-body-text.svg'
import IconBold from '../../../../assets/images/icons/icon-bold.svg'
import IconBulletedList from '../../../../assets/images/icons/icon-bulleted-list.svg'
import IconCodeSnippet from '../../../../assets/images/icons/icon-code-snippet.svg'
import IconComment from '../../../../assets/images/icons/icon-comment.svg'
import IconHeadingOne from '../../../../assets/images/icons/icon-heading-1.svg'
import IconHeadingTwo from '../../../../assets/images/icons/icon-heading-2.svg'
import IconHeadingThree from '../../../../assets/images/icons/icon-heading-3.svg'
import IconItalic from '../../../../assets/images/icons/icon-italic.svg'
import IconLineDivider from '../../../../assets/images/icons/icon-line-divider.svg'
import IconLink from '../../../../assets/images/icons/icon-link.svg'
import IconOrderedList from '../../../../assets/images/icons/icon-ordered-list.svg'
import IconPullQuote from '../../../../assets/images/icons/icon-pull-quote.svg'
import IconStrikethrough from '../../../../assets/images/icons/icon-strikethrough.svg'
import IconToDoList from '../../../../assets/images/icons/icon-to-do-list.svg'
import IconUnderline from '../../../../assets/images/icons/icon-underline.svg'
import {
    CommentMarking,
    GlobalCommentMarkingModule
} from '../../../quill/modules/CommentMarking'
import { getEditor } from '../../../../QuillRegistry'
type FormatType = boolean | string | number | null

interface Props {
    formatSelection: (format: string, value: FormatType) => void
    selection: SelectionState
    insertLink: Function
    onDividerClick: Function
    canEdit: boolean
    canComment: boolean
    scrollTop: number
    navigationHeight: number
}

enum SelectionDirection {
    UP,
    DOWN
}

interface Offset {
    top: number
    left: number
}

interface State {
    floatingToolbarDropdownOpen: boolean
    mounted: boolean
    width: number
    selectionDirection: SelectionDirection
    offset: Offset
}

const TOP_OFFSET = 60
const BOTTOM_OFFSET = 10
const TABLE_OFFSET = 30

export default class FloatingToolbar extends React.Component<Props, State> {
    underline = this.createFormat('underline')
    strike = this.createFormat('strike')
    italic = this.createFormat('italic')
    bold = this.createFormat('bold')
    bodyText = this.createFormat('header', null)
    h1 = this.createFormat('header', 1)
    h2 = this.createFormat('header', 2)
    h3 = this.createFormat('header', 3)
    unordered = this.createFormat('list', 'unordered')
    ordered = this.createFormat('list', 'ordered')
    unchecked = this.createFormat('list', 'unchecked')
    codeblock = this.createFormat('codeBlock', true)
    blockquote = this.createFormat('blockquote', true)

    constructor(props: Props) {
        super(props)

        this.state = {
            floatingToolbarDropdownOpen: false,
            mounted: false,
            width: 0,
            selectionDirection: this.getSelectionDirection(),
            offset: this.getOffset(props)
        }
    }

    getOffset(props: Props) {
        const { selection, navigationHeight } = props

        if (selection.mainEditor) {
            return {
                top: 0,
                left: 0
            }
        }

        const quill = getEditor(selection.editorId!)
        if (!quill) {
            return {
                top: 0,
                left: 0
            }
        }

        let el: HTMLElement | null = quill.container
        let offsetTop: number = 0

        while (el) {
            if (el.id.startsWith('portal-')) {
                break
            }
            offsetTop += el.offsetTop
            el = el.parentElement
        }

        return {
            top: offsetTop - navigationHeight - TABLE_OFFSET,
            left: quill.container.offsetLeft
        }
    }

    getSelectionDirection() {
        const selection = document.getSelection()
        if (selection != null) {
            let position = 0
            if (selection.anchorNode != null && selection.focusNode != null) {
                position = selection.anchorNode.compareDocumentPosition(
                    selection.focusNode
                )
            }

            if (
                (!position && selection.anchorOffset < selection.focusOffset) ||
                position === Node.DOCUMENT_POSITION_FOLLOWING
            ) {
                return SelectionDirection.DOWN
            }
        }
        return SelectionDirection.UP
    }

    componentDidMount() {
        // Set the state to mounted on load. This applies the class 'mounted' to the toolbar and
        // fades the element in via css animations
        this.setState({ mounted: true })
    }
    componentWillReceiveProps(nextProps: Props) {
        // If the selection changes, close the dropdown and reposition the toolbar
        if (
            this.props.selection.left !== nextProps.selection.left ||
            this.props.selection.top !== nextProps.selection.top ||
            this.props.selection.width !== nextProps.selection.width ||
            this.props.selection.index !== nextProps.selection.index ||
            this.props.selection.selectionLength !==
                nextProps.selection.selectionLength
        ) {
            this.setState({
                floatingToolbarDropdownOpen: false,
                selectionDirection: this.getSelectionDirection(),
                offset: this.getOffset(nextProps)
            })
        }
    }

    private _createComment = async (e: React.MouseEvent) => {
        e.preventDefault()
        const { selection } = this.props
        const quill = getEditor(selection.editorId!)

        if (!quill) {
            return
        }

        const commentMarking = quill.getModule(CommentMarking.moduleName)

        const id = commentMarking.create(
            selection.index!,
            selection.selectionLength!,
            selection.selectionType
        )
        setImmediate(() => {
            GlobalCommentMarkingModule.select(id)
        })
    }

    createFormat(format: string, value?: FormatType) {
        return (e: React.MouseEvent<HTMLElement>) => {
            e.preventDefault()

            let formatValue = value

            if (formatValue === undefined) {
                formatValue = !this.props.selection[format]
            }

            this.formatSelection(format, formatValue)
        }
    }

    insertLink = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        this.props.insertLink()
    }

    divider = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        this.props.onDividerClick()
    }

    handleToggleDropdown = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        this.toggleDropdown()
    }

    render() {
        const { selection, canEdit, canComment, scrollTop } = this.props
        const { offset } = this.state

        const leftPosition =
            offset.left +
            selection.left! -
            this.state.width / 2 +
            selection.width! / 2

        let { top, bottom } = selection as { top: number; bottom: number }

        let topPosition

        top += offset.top
        bottom += offset.top

        if (
            top > scrollTop + TOP_OFFSET &&
            this.state.selectionDirection === SelectionDirection.UP
        ) {
            topPosition = top - TOP_OFFSET
        } else {
            topPosition = bottom + BOTTOM_OFFSET
        }

        return (
            <div
                id="floating-toolbar"
                data-testid="floating-toolbar"
                style={{
                    left: leftPosition < 0 ? '0px' : leftPosition + 'px',
                    top: topPosition + 'px'
                }}
                className={`
                    ${styles.floatingToolbar}
                    ${this.state.mounted ? styles.mounted : ''}
                    ${!canEdit && canComment ? styles.commentOnly : ''}
                    `}
                ref={(element) => {
                    this.getToolbarWidth(element)
                }}>
                {canEdit && (
                    <ul
                        className={`${styles.floatingToolbarDropdown}
                            ${
                                this.state.floatingToolbarDropdownOpen
                                    ? styles.floatingToolbarDropdownOpen
                                    : ''
                            }
                        `}>
                        <li
                            className={`${styles.floatingToolbarDropdownToggle}
                                ${
                                    !selection.header &&
                                    !selection.list &&
                                    !selection.codeBlock &&
                                    !selection.blockquote
                                        ? ''
                                        : styles.active
                                }`}>
                            <button onMouseDown={this.handleToggleDropdown}>
                                {this.getCurrentStyle()}
                            </button>
                        </li>
                        <li
                            className={`${styles.floatingToolbarDropdownItem}
                                ${
                                    !selection.header &&
                                    !selection.list &&
                                    !selection.codeBlock &&
                                    !selection.blockquote
                                        ? styles.active
                                        : ''
                                }`}
                            data-testid="format-paragraph">
                            <button onMouseDown={this.bodyText}>
                                <div className={styles.buttonIcon}>
                                    <IconBodyText />
                                </div>{' '}
                                Body Text
                            </button>
                        </li>
                        <li className={styles.listDivider} />
                        <li
                            className={`${styles.floatingToolbarDropdownItem} ${
                                selection.header === 1 ? styles.active : ''
                            }`}
                            data-testid="format-h1">
                            <button onMouseDown={this.h1}>
                                <div className={styles.buttonIcon}>
                                    <IconHeadingOne />
                                </div>
                                Heading 1
                                <div className={styles.buttonKeyboardHint}>
                                    #
                                </div>
                            </button>
                        </li>
                        <li
                            className={`${styles.floatingToolbarDropdownItem} ${
                                selection.header === 2 ? styles.active : ''
                            }`}
                            data-testid="format-h2">
                            <button onMouseDown={this.h2}>
                                <div className={styles.buttonIcon}>
                                    <IconHeadingTwo />
                                </div>
                                Heading 2
                                <div className={styles.buttonKeyboardHint}>
                                    ##
                                </div>
                            </button>
                        </li>
                        <li
                            className={`${styles.floatingToolbarDropdownItem} ${
                                selection.header === 3 ? styles.active : ''
                            }`}
                            data-testid="format-h3">
                            <button onMouseDown={this.h3}>
                                <div className={styles.buttonIcon}>
                                    <IconHeadingThree />
                                </div>
                                Heading 3
                                <div className={styles.buttonKeyboardHint}>
                                    ###
                                </div>
                            </button>
                        </li>
                        <li className={styles.listDivider} />
                        <li
                            className={`${styles.floatingToolbarDropdownItem}
                            ${
                                selection.list === 'unordered'
                                    ? styles.active
                                    : ''
                            }`}
                            data-testid="format-unordered-list">
                            <button onMouseDown={this.unordered}>
                                <div className={styles.buttonIcon}>
                                    <IconBulletedList />
                                </div>
                                Bulleted List
                                <div className={styles.buttonKeyboardHint}>
                                    *
                                </div>
                            </button>
                        </li>
                        <li
                            className={`${styles.floatingToolbarDropdownItem} ${
                                selection.list === 'ordered'
                                    ? styles.active
                                    : ''
                            }`}
                            data-testid="format-ordered-list">
                            <button onMouseDown={this.ordered}>
                                <div className={styles.buttonIcon}>
                                    <IconOrderedList />
                                </div>
                                Ordered List
                                <div className={styles.buttonKeyboardHint}>
                                    1.
                                </div>
                            </button>
                        </li>
                        <li
                            className={`${styles.floatingToolbarDropdownItem}
                            ${
                                selection.list === 'unchecked'
                                    ? styles.active
                                    : ''
                            }`}
                            data-testid="format-todo-list">
                            <button onMouseDown={this.unchecked}>
                                <div className={styles.buttonIcon}>
                                    <IconToDoList />
                                </div>
                                To-do List
                                <div className={styles.buttonKeyboardHint}>
                                    []
                                </div>
                            </button>
                        </li>
                        <li className={styles.listDivider} />
                        {selection.mainEditor && (
                            <li
                                className={styles.floatingToolbarDropdownItem}
                                data-testid="format-line-divider">
                                <button onMouseDown={this.divider}>
                                    <div className={styles.buttonIcon}>
                                        <IconLineDivider />
                                    </div>
                                    Line Divider
                                    <div className={styles.buttonKeyboardHint}>
                                        ---
                                    </div>
                                </button>
                            </li>
                        )}
                        <li
                            className={`${styles.floatingToolbarDropdownItem} ${
                                selection.codeBlock ? styles.active : ''
                            }`}
                            data-testid="format-code-snippet">
                            <button onMouseDown={this.codeblock}>
                                <div className={styles.buttonIcon}>
                                    <IconCodeSnippet />
                                </div>
                                Code Snippet
                                <div className={styles.buttonKeyboardHint}>
                                    ```
                                </div>
                            </button>
                        </li>
                        <li
                            className={`${styles.floatingToolbarDropdownItem} ${
                                selection.blockquote ? styles.active : ''
                            }`}
                            data-testid="format-blockquote">
                            <button onMouseDown={this.blockquote}>
                                <div className={styles.buttonIcon}>
                                    <IconPullQuote />
                                </div>
                                Pull Quote
                                <div className={styles.buttonKeyboardHint}>
                                    >
                                </div>
                            </button>
                        </li>
                    </ul>
                )}
                {canEdit && (
                    <div className={styles.floatingToolbarInlineDivider} />
                )}
                {canEdit && (
                    <button
                        className={`${styles.floatingToolbarInlineButton} ${
                            selection.bold ? styles.active : ''
                        }`}
                        onMouseDown={this.bold}>
                        <IconBold /> Bold
                    </button>
                )}
                {canEdit && (
                    <button
                        className={`${styles.floatingToolbarInlineButton} ${
                            selection.italic ? styles.active : ''
                        }`}
                        onMouseDown={this.italic}>
                        <IconItalic /> Italic
                    </button>
                )}
                {canEdit && (
                    <button
                        className={`${styles.floatingToolbarInlineButton} ${
                            selection.underline ? styles.active : ''
                        }`}
                        onMouseDown={this.underline}>
                        <IconUnderline /> Underline
                    </button>
                )}
                {canEdit && (
                    <button
                        className={`${styles.floatingToolbarInlineButton} ${
                            selection.strike ? styles.active : ''
                        }`}
                        onMouseDown={this.strike}>
                        <IconStrikethrough /> Strike
                    </button>
                )}
                {canEdit && (
                    <button
                        className={`${styles.floatingToolbarInlineButton} ${
                            selection.link ? styles.active : ''
                        }`}
                        onMouseDown={this.insertLink}>
                        <IconLink /> Link
                    </button>
                )}
                {canComment && (
                    <button
                        className={styles.floatingToolbarCommentButton}
                        onMouseDown={this._createComment}>
                        <IconComment /> Comment
                    </button>
                )}
            </div>
        )
    }
    // Get the text to display in the dropdown toggle button based on the current selection's style
    private getCurrentStyle = () => {
        const { selection } = this.props
        if (
            !selection.header &&
            !selection.list &&
            !selection.codeBlock &&
            !selection.blockquote
        ) {
            return 'Body Text'
        } else if (selection.header) {
            return `Heading ${selection.header}`
        } else if (selection.list) {
            switch (selection.list) {
                case 'unordered':
                    return 'Bulleted List'
                case 'ordered':
                    return 'Ordered List'
                case 'unchecked':
                case 'checked':
                    return 'To-do List'
                default:
                    return 'Bulleted List'
            }
        } else if (selection.codeBlock) {
            return 'Code Snippet'
        } else if (selection.blockquote) {
            return 'Pull Quote'
        }
        return 'Body Text'
    }
    private getToolbarWidth = (element: HTMLElement | null) => {
        // Only update state if necessary
        element &&
            this.setState((prevState) => {
                if (prevState.width !== element.getBoundingClientRect().width) {
                    return { width: element.getBoundingClientRect().width }
                }
                return null
            })
    }
    // Toggle the visibility of the toolbar's dropdown
    // If a value is passed in, will set to that value
    private toggleDropdown = (
        dropdownState = !this.state.floatingToolbarDropdownOpen
    ) => {
        this.setState({ floatingToolbarDropdownOpen: dropdownState })
    }
    // Dispatch action to set selection of text to the format selected in the dropdown
    private formatSelection = (format: string, value: FormatType) => {
        this.setState({ floatingToolbarDropdownOpen: false })
        this.props.formatSelection(format, value)
    }
}
