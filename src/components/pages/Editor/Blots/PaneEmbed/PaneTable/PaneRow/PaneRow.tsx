import PubSub from 'pubsub-js'
import Delta, { DeltaStatic } from 'quill-delta'
import React, { useContext } from 'react'
import { DOCUMENT_CHANGE_REPOSITION } from '../../../../../../../constants/topics'
import { PaneElement } from '../../../../../../../data/panes/Advil'
import { TableContext } from '../../PaneEmbed'
import { DraggingType } from '../Dragging'
import { CellDivider } from './PaneCell/CellDivider'
import { PaneCell } from './PaneCell/PaneCell'
import { RowMenu } from './PaneCell/RowMenu'

export function PaneRow(props: {
    rowId: string
    rowIndex: number
    elements: PaneElement[]
}) {
    const { advil, dragging } = useContext(TableContext)
    const { rowId, elements, rowIndex } = props

    const onTextChange = (elementId: string, delta: DeltaStatic) => {
        advil?.editText(rowId, elementId, new Delta(delta.ops))
        PubSub.publish(DOCUMENT_CHANGE_REPOSITION, true)
    }

    return (
        <React.Fragment>
            <RowMenu rowIndex={rowIndex} rowId={rowId} />
            {advil &&
                elements.map((paneElement: PaneElement, index: number) => (
                    <React.Fragment key={paneElement.id}>
                        {index === 0 && (
                            <CellDivider
                                key={`divider-first-${paneElement.id}`}
                                index={index}
                                first={true}
                                dragHover={
                                    dragging?.type === DraggingType.Column &&
                                    dragging?.hoveredCellIndex === -1
                                }
                            />
                        )}
                        <PaneCell
                            element={paneElement}
                            key={`cell-${paneElement.id}`}
                            paneId={advil.paneId}
                            rowIndex={props.rowIndex}
                            cellIndex={index}
                            onTextChange={(delta: DeltaStatic) => {
                                onTextChange(paneElement.id, delta)
                            }}
                        />
                        <CellDivider
                            key={`divider-${paneElement.id}`}
                            index={index}
                            last={index + 1 === elements.length}
                            dragHover={
                                dragging?.type === DraggingType.Column &&
                                dragging?.hoveredCellIndex === index
                            }
                        />
                    </React.Fragment>
                ))}
        </React.Fragment>
    )
}
