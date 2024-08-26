import React from 'react'
import styles from './Spinner.module.css'

export default class Spinner extends React.Component {
    render() {
        return (
            <div className={styles.spinner}>
                <div className={styles.spinnerIndicator}>
                    <svg
                        className={styles.spinnerElement}
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        xmlns="http://www.w3.org/2000/svg">
                        <circle
                            className={styles.spinnerPath}
                            fill="none"
                            strokeWidth="1.5"
                            strokeLinecap="square"
                            cx="8"
                            cy="8"
                            r="6"
                        />
                    </svg>
                </div>
            </div>
        )
    }
}
