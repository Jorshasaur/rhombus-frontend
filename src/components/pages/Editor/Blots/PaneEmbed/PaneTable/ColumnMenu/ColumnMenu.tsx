import { Menu } from '@invisionapp/helios'
import cx from 'classnames'
import React, { useContext, useEffect, useMemo } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import IconTableSelect from '../../../../../../../assets/images/icons/icon-table-select.svg'
import { useTableManipulations } from '../../hooks/useTableManipulations'
import { TableContext } from '../../PaneEmbed'
import { PaneEmbedContext } from '../../PaneEmbedContext'
import { DraggingType } from '../Dragging'
import { endDragging, hover, startDraggingColumn } from '../Dragging/actions'
import { CellDivider } from '../PaneRow/PaneCell/CellDivider'
import styles from '../PaneTable.module.css'
import TableDragItemType from '../TableDragItemType'

const ROW_INDEX = -1
const MINIMUM_COLUMNS = 2

function MenuCell(props: { index: number; rowIds: string[] }) {
    const {
        highlightedColumn,
        tableCellSelection,
        setTableCellSelection,
        setActiveCell,
        draggingDispatch,
        dragging,
        drop,
        resizingColumn
    } = useContext(TableContext)
    const { selectBlot, uuid } = useContext(PaneEmbedContext)

    const { index } = props

    const { addColumn, removeColumn, columnCount } = useTableManipulations()

    const isHighlighted = useMemo(() => highlightedColumn === index, [
        highlightedColumn,
        index
    ])

    const [{ isDragging }, drag, connectDragPreview] = useDrag({
        item: { type: TableDragItemType },
        begin: () => {
            setActiveCell!(null)
            draggingDispatch!(startDraggingColumn(index))
        },
        end: (_item, monitor) => {
            // If drag ends outside of component, use the last position to drop
            if (
                !monitor.didDrop() &&
                dragging?.hoveredCellIndex &&
                dragging?.type === DraggingType.Column
            ) {
                drop!(ROW_INDEX, dragging.hoveredCellIndex)
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
                dragging?.hoveredRowIndex !== ROW_INDEX ||
                dragging?.hoveredCellIndex !== index
            ) {
                draggingDispatch!(hover(ROW_INDEX, index))
            }
        },
        drop: () => {
            drop!(ROW_INDEX, index)
        }
    })

    const showMenu = useMemo(
        () =>
            tableCellSelection?.type === 'column' &&
            tableCellSelection.index === index &&
            tableCellSelection.menu &&
            isHighlighted,
        [tableCellSelection, isHighlighted, index]
    )

    const menuItems = useMemo(() => {
        const items = [
            {
                'data-testid': 'add-column-before',
                type: 'item' as 'item',
                label: 'Insert 1 before',
                onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault()
                    addColumn(index)
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }
            },
            {
                'data-testid': 'add-column-after',
                type: 'item' as 'item',
                label: 'Insert 1 after',
                onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault()
                    addColumn(index + 1)
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }
            }
        ]

        if (columnCount > MINIMUM_COLUMNS) {
            items.push({
                'data-testid': 'remove-column',
                type: 'item' as 'item',
                label: 'Delete column',
                onMouseDown: (event: React.MouseEvent<HTMLElement>) => {
                    event.preventDefault()
                    removeColumn(index)
                    if (setTableCellSelection) {
                        setTableCellSelection(null)
                    }
                }
            })
        }

        return items
    }, [addColumn, columnCount, index, removeColumn, setTableCellSelection])

    return (
        <div
            id={`menu-cell-${uuid}-${index}`}
            className={cx(
                styles.tableCell,
                styles.menuCell,
                styles.columnMenuCell,
                {
                    [styles.highlighted]: isHighlighted,
                    [styles.dragging]: isDragging,
                    [styles.first]: index === 0,
                    [styles.last]: index + 1 === columnCount,
                    [styles.resizing]: resizingColumn !== null
                }
            )}
            ref={dropRef}
            onClick={() => {
                if (setTableCellSelection) {
                    setTableCellSelection({
                        menu: false,
                        type: 'column',
                        index
                    })
                }
            }}>
            <button
                ref={drag}
                data-keep-focus="true"
                data-testid="table-column-drag-button"
                className={cx(styles.tableMenuButton, styles.columnMenu)}
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
                            type: 'column',
                            index
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

export function ColumnMenu(props: { rowIds: string[] }) {
    const { rowIds } = props
    const { uuid } = useContext(PaneEmbedContext)
    const { columnCount } = useTableManipulations()
    const { dragging, highlightedColumn } = useContext(TableContext)
    const menuCells = useMemo(() => {
        const cells = []
        for (let index = 0, len = columnCount; index < len; index++) {
            cells.push(
                <React.Fragment key={index}>
                    {index === 0 && (
                        <CellDivider
                            key={`divider-first-${uuid}`}
                            index={index}
                            first={true}
                            dragHover={
                                dragging?.type === DraggingType.Column &&
                                dragging?.hoveredCellIndex === -1
                            }
                        />
                    )}
                    <MenuCell key={index} index={index} rowIds={rowIds} />
                    <CellDivider
                        key={`divider-${uuid}-${index}`}
                        index={index}
                        last={index + 1 === columnCount}
                        dragHover={
                            dragging?.type === DraggingType.Column &&
                            dragging?.hoveredCellIndex === index
                        }
                    />
                </React.Fragment>
            )
        }
        return cells
    }, [columnCount, rowIds, uuid, dragging])

    const isHighlighted = useMemo(() => highlightedColumn !== null, [
        highlightedColumn
    ])

    return (
        <div
            className={cx(
                styles.menuContainer,
                styles.tableGrid,
                styles.columnMenuTableGrid,
                { [styles.highlighted]: isHighlighted }
            )}>
            <div className={styles.gridSpacer} />
            {menuCells}
        </div>
    )
}
