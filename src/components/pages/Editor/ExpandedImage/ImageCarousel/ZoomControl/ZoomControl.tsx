import Minus from '@invisionapp/helios/icons/Minus'
import Plus from '@invisionapp/helios/icons/Plus'
import cx from 'classnames'
import React, { useState } from 'react'
import styles from './ZoomControl.module.css'

interface Props {
    showZoomControl: boolean
    zoomOut: () => void
    zoomIn: () => void
    clickCenter: () => void
    scale: number
}

export function ZoomControl(props: Props) {
    const [forceShow, setForceShow] = useState(props.showZoomControl)

    return (
        <div
            data-testid="zoom-control-container"
            onMouseEnter={() => {
                setForceShow(true)
            }}
            onMouseLeave={() => {
                setForceShow(false)
            }}
            className={cx(styles.zoomControl, {
                [styles.showZoomControl]: props.showZoomControl || forceShow
            })}>
            <button
                onClick={props.zoomOut}
                className={styles.zoomOut}
                data-testid="zoom-control-zoom-out">
                <Minus fill="white" size={24} />
            </button>
            <button
                onDoubleClick={props.clickCenter}
                className={styles.scale}
                data-testid="zoom-control-scale">
                {Math.round(props.scale * 10) / 10}%
            </button>
            <button
                onClick={props.zoomIn}
                className={styles.zoomIn}
                data-testid="zoom-control-zoom-in">
                <Plus fill="white" size={24} />
            </button>
        </div>
    )
}
