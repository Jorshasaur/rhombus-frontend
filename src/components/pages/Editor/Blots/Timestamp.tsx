import * as React from 'react'
import TimeAgo from 'react-timeago'
import { formatTime } from '../../../../lib/utils'
import blotsStyles from './Blots.module.css'

interface TimestampProps {
    className?: string
    author?: string
    createdAt?: string
    updatedAt?: string
    width?: React.CSSProperties['width']
    style?: React.CSSProperties
}
export const Timestamp = ({
    author,
    className,
    createdAt,
    updatedAt,
    width,
    style
}: TimestampProps) => {
    const layoutStyles: React.CSSProperties =
        width && width < 200
            ? { textAlign: 'left', ...style }
            : { maxWidth: width, ...style }

    if (createdAt || updatedAt) {
        return (
            <div
                className={className || blotsStyles.timestamp}
                style={layoutStyles}>
                {createdAt ? 'Added ' : 'Updated '}
                <TimeAgo
                    date={updatedAt ? updatedAt : createdAt}
                    formatter={(
                        value: number,
                        unit: string,
                        suffix: string,
                        date: Date
                    ) => formatTime(value, unit, suffix, date, 'just now')}
                />
                {author && ` by ${author}`}
            </div>
        )
    }

    return null
}
