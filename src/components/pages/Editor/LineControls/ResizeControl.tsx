import * as React from 'react'
import cx from 'classnames'
import styles from './LineControls.module.css'
import Small from '../../../../assets/images/icons/line-controls/resize-small.svg'
import Medium from '../../../../assets/images/icons/line-controls/resize-medium.svg'
import Large from '../../../../assets/images/icons/line-controls/resize-large.svg'
import { BlotSize } from '../../../../interfaces/blotSize'

interface Props {
    size: BlotSize
    isActive: boolean
    onClick: (size: BlotSize) => void
}

export class ResizeControl extends React.PureComponent<Props> {
    render() {
        const { size, isActive } = this.props
        return (
            <button
                className={cx(
                    styles.lineControlButton,
                    styles.resizeControlButton,
                    { [styles.active]: isActive }
                )}
                data-testid={`resize-control__${size}`}
                onMouseDown={this._handleClick}>
                {this._getIcon(size)}
            </button>
        )
    }

    _handleClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        this.props.onClick(this.props.size)
    }

    _getIcon(size: BlotSize) {
        switch (size) {
            case BlotSize.Small:
                return <Small />
            case BlotSize.Medium:
                return <Medium />
            case BlotSize.Large:
                return <Large />
        }
    }
}
