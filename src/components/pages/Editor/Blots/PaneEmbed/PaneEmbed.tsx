import theme from '@invisionapp/helios/css/theme'
import React, {
    createContext,
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useReducer,
    useRef,
    useState
} from 'react'
import { ThemeProvider } from 'styled-components'
import Advil, {
    Pane,
    PaneList,
    PaneViewType
} from '../../../../../data/panes/Advil'
import { useAdvil } from './hooks/useAdvil'
import { PaneEmbedContext } from './PaneEmbedContext'
import {
    DraggingInitialState,
    DraggingState,
    DraggingType
} from './PaneTable/Dragging'
import { DraggingDispatch, draggingReducer } from './PaneTable/Dragging/reducer'
import { PaneTable } from './PaneTable/PaneTable'

type TableCellSelection = {
    menu: boolean
    type: 'row' | 'column'
    index: number
}

export type ColumnWidths = Map<string, number>

export interface TableContext {
    advil?: Advil
    metadata: {
        columnSizes?: {
            [index: number]: number
        }
    }
    setPane?: Dispatch<SetStateAction<Pane | undefined>>
    isActive: boolean
    setHighlightedRow?: Dispatch<SetStateAction<number | null>>
    setHighlightedColumn?: Dispatch<SetStateAction<number | null>>
    highlightedRow: number | null
    highlightedColumn: number | null
    tableCellSelection: TableCellSelection | null
    setTableCellSelection?: (
        tableCellSelection: TableCellSelection | null
    ) => void
    activeCell: string | null
    setActiveCell?: (activeCell: string | null) => void
    dragging?: DraggingState
    draggingDispatch?: DraggingDispatch
    drop?: (rowIndex: number, cellIndex: number) => void
    lists: PaneList[]
    resizingColumn: number | null
    setResizingColumn?: (resizingColumn: number | null) => void
    columnWidths?: ColumnWidths
    setColumnWidth?: (key: string, value: number) => void
}

export const TableContext = createContext<TableContext>({
    activeCell: null,
    metadata: {},
    resizingColumn: null,
    tableCellSelection: null,
    isActive: true,
    highlightedRow: null,
    highlightedColumn: null,
    lists: []
})

export function PaneEmbed(props: { activeEmbed: string | null }) {
    const [pane, setPane] = useState<Pane>()
    const { advil, disconnect } = useAdvil(setPane)
    const { uuid } = useContext(PaneEmbedContext)
    const columnWidths = useRef<ColumnWidths>(new Map())

    const setColumnWidth = useCallback((key: string, value: number) => {
        columnWidths.current.set(key, value)
    }, [])
    const [
        tableCellSelection,
        setTableCellSelection
    ] = useState<TableCellSelection | null>(null)
    const [resizingColumn, setResizingColumn] = useState<number | null>(null)
    const [activeCell, setActiveCell] = useState<string | null>(null)
    const [highlightedRow, setHighlightedRow] = useState<number | null>(null)

    const [highlightedColumn, setHighlightedColumn] = useState<number | null>(
        null
    )
    const [draggingState, draggingDispatch] = useReducer(
        draggingReducer,
        DraggingInitialState
    )
    const { activeEmbed } = props
    const node = useRef<HTMLDivElement>(null)

    // Disconnect Advil on unmount
    useEffect(() => {
        return () => {
            disconnect()
        }
    }, [disconnect])

    const setMenuAndHighlightCells = useCallback(
        (tableCellSelection: TableCellSelection | null) => {
            if (!tableCellSelection) {
                setHighlightedColumn(null)
                setHighlightedRow(null)
                return
            }

            if (tableCellSelection && tableCellSelection.type === 'column') {
                setHighlightedColumn(tableCellSelection.index)
                setHighlightedRow(null)
                setActiveCell(null)
            } else if (
                tableCellSelection &&
                tableCellSelection.type === 'row'
            ) {
                setHighlightedRow(tableCellSelection.index)
                setHighlightedColumn(null)
                setActiveCell(null)
            } else if (!tableCellSelection) {
                setHighlightedColumn(null)
                setHighlightedRow(null)
            }
            setTableCellSelection(tableCellSelection)
        },
        []
    )

    const drop = useCallback(
        (rowIndex: number, cellIndex: number) => {
            if (draggingState.type === DraggingType.Row) {
                if (
                    rowIndex === draggingState.rowIndex ||
                    rowIndex + 1 === draggingState.rowIndex
                ) {
                    return
                }
                if (rowIndex === -1) {
                    rowIndex = 0
                }
                advil?.moveListByIndex(draggingState.rowIndex!, rowIndex)
                setPane(advil?.pane)
            } else if (draggingState.type === DraggingType.Column) {
                if (
                    cellIndex === draggingState.cellIndex ||
                    cellIndex + 1 === draggingState.cellIndex
                ) {
                    return
                }
                if (cellIndex === -1) {
                    cellIndex = 0
                }
                const draggingCell = `${draggingState.cellIndex!}`
                const draggingCellWidth = columnWidths.current.get(draggingCell)
                const targetCell = `${cellIndex!}`
                const targetCellWidth = columnWidths.current.get(targetCell)
                if (draggingCellWidth && targetCellWidth) {
                    setColumnWidth(draggingCell, targetCellWidth)
                    setColumnWidth(targetCell, draggingCellWidth)
                    advil?.editColumnSizes([
                        [draggingCell, targetCellWidth],
                        [targetCell, draggingCellWidth]
                    ])
                }
                advil?.moveListsElements(draggingState.cellIndex!, cellIndex)
                setPane(advil?.pane)
            }
        },
        [
            advil,
            draggingState.cellIndex,
            draggingState.rowIndex,
            draggingState.type,
            setColumnWidth
        ]
    )

    const isActive = useMemo(() => activeEmbed === uuid, [uuid, activeEmbed])

    return (
        <div id={`pane-${uuid}`} ref={node}>
            {pane?.viewType === PaneViewType.TABLE && (
                <ThemeProvider theme={theme}>
                    <TableContext.Provider
                        value={{
                            advil,
                            columnWidths: columnWidths.current,
                            setColumnWidth,
                            metadata: pane.metadata as any,
                            setPane,
                            resizingColumn,
                            setResizingColumn,
                            isActive,
                            highlightedRow,
                            highlightedColumn,
                            tableCellSelection,
                            setTableCellSelection: setMenuAndHighlightCells,
                            activeCell,
                            setActiveCell,
                            draggingDispatch,
                            dragging: draggingState,
                            drop,
                            lists: pane.elements as PaneList[]
                        }}>
                        <PaneTable />
                    </TableContext.Provider>
                </ThemeProvider>
            )}
        </div>
    )
}
