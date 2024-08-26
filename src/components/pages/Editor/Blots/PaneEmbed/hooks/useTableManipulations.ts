import PubSub from 'pubsub-js'
import { useCallback, useContext, useMemo } from 'react'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../../../constants/topics'
import {
    ColumnSizeUpdate,
    PaneElement
} from '../../../../../../data/panes/Advil'
import * as AdvilOps from '../../../../../../data/panes/AdvilOps'
import { ColumnWidths, TableContext } from '../PaneEmbed'
import { PaneEmbedContext } from '../PaneEmbedContext'
import { calculateGridColumns } from './useColumnGridStyle'

const MINIMUM_CELL_PERCENTAGE = 5

export function useTableManipulations() {
    const {
        advil,
        setPane,
        lists,
        resizingColumn,
        columnWidths,
        setColumnWidth
    } = useContext(TableContext)
    const { uuid } = useContext(PaneEmbedContext)
    const rowIds = useMemo(() => lists.map((list) => list.id), [lists])

    const columnCount = useMemo(() => lists[0].elements.length, [lists])
    const rowCount = useMemo(() => lists.length, [lists])

    // Set the style on the table container directly to avoid any delays using state
    // This only updates the size locally
    const setTableStyleLocally = useCallback(() => {
        const tableContainer = document.getElementById(
            `table-container-${uuid}`
        )
        if (tableContainer && columnWidths) {
            const style = calculateGridColumns(columnCount, columnWidths)
            tableContainer.style.setProperty('--column-grid-style', style)
        }
    }, [columnCount, uuid, columnWidths])

    const getCellByIndex = useCallback(
        (index: number) => {
            return document.getElementById(`menu-cell-${uuid}-${index}`)
        },
        [uuid]
    )

    const removeColumn = useCallback(
        (removeIndex: number) => {
            // Remove the element at the index from each row in advil
            advil?.removeElementsFromList(rowIds, removeIndex)

            // Fet the width of the column being removed
            const removedWidth = columnWidths?.get(`${removeIndex}`)
            if (removedWidth && columnWidths) {
                // Divide the width of the column being removed across the remaining columns
                const increaseAmount = removedWidth / (columnCount - 1)

                // Build the new object for columnSize metadata
                const columnSizes: ColumnSizeUpdate = []
                // Delete the removed column in advil
                columnSizes.push([`${columnWidths.size - 1}`, null])
                // Remove the column from the column widths map
                columnWidths.delete(`${removeIndex}`)
                const newColumnWidths: ColumnWidths = new Map(columnWidths)

                newColumnWidths.forEach((width, columnIndex) => {
                    const index = parseInt(columnIndex)
                    if (index >= removeIndex) {
                        if (setColumnWidth) {
                            setColumnWidth(
                                `${index - 1}`,
                                width + increaseAmount
                            )
                        }
                        columnSizes.push([
                            `${index - 1}`,
                            width + increaseAmount
                        ])
                    } else {
                        if (setColumnWidth) {
                            setColumnWidth(columnIndex, width + increaseAmount)
                        }
                        columnSizes.push([columnIndex, width + increaseAmount])
                    }
                })

                // Set the new column size metadata object in advil
                advil?.editColumnSizes(columnSizes)
            }
            if (setPane) {
                setPane(advil?.pane)
            }
            setTableStyleLocally()
        },
        [
            advil,
            columnCount,
            setTableStyleLocally,
            setPane,
            rowIds,
            columnWidths,
            setColumnWidth
        ]
    )

    const addColumn = useCallback(
        (insertionIndex: number) => {
            // Add a text pane element to every row at the specified index
            advil?.addElementToListsAtPosition(rowIds, insertionIndex, () => {
                return AdvilOps.createText()
            })
            // Calculate the size of the new column
            const newColumnWidth = 100 / (columnCount + 1)
            let totalAmountToReduce: number = newColumnWidth

            // Loop through the existing columns and reduce their width evenly
            // across the column that have space to be reduced to make room for the new column
            while (
                Math.round((totalAmountToReduce + Number.EPSILON) * 100) / 100 >
                0
            ) {
                const amountToReduce = totalAmountToReduce / columnCount
                columnWidths?.forEach((width, columnIndex) => {
                    // If the column is able to be reduced by the full amount needed, do so
                    if (width - amountToReduce >= MINIMUM_CELL_PERCENTAGE) {
                        const newWidth = width - amountToReduce
                        totalAmountToReduce =
                            totalAmountToReduce - amountToReduce
                        if (setColumnWidth) {
                            setColumnWidth(columnIndex, newWidth)
                        }
                        // Otherwise take as much width as possible before hitting the minimum
                    } else if (
                        width - amountToReduce < MINIMUM_CELL_PERCENTAGE &&
                        width - MINIMUM_CELL_PERCENTAGE >= 0
                    ) {
                        totalAmountToReduce =
                            totalAmountToReduce -
                            (width - MINIMUM_CELL_PERCENTAGE)
                        if (setColumnWidth) {
                            setColumnWidth(columnIndex, MINIMUM_CELL_PERCENTAGE)
                        }
                    }
                })
            }

            // Build the new object for columnSize metadata
            const columnSizes: ColumnSizeUpdate = []

            if (columnWidths && setColumnWidth) {
                const newColumnWidths: ColumnWidths = new Map(columnWidths)

                // Loop through the column width map, and update the indexes
                // of the columns following the inserted column
                newColumnWidths.forEach((width, columnIndex) => {
                    const index = parseInt(columnIndex)
                    if (index >= insertionIndex) {
                        const newIndex = `${index + 1}`
                        setColumnWidth(newIndex, width)
                        columnSizes.push([newIndex, width])
                    } else {
                        setColumnWidth(columnIndex, width)
                        columnSizes.push([columnIndex, width])
                    }
                })
                // Add the new column width to the map and metadata object
                setColumnWidth(`${insertionIndex}`, newColumnWidth)
                columnSizes.push([`${insertionIndex}`, newColumnWidth])
                // Set the metadata in advil
                advil?.editColumnSizes(columnSizes)
            }

            // Update the pane
            if (setPane) {
                setPane(advil?.pane)
            }

            // Update the CSS on the grid
            setTableStyleLocally()
        },
        [
            advil,
            rowIds,
            columnCount,
            setPane,
            setTableStyleLocally,
            columnWidths,
            setColumnWidth
        ]
    )

    const removeRow = useCallback(
        (rowId: string) => {
            advil?.removeList(rowId)
            if (setPane) {
                setPane(advil?.pane)
            }
            PubSub.publish(DOCUMENT_CHANGE_REPOSITION, false)
        },
        [advil, setPane]
    )

    const addRow = useCallback(
        (index: number) => {
            const paneElements: PaneElement[] = []
            for (let i = 0, len = columnCount; i < len; i++) {
                const text = AdvilOps.createText()
                paneElements.push(text)
            }
            advil?.createList(paneElements, index)
            if (setPane) {
                setPane(advil?.pane)
            }
            PubSub.publish(DOCUMENT_CHANGE_REPOSITION, false)
        },
        [advil, columnCount, setPane]
    )

    const dragColumnRight = useCallback(
        (containerWidth: number, moveAmount: number) => {
            if (resizingColumn !== null && moveAmount !== 0) {
                // Find the next column wide enough to subtract
                let columnToCollapse: {
                    index: number
                    width: number
                } | null = null

                // Loop through the columns following the resizing column
                for (
                    let index = resizingColumn + 1, len = columnCount;
                    index < len;
                    index++
                ) {
                    const collapsingColumn = getCellByIndex(index)
                    if (collapsingColumn) {
                        // If the column is large enough to subtract from, use it as the collapsing column
                        const width = collapsingColumn.offsetWidth - moveAmount
                        if (
                            (width * 100) / containerWidth >=
                            MINIMUM_CELL_PERCENTAGE
                        ) {
                            columnToCollapse = {
                                index,
                                width
                            }
                            break
                        }
                    }
                }

                const cell = getCellByIndex(resizingColumn)
                if (cell && columnToCollapse) {
                    // Calculate the new width of the resized cell
                    const cellWidth = cell.offsetWidth + moveAmount

                    // If new cell is greater than the minimum percentage
                    // and the collapsing width is greater than the minimum, resize it
                    if (
                        (cellWidth * 100) / containerWidth >=
                            MINIMUM_CELL_PERCENTAGE &&
                        (columnToCollapse.width * 100) / containerWidth >=
                            MINIMUM_CELL_PERCENTAGE
                    ) {
                        if (setColumnWidth) {
                            setColumnWidth(
                                `${resizingColumn}`,
                                (cellWidth * 100) / containerWidth
                            )
                            setColumnWidth(
                                `${columnToCollapse.index}`,
                                (columnToCollapse.width * 100) / containerWidth
                            )
                        }
                    }
                }
            }
            // Update the grid style on the pane container element
            // metadata is updated onMouseUp on the PaneTable component
            setTableStyleLocally()
        },
        [
            resizingColumn,
            setTableStyleLocally,
            getCellByIndex,
            columnCount,
            setColumnWidth
        ]
    )

    const dragColumnLeft = useCallback(
        (containerWidth: number, moveAmount: number) => {
            if (resizingColumn !== null && moveAmount !== 0) {
                // Loop through the columns ve the resizing column
                let columnToCollapse: {
                    index: number
                    width: number
                } | null = null
                if (resizingColumn > 0) {
                    for (let index = resizingColumn; index >= 0; index--) {
                        const collapsingColumn = getCellByIndex(index)
                        if (collapsingColumn) {
                            const width =
                                collapsingColumn.offsetWidth + moveAmount

                            if (
                                (width * 100) / containerWidth >=
                                MINIMUM_CELL_PERCENTAGE
                            ) {
                                columnToCollapse = {
                                    index,
                                    width
                                }
                                break
                            }
                        }
                    }
                }

                const cell = getCellByIndex(resizingColumn)
                if (cell) {
                    const cellWidth = cell.offsetWidth + moveAmount

                    const resizeTargetCell =
                        (cellWidth * 100) / containerWidth >=
                        MINIMUM_CELL_PERCENTAGE

                    // Update the size of the resizing column if it is wide enough to be resized
                    if (resizeTargetCell) {
                        if (setColumnWidth) {
                            setColumnWidth(
                                `${resizingColumn}`,
                                (cellWidth * 100) / containerWidth
                            )
                        }

                        // Update the size of the following cell to correspond with the resizing cell
                        const siblingCell = getCellByIndex(resizingColumn + 1)
                        if (siblingCell && setColumnWidth) {
                            setColumnWidth(
                                `${resizingColumn + 1}`,
                                ((siblingCell.offsetWidth - moveAmount) * 100) /
                                    containerWidth
                            )
                        }
                    }

                    // If there are columns before the column that need to be resized, do so
                    const resizePreviousCells =
                        columnToCollapse &&
                        (columnToCollapse.width * 100) / containerWidth >=
                            MINIMUM_CELL_PERCENTAGE
                    if (resizePreviousCells && columnToCollapse) {
                        if (setColumnWidth) {
                            setColumnWidth(
                                `${columnToCollapse.index}`,
                                (columnToCollapse.width * 100) / containerWidth
                            )
                        }
                    }

                    // If the resized column only moved, but did not change size, resize
                    // the column after to accommodate for the move
                    if (!resizeTargetCell && resizePreviousCells) {
                        const lastCell = getCellByIndex(resizingColumn + 1)
                        if (lastCell && setColumnWidth) {
                            const lastCellWidth =
                                (lastCell.offsetWidth - moveAmount) * 100
                            setColumnWidth(
                                `${resizingColumn + 1}`,
                                lastCellWidth / containerWidth
                            )
                        }
                    }
                }
            }
            // Update the grid style on the pane container element
            // metadata is updated onMouseUp on the PaneTable component
            setTableStyleLocally()
        },
        [resizingColumn, getCellByIndex, setTableStyleLocally, setColumnWidth]
    )

    return {
        setTableStyleLocally,
        addColumn,
        addRow,
        removeColumn,
        removeRow,
        columnCount,
        rowCount,
        dragColumnRight,
        dragColumnLeft
    }
}
