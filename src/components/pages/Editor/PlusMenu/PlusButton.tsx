import * as React from 'react'
import styles from './PlusButton.module.css'
import IconPlus from '../../../../assets/images/icons/line-controls/icon-plus.svg'
import PlusButtonClickAnalytics from '../../../../analytics/AnalyticsBuilders/PlusButtonClickAnalytics'
import store from '../../../../data/store'

interface Props {
    dragging: boolean
    onClick: () => void
}

export default class PlusButton extends React.Component<Props> {
    _onClick = (e: React.MouseEvent<HTMLElement>) => {
        e.stopPropagation()

        const {
            user: { userId, teamId, email },
            currentDocument: { id }
        } = store.getState()
        new PlusButtonClickAnalytics()
            .withProperties({
                userId,
                teamId,
                email,
                documentId: id
            })
            .track()

        this.props.onClick()
    }

    render() {
        const style: React.CSSProperties = {}

        if (this.props.dragging) {
            style.visibility = 'hidden'
        }

        return (
            <div id="plus-container" style={style}>
                <button
                    data-testid="plus-menu__plus-button"
                    className={styles.plusButton}
                    onClick={this._onClick}>
                    <IconPlus />
                </button>
            </div>
        )
    }
}
