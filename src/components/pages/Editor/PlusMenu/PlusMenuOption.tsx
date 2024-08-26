import * as React from 'react'
import styles from './PlusMenuOption.module.css'

interface Props {
    onClickAction: () => void
    onMouseOver?: () => void
    icon: JSX.Element
    testId?: string
}

export default class PlusMenuOption extends React.Component<Props> {
    _onClick = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        this.props.onClickAction()
    }

    render() {
        return (
            <li
                onMouseOver={() => {
                    if (this.props.onMouseOver) {
                        this.props.onMouseOver()
                    }
                }}
                data-testid={this.props.testId}
                className={styles.plusMenuButton}
                onClick={this._onClick}>
                {this.props.icon}
                <span>{this.props.children}</span>
            </li>
        )
    }
}
