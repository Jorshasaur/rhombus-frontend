import React from 'react'
import { DragLayer, XYCoord } from 'react-dnd'
import { DragItem } from './DragItem'
import LineDragPreviewLayer from './LineDragPreviewLayer'
import LineDragItemType from './LineDragItemType'

interface Props {
    index: number
    item?: DragItem
    itemType?: string
    clientOffset?: XYCoord
    isDragging?: boolean
}

const layerStyles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    width: '50%',
    height: '100%'
}

class DragPreviewLayer extends React.Component<Props> {
    render() {
        const { isDragging, item, clientOffset, itemType } = this.props
        if (!isDragging) {
            return null
        }

        if (itemType !== LineDragItemType) {
            return null
        }

        return (
            <div style={layerStyles}>
                <LineDragPreviewLayer
                    item={item!}
                    clientOffset={clientOffset}
                />
            </div>
        )
    }
}

export default DragLayer<Props>((monitor) => ({
    item: monitor.getItem(),
    itemType: monitor.getItemType(),
    clientOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
}))(DragPreviewLayer)
