import React, { useMemo } from 'react'
import { useTableManipulations } from '../../hooks/useTableManipulations'
import styles from '../PaneTable.module.css'

export function RowDragLine(props: { hoveredRowIndex: number }) {
    const { hoveredRowIndex } = props
    const { columnCount, rowCount } = useTableManipulations()

    const shorten = useMemo(
        () => hoveredRowIndex === -1 || hoveredRowIndex === rowCount - 1,
        [hoveredRowIndex, rowCount]
    )
    return (
        <React.Fragment>
            <div
                className={styles.rowDragLine}
                style={{
                    gridRowStart: hoveredRowIndex + 2,
                    width: shorten ? 26 : 31,
                    position: 'relative',
                    left: shorten ? -26 : -31
                }}
            />
            <div
                className={styles.rowDragLine}
                style={{
                    gridRowStart: hoveredRowIndex + 2,
                    gridColumnStart: `span ${columnCount * 2 + 1}`
                }}
            />
        </React.Fragment>
    )
}
