import cx from 'classnames'
import React, { useCallback, useContext, useEffect, useRef } from 'react'
import { useDragLayer, XYCoord } from 'react-dnd'
import IconTableSelect from '../../../../../../assets/images/icons/icon-table-select.svg'
import { Pane, PaneList } from '../../../../../../data/panes/Advil'
import { getListAt } from '../../../../../../data/panes/AdvilSelectors'
import { getPaneEditorId } from '../../../../../../QuillRegistry'
import styles from '../../../LineDrag/LineDragPreviewLayer.module.css'
import paneTableStyles from '../../PaneEmbed/PaneTable/PaneTable.module.css'
import { TableContext } from '../PaneEmbed'
import { DraggingState, DraggingType } from './Dragging'
import TableDragItemType from './TableDragItemType'

const MULTILINE_HEIGHT = 150

const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '50%',
    height: '100%'
}

function cloneNode(node: HTMLElement) {
    return node.cloneNode(true) as HTMLElement
}

function cloneEditorNode(editorId: string) {
    const editorNode = document.querySelector(
        `div[data-editor-id="${editorId}"]`
    ) as HTMLElement
    const clonedNode = cloneNode(editorNode)
    clonedNode.classList.remove(paneTableStyles.draggingTableCell)
    return clonedNode
}

function addCells(
    container: HTMLElement,
    pane: Pane,
    paneId: string,
    draggingType: DraggingType,
    rowIndex?: number,
    cellIndex?: number
) {
    if (draggingType === DraggingType.Row) {
        const list = getListAt(pane, rowIndex!)
        for (const element of list.elements) {
            const editorId = getPaneEditorId(paneId, element.id)
            const editorNode = cloneEditorNode(editorId)
            container.appendChild(editorNode)
        }
    } else if (draggingType === DraggingType.Column) {
        for (const list of pane.elements) {
            const element = (list as PaneList).elements[cellIndex!]
            const editorId = getPaneEditorId(paneId, element.id)
            const editorNode = cloneEditorNode(editorId)
            container.appendChild(editorNode)
        }
    }
}

function DragPreview(props: {
    clientOffset: XYCoord
    dragging: DraggingState
}) {
    const { x, y } = props.clientOffset
    const height = 0
    const transform = `translate(${x}px, ${y - height}px)`

    const style: React.CSSProperties = {
        transform: transform,
        WebkitTransform: transform
    }

    const { type, rowIndex, cellIndex } = props.dragging

    const { advil, columnWidths } = useContext(TableContext)

    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        if (ref.current) {
            addCells(
                ref.current,
                advil!.pane!,
                advil!.paneId,
                type!,
                rowIndex,
                cellIndex
            )
            if (ref.current.clientHeight > MULTILINE_HEIGHT) {
                ref.current.classList.add(styles.multiline)
            }
        }
    }, [advil, cellIndex, rowIndex, type])

    let containerClassName
    const containerStyle: React.CSSProperties = {}

    const setDefaultWidth = useCallback(() => {
        const pane = advil!.pane!
        const firstList = pane.elements[0] as PaneList
        containerStyle.width = `${100 / firstList.elements.length}%`
    }, [advil, containerStyle])

    if (type === DraggingType.Row) {
        containerClassName = styles.tableRow
        style.paddingRight = 80
    } else if (type === DraggingType.Column) {
        containerClassName = styles.tableColumn

        if (cellIndex !== undefined) {
            const width = columnWidths?.get(`${cellIndex}`)
            if (width) {
                containerStyle.width = `${width}%`
            } else {
                setDefaultWidth()
            }
        } else {
            setDefaultWidth()
        }

        style.paddingRight = 110
    }

    return (
        <div
            className={cx('line-drag-layer', styles.tableDragLayer)}
            style={style}>
            <div
                ref={ref}
                className={containerClassName}
                style={containerStyle}>
                <span className={styles.tableDragHandle}>
                    <IconTableSelect />
                </span>
            </div>
        </div>
    )
}

export default function DragPreviewLayer(props: { dragging: DraggingState }) {
    const { isDragging, itemType, clientOffset } = useDragLayer((monitor) => {
        return {
            clientOffset: monitor.getClientOffset(),
            isDragging: monitor.isDragging(),
            itemType: monitor.getItemType()
        }
    })

    if (!isDragging || !clientOffset) {
        return null
    }

    if (itemType !== TableDragItemType) {
        return null
    }

    return (
        <div style={layerStyles}>
            <DragPreview
                clientOffset={clientOffset}
                dragging={props.dragging}
            />
        </div>
    )
}
