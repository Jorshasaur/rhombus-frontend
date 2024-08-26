import cx from 'classnames'
import PubSub from 'pubsub-js'
import React, {
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef
} from 'react'
import { DndProvider } from 'react-dnd'
import ReactDndHTML5Backend from 'react-dnd-html5-backend'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../../../constants/topics'
import {
    ColumnSizeUpdate,
    PaneElement
} from '../../../../../../data/panes/Advil'
import {
    useConditionalEventListener,
    useEventListener
} from '../../../../../../hooks/useEventListener'
import { keycodes } from '../../../../../../interfaces/keycodes'
import { useColumnGridStyle } from '../hooks/useColumnGridStyle'
import { useTableManipulations } from '../hooks/useTableManipulations'
import { TableContext } from '../PaneEmbed'
import { PaneEmbedContext } from '../PaneEmbedContext'
import { ColumnMenu } from './ColumnMenu/ColumnMenu'
import { DraggingType } from './Dragging'
import { RowDragLine } from './Dragging/RowDragLine'
import DragPreviewLayer from './DragPreviewLayer'
import { PaneRow } from './PaneRow/PaneRow'
import styles from './PaneTable.module.css'

enum MOVING_DIRECTION {
    LEFT = 'left',
    RIGHT = 'right'
}

export function PaneTable() {
    const {
        advil,
        columnWidths,
        setColumnWidth,
        metadata,
        isActive,
        dragging,
        highlightedColumn,
        lists,
        highlightedRow,
        resizingColumn,
        setResizingColumn
    } = useContext(TableContext)
    const { setEmbedDataValue, uuid } = useContext(PaneEmbedContext)

    const {
        setTableStyleLocally,
        columnCount,
        removeColumn,
        addColumn,
        removeRow,
        addRow,
        dragColumnRight,
        dragColumnLeft
    } = useTableManipulations()

    const tableRef = useRef<HTMLDivElement>(null)
    const tableContainerRef = useRef<HTMLDivElement>(null)
    const isDraggingRow = useMemo<boolean>(
        () =>
            !!dragging &&
            dragging.type === DraggingType.Row &&
            dragging.hoveredRowIndex != null,
        [dragging]
    )

    const rowIds = useMemo(() => lists.map((list) => list.id), [lists])

    const handleKeydown = useCallback(
        (event: KeyboardEvent) => {
            if (
                (event.keyCode === keycodes.Delete ||
                    event.keyCode === keycodes.Backspace) &&
                isActive &&
                highlightedColumn !== null
            ) {
                removeColumn(highlightedColumn)
            } else if (
                event.keyCode === keycodes.Enter &&
                isActive &&
                highlightedColumn !== null
            ) {
                const insertionPoint = highlightedColumn + 1
                addColumn(insertionPoint)
            } else if (
                (event.keyCode === keycodes.Delete ||
                    event.keyCode === keycodes.Backspace) &&
                isActive &&
                highlightedRow !== null
            ) {
                const highlightedRowId = rowIds[highlightedRow]
                removeRow(highlightedRowId)
            } else if (
                event.keyCode === keycodes.Enter &&
                isActive &&
                highlightedRow !== null
            ) {
                const insertionPoint = highlightedRow + 1
                addRow(insertionPoint)
            }
        },
        [
            highlightedColumn,
            isActive,
            removeColumn,
            addColumn,
            addRow,
            removeRow,
            highlightedRow,
            rowIds
        ]
    )

    useEventListener(document, 'keydown', handleKeydown)

    const onColumnResize = useCallback(
        (event: MouseEvent) => {
            if (event.movementX !== 0 && tableContainerRef.current) {
                const movingDirection: MOVING_DIRECTION =
                    event.movementX > 0
                        ? MOVING_DIRECTION.RIGHT
                        : MOVING_DIRECTION.LEFT
                if (movingDirection === MOVING_DIRECTION.RIGHT) {
                    dragColumnRight(
                        tableContainerRef.current.offsetWidth,
                        event.movementX
                    )
                } else if (movingDirection === MOVING_DIRECTION.LEFT) {
                    dragColumnLeft(
                        tableContainerRef.current.offsetWidth,
                        event.movementX
                    )
                }
                PubSub.publish(DOCUMENT_CHANGE_REPOSITION, false)
            }
        },
        [dragColumnRight, dragColumnLeft]
    )

    // Add and listen to drag events only when resizingColumn !== null
    useConditionalEventListener(
        tableContainerRef.current,
        'mousemove',
        onColumnResize,
        resizingColumn !== null
    )

    const onResizeMouseUp = useCallback(() => {
        if (resizingColumn !== null && setResizingColumn && setEmbedDataValue) {
            const columnSizes: ColumnSizeUpdate = []
            columnWidths?.forEach((width, columnIndex) => {
                columnSizes.push([columnIndex, width])
            })
            advil?.editColumnSizes(columnSizes)
            setResizingColumn(null)
        }
    }, [
        advil,
        columnWidths,
        resizingColumn,
        setEmbedDataValue,
        setResizingColumn
    ])

    useConditionalEventListener(
        document,
        'mouseup',
        onResizeMouseUp,
        resizingColumn !== null
    )

    // Update metadata on load, and when it is updated from another client
    useEffect(() => {
        if (metadata && metadata.columnSizes && setColumnWidth) {
            const columnSizes = metadata.columnSizes

            Object.keys(columnSizes).forEach((key) => {
                const width = columnSizes[key]
                setColumnWidth(key, width)
            })
            setTableStyleLocally()
        }
    }, [metadata, setTableStyleLocally, setColumnWidth])

    const columnGridStyle = useColumnGridStyle(columnCount)
    return (
        <DndProvider backend={ReactDndHTML5Backend}>
            <div
                id={`table-container-${uuid}`}
                className={cx(styles.tableContainer, {
                    [styles.tableActive]: isActive,
                    [styles.resizing]: resizingColumn !== null
                })}
                style={
                    {
                        '--column-grid-style': columnGridStyle
                    } as React.CSSProperties
                }
                ref={tableContainerRef}>
                <ColumnMenu rowIds={rowIds} />
                {dragging?.dragging && <DragPreviewLayer dragging={dragging} />}
                <div
                    className={styles.tableGrid}
                    ref={tableRef}
                    data-testid="table-grid">
                    {isDraggingRow && (
                        <RowDragLine
                            hoveredRowIndex={dragging!.hoveredRowIndex!}
                        />
                    )}
                    {lists.map((row, index) => {
                        const elements = row.elements as PaneElement[]
                        return (
                            <PaneRow
                                key={row.id}
                                rowId={row.id}
                                elements={elements}
                                rowIndex={index}
                            />
                        )
                    })}
                </div>
            </div>
        </DndProvider>
    )
}
