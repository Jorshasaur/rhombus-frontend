import React from 'react'

import NimbleEmoji from 'emoji-mart/dist/components/emoji/nimble-emoji'
import NotFound from 'emoji-mart/dist/components/not-found'
import Category from 'emoji-mart/dist/components/category'

export class CustomCategory extends Category {
    render() {
        const {
            id,
            name,
            hasStickyPosition,
            emojiProps,
            i18n,
            notFound,
            notFoundEmoji,
            searchText,
            anchorClicked
        } = this.props
        const emojis = this.getEmojis()
        let labelStyles = {}
        let labelSpanStyles = {}
        let containerStyles = {}
        if (!emojis) {
            containerStyles = {
                display: 'none'
            }
        } else if (id !== 'search' && searchText.length && !anchorClicked) {
            containerStyles = {
                display: 'none'
            }
        }

        if (!hasStickyPosition) {
            labelStyles = {
                height: 28
            }

            labelSpanStyles = {
                position: 'absolute'
            }
        }

        return (
            <div
                ref={this.setContainerRef}
                className="emoji-mart-category"
                style={containerStyles}>
                <div
                    style={labelStyles}
                    data-name={name}
                    className="emoji-mart-category-label">
                    <span style={labelSpanStyles} ref={this.setLabelRef}>
                        {i18n.categories![id]}
                    </span>
                </div>

                {emojis &&
                    emojis.map((emoji) =>
                        NimbleEmoji({
                            emoji: emoji,
                            data: this.data,
                            ...emojiProps
                        })
                    )}

                {emojis && !emojis.length && (
                    <NotFound
                        i18n={i18n}
                        notFound={notFound}
                        notFoundEmoji={notFoundEmoji}
                        data={this.data}
                        emojiProps={emojiProps}
                    />
                )}
            </div>
        )
    }
}
