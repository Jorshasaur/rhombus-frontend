import { Menu } from '@invisionapp/helios'
import cx from 'classnames'
import React, { useContext, useEffect, useMemo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import IconTableSelect from '../../../../../../../../assets/images/icons/icon-table-select.svg'
import { useTableManipulations } from '../../../hooks/useTableManipulations'
import { TableContext } from '../../../PaneEmbed'
import { PaneEmbedContext } from '../../../PaneEmbedContext'
import { DraggingType } from '../../Dragging'
import { endDragging, hover, startDraggingRow } from '../../Dragging/actions'
import styles from '../../PaneTable.module.css'
import TableDragItemType from '../../TableDragItemType'

const COLUMN_INDEX = -1
const MINIMUM_ROWS = 1

export function RowMenu(props: { rowIndex: number; rowId: string }) {
    const { rowIndex, rowId } = props

    const { addRow, removeRow, rowCount } = useTableManipulations()

    const {
        highlightedRow,
        tableCellSelection,
        setTableCellSelection,
        draggingDispatch,
        setActiveCell,
        dragging,
        drop
    } = useContext(TableContext)

    const { selectBlot } = useContext(PaneEmbedContext)

    const isHighlighted = useMemo(() => highlightedRow === rowIndex, [
        highlightedRow,
        rowIndex
    ])

    const [{ isDragging }, drag, connectDragPreview] = useDrag({
        item: { type: TableDragItemType },
        begin: () => {
            setActiveCell!(null)
            draggingDispatch!(startDraggingRow(rowIndex))
        },
        end: (_item, monitor) => {
            // If drag ends outside of component, use the last position to drop
            if (
                !monitor.didDrop() &&
                dragging?.hoveredRowIndex &&
                dragging?.type === DraggingType.Row
            ) {
                drop!(dragging.hoveredRowIndex, COLUMN_INDEX)
            }
            draggingDispatch!(endDragging())
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging()
        })
    })

    useEffect(() => {
        connectDragPreview(getEmptyImage())
    })

    const [, dropRef] = useDrop({
        accept: TableDragItemType,
        hover: () => {
            if (
                dragging?.hoveredRowIndex !== rowIndex ||
                dragging?.hoveredCellIndex !== COLUMN_INDEX
            ) {
                draggingDispatch!(hover(rowIndex, COLUMN_INDEX))
            }
        },
        drop: () => {
            drop!(rowIndex, COLUMN_INDEX)
        }
    })

    const showMenu = useMemo(
        () =>
            tableCellSelection?.type === 'row' &&
            tableCellSelection.index === rowIndex &&
            tableCellSelection.menu &&
            isHighlighted,
        [tableCellSelection, isHighlighted, rowIndex]
    )

    const menuItems = useMemo(() => {
        const items = [
            {
                'data-testid': 'add-row-above',
                type: 'item' as 'item',
                label: 'Insert 1 above',
                onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault()
                    addRow(rowIndex)
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }
            },
            {
                'data-testid': 'add-row-below',
                type: 'item' as 'item',
                label: 'Insert 1 below',
                onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault()
                    addRow(rowIndex + 1)
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }
            }
        ]
        if (rowCount > MINIMUM_ROWS) {
            items.push({
                'data-testid': 'remove-row',
                type: 'item' as 'item',
                label: 'Delete row',
                onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault()
                    removeRow(rowId)
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }
            })
        }
        return items
    }, [addRow, removeRow, rowCount, rowId, rowIndex, setTableCellSelection])

    return (
        <div
            className={cx(
                styles.tableCell,
                styles.menuCell,
                styles.rowMenuCell,
                {
                    [styles.highlighted]: isHighlighted,
                    [styles.dragging]: isDragging,
                    [styles.first]: rowIndex === 0,
                    [styles.last]: rowIndex + 1 === rowCount
                }
            )}
            ref={dropRef}
            onClick={() => {
                if (setTableCellSelection) {
                    setTableCellSelection({
                        menu: false,
                        type: 'row',
                        index: rowIndex
                    })
                }
            }}>
            <button
                ref={drag}
                data-keep-focus="true"
                data-testid="table-row-drag-button"
                className={cx(styles.tableMenuButton, styles.rowMenu)}
                onDoubleClick={(event) => {
                    if (selectBlot) {
                        selectBlot(event)
                    }
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }}
                onContextMenu={(event) => {
                    event.preventDefault()
                    if (setTableCellSelection) {
                        setTableCellSelection({
                            menu: true,
                            type: 'row',
                            index: rowIndex
                        })
                    }
                }}>
                <IconTableSelect />
            </button>
            {showMenu && (
                <Menu className={styles.tableMenu} items={menuItems} />
            )}
        </div>
    )
}
