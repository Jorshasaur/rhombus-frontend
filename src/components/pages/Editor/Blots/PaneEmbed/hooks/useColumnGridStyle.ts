import { useContext, useMemo } from 'react'
import { ColumnWidths, TableContext } from '../PaneEmbed'

export function calculateGridColumns(
    columnCount: number,
    columnWidths?: ColumnWidths
) {
    const gridTemplateColumnsItems: string[] = []

    for (let i = 0, len = columnCount; i < len; i++) {
        const columnWidth = columnWidths?.get(`${i}`)
        if (i === 0) {
            gridTemplateColumnsItems.push('0')
        }

        if (columnWidth) {
            gridTemplateColumnsItems.push(`${columnWidth}%`)
        } else {
            gridTemplateColumnsItems.push('1fr')
        }

        gridTemplateColumnsItems.push('0')
    }

    return gridTemplateColumnsItems.join(' ')
}

export function useColumnGridStyle(columnCount: number) {
    const { columnWidths } = useContext(TableContext)

    const style = useMemo(() => {
        return calculateGridColumns(columnCount, columnWidths)
    }, [columnCount, columnWidths])

    return style
}
