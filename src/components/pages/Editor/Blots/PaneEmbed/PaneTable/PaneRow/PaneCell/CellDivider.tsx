import cx from 'classnames'
import React, { useContext, useMemo } from 'react'
import { TableContext } from '../../../PaneEmbed'
import styles from '../../PaneTable.module.css'

export function CellDivider(props: {
    index: number
    first?: boolean
    last?: boolean
    dragHover?: boolean
}) {
    const { index, first, last, dragHover } = props
    const { setResizingColumn } = useContext(TableContext)
    const isDraggable = useMemo(() => !first && !last, [first, last])

    return (
        <div
            data-testid={`cell-divider-${
                isDraggable ? 'draggable' : 'undraggable'
            }-${index}`}
            draggable={isDraggable}
            onMouseDown={(event) => {
                event.preventDefault()
                if (setResizingColumn && isDraggable) {
                    setResizingColumn(index)
                }
            }}
            className={cx(styles.columnDragHandle, {
                [styles.draggable]: isDraggable,
                [styles.dragHovered]: dragHover
            })}
        />
    )
}
