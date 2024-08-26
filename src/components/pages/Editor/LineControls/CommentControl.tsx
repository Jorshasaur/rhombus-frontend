import * as React from 'react'
import styles from './LineControls.module.css'
import cx from 'classnames'
import Comment from '../../../../assets/images/icons/line-controls/comment.svg'

interface Props {
    onClick: () => void
}
export class CommentControl extends React.PureComponent<Props> {
    render() {
        return (
            <button
                className={cx(
                    styles.lineControlButton,
                    styles.commentControlButton
                )}
                onMouseDown={this.props.onClick}>
                <Comment />
            </button>
        )
    }
}
