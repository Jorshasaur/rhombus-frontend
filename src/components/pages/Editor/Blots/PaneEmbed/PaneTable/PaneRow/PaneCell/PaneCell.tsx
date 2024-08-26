import cx from 'classnames'
import { Sources } from 'quill'
import { DeltaStatic } from 'quill-delta'
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState
} from 'react'
import { useDrop } from 'react-dnd'
import { DEFAULT_QUILL_MODULE_OPTIONS } from '../../../../../../../../constants/defaultQuillOptions'
import { COMMENT_MARKING_MODULE_NAME } from '../../../../../../../../constants/quill-modules'
import { getUserId } from '../../../../../../../../data/members/selectors'
import { PaneElement } from '../../../../../../../../data/panes/Advil'
import store from '../../../../../../../../data/store'
import { useCustomQuillInstance } from '../../../../../../../../hooks/useCustomQuillInstance'
import { getPaneEditorId } from '../../../../../../../../QuillRegistry'
import QuillEvents from '../../../../../../../quill/modules/QuillEvents'
import QuillSources from '../../../../../../../quill/modules/QuillSources'
import { TableContext } from '../../../PaneEmbed'
import { PaneEmbedContext } from '../../../PaneEmbedContext'
import { DraggingType } from '../../Dragging'
import * as draggingActions from '../../Dragging/actions'
import styles from '../../PaneTable.module.css'
import TableDragItemType from '../../TableDragItemType'

export function PaneCell(props: {
    paneId: string
    cellIndex: number
    rowIndex: number
    onTextChange: (delta: DeltaStatic) => void
    element: PaneElement
}) {
    const [initiated, setInitiated] = useState(false)
    const { uuid: embedId } = useContext(PaneEmbedContext)
    const { paneId } = props
    const elementId = props.element.id
    const editorId = useMemo(() => getPaneEditorId(paneId, elementId), [
        elementId,
        paneId
    ])

    const quillOptions = useMemo(() => {
        const userId = getUserId(store.getState())
        return {
            modules: {
                ...DEFAULT_QUILL_MODULE_OPTIONS,
                authorship: {
                    enabled: true,
                    authorId: userId
                },
                keyboard: {
                    editorId,
                    emoji: {
                        picker: true,
                        shortcode: true
                    },
                    mentions: true,
                    markdown: {
                        header: true,
                        bold: true,
                        code: true,
                        divider: false,
                        strike: true,
                        italic: true,
                        link: true,
                        codeBlock: true,
                        list: true,
                        underline: true,
                        blockquote: true
                    }
                },
                clipboard: {
                    matchVisual: false,
                    handleEmbeds: false,
                    pane: true,
                    editorId
                },
                toolbar: true,
                history: {
                    userOnly: true,
                    documentId: paneId,
                    ignoreClear: true // this prevents individual pane cell quill instance to clear whole Pane undo stack
                },
                emoji: true,
                'emoji-picker-manager': {
                    enabled: true,
                    editorId
                },
                'mentions-manager': {
                    editorId
                },
                'selection-manager': {
                    enabled: true,
                    editorId,
                    embedId
                },
                [COMMENT_MARKING_MODULE_NAME]: true
            },
            theme: 'snow'
        }
    }, [editorId, paneId, embedId])

    const [editorRef, quillInstance] = useCustomQuillInstance(
        editorId,
        quillOptions,
        false
    )
    const {
        highlightedRow,
        highlightedColumn,
        setTableCellSelection,
        setActiveCell,
        activeCell,
        isActive,
        draggingDispatch,
        dragging,
        drop
    } = useContext(TableContext)
    const { onTextChange, rowIndex, cellIndex } = props
    const { value, id } = props.element

    const sendUpdates = useCallback(
        (contents: DeltaStatic, _oldContents: DeltaStatic, source: Sources) => {
            if (source === QuillSources.USER) {
                onTextChange(contents)
            }
        },
        [onTextChange]
    )

    // Set initial Quill contents
    // Set up watcher to send edits to Advil
    useEffect(() => {
        if (!initiated && quillInstance) {
            setInitiated(true)

            quillInstance.setContents(value as DeltaStatic, QuillSources.API)
            quillInstance.on(QuillEvents.TEXT_CHANGE, sendUpdates)
        }
    }, [initiated, value, quillInstance, sendUpdates])

    const isHighlighted = useMemo(
        () => highlightedRow === rowIndex || highlightedColumn === cellIndex,
        [highlightedRow, highlightedColumn, rowIndex, cellIndex]
    )

    const [, dropRef] = useDrop({
        accept: TableDragItemType,
        hover: (item, monitor) => {
            if (
                dragging?.hoveredRowIndex !== rowIndex ||
                dragging?.hoveredCellIndex !== cellIndex
            ) {
                draggingDispatch!(draggingActions.hover(rowIndex, cellIndex))
            }
        },
        drop: () => {
            drop!(rowIndex, cellIndex)
        }
    })

    const isDragging =
        (dragging?.type === DraggingType.Row &&
            dragging.rowIndex === rowIndex) ||
        (dragging?.type === DraggingType.Column &&
            dragging.cellIndex === cellIndex)

    return (
        <div
            ref={dropRef}
            onClick={() => {
                if (setActiveCell) {
                    setActiveCell(id)
                }
                if (setTableCellSelection) {
                    setTableCellSelection(null)
                }
            }}
            className={cx(styles.tableCell, {
                [styles.active]: id === activeCell && isActive,
                [styles.highlighted]: isHighlighted && isActive,
                [styles.dragging]: isDragging
            })}>
            <div
                data-editor-id={editorId}
                data-embed-id={embedId}
                className={cx(styles.paneEditor, 'ql-snow', 'ql-container')}
                ref={editorRef}
            />
        </div>
    )
}
