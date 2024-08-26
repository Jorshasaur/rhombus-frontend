import * as React from 'react'
import styles from './Placeholder.module.css'
import cx from 'classnames'
interface Props {
    firstLineHeight: number
    showFirstLinePlaceholder: boolean
    showSecondLinePlaceholder: boolean
}

interface State {}

enum PLACEHOLDER_COPY {
    firstLinePlaceholder = 'Name this doc',
    secondLinePlaceholder = 'Then add text, images, or a freehand link.'
}

export default class Placeholder extends React.Component<Props, State> {
    render() {
        const {
            firstLineHeight,
            showFirstLinePlaceholder,
            showSecondLinePlaceholder
        } = this.props
        const height = firstLineHeight ? firstLineHeight + 'px' : 'auto'
        return (
            <div id="placeholder-container" className={styles.placeholder}>
                <p
                    style={{
                        height
                    }}
                    className={cx(styles.placeholderTitle, {
                        [styles.placeholderHide]: !showFirstLinePlaceholder
                    })}>
                    {PLACEHOLDER_COPY.firstLinePlaceholder}
                </p>
                <p
                    className={cx({
                        [styles.placeholderHide]: !showSecondLinePlaceholder
                    })}>
                    {PLACEHOLDER_COPY.secondLinePlaceholder}
                </p>
            </div>
        )
    }
}
