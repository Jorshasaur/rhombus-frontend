import * as React from 'react'
import styles from '../LineControls/LineControls.module.css'
import Move from '../../../../assets/images/icons/line-controls/move.svg'
import { getEmptyImage } from 'react-dnd-html5-backend'
import {
    ConnectDragPreview,
    ConnectDragSource,
    DragSourceConnector,
    DragSource,
    DragSourceMonitor
} from 'react-dnd'
import LineDragItemType from './LineDragItemType'
import LineDragSource from './LineDragSource'

interface Props {
    navigationHeight: number
    index: number
    dragHandle: boolean
    dragging: boolean

    // Injected by React DnD
    connectDragPreview?: ConnectDragPreview
    connectDragSource?: ConnectDragSource
}

interface State {}

function collect(connectDrag: DragSourceConnector, monitor: DragSourceMonitor) {
    return {
        connectDragSource: connectDrag.dragSource(),
        connectDragPreview: connectDrag.dragPreview()
    }
}

class DragButton extends React.Component<Props, State> {
    public componentDidMount() {
        const { connectDragPreview } = this.props
        if (connectDragPreview) {
            // Use empty image as a drag preview so browsers don't draw it
            // and we can draw whatever we want on the custom drag layer instead.
            connectDragPreview(getEmptyImage())
        }
    }

    render() {
        const { connectDragSource, dragging } = this.props

        const style: React.CSSProperties = {}

        if (dragging) {
            style.opacity = 0
        }

        return connectDragSource!(
            <span
                style={style}
                className={styles.dragButton}
                data-testid="line-controls__drag-button">
                <Move />
            </span>
        )
    }
}

export default DragSource<Props>(
    LineDragItemType,
    LineDragSource,
    collect
)(DragButton)
