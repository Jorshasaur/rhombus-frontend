import React from 'react'
import { isEqual } from 'lodash'
import { NimblePicker } from 'emoji-mart'
import { CustomCategory } from './CustomCategory/CustomCategory'
import Anchors from 'emoji-mart/dist/components/anchors'
import Search from 'emoji-mart/dist/components/search'
import { measureScrollbar } from 'emoji-mart/dist/utils'
import Skins from 'emoji-mart/dist/components/skins'
interface CustomNimblePickerProps {
    searchData?: string
}

interface CustomNimblePickerState {
    skin: number
    anchorClicked: boolean
}

export class CustomNimblePicker extends NimblePicker {
    componentDidUpdate(
        prevProps: CustomNimblePickerProps,
        prevState: CustomNimblePickerState,
        snapshot: object
    ) {
        if (!isEqual(this.props.searchData, prevProps.searchData)) {
            this.handleSearch(this.props.searchData)
        }
        super.componentDidUpdate!(prevProps, prevState, snapshot)
    }
    render() {
        const {
            perLine,
            emojiSize,
            set,
            sheetSize,
            style,
            color,
            native,
            backgroundImageFn,
            emojisToShowFilter,
            emojiTooltip,
            include,
            exclude,
            recent,
            autoFocus,
            notFound,
            notFoundEmoji,
            searchText
        } = this.props
        const { skin, anchorClicked } = this.state
        const width = perLine * (emojiSize + 12) + 12 + 2 + measureScrollbar()
        const categories = this.getCategories()
        return (
            <div
                style={{ width, ...style }}
                className="emoji-mart"
                onKeyDown={this.handleKeyDown}>
                <div className="emoji-mart-bar">
                    <Anchors
                        ref={this.setAnchorsRef}
                        data={this.data}
                        i18n={this.i18n}
                        color={color}
                        categories={this.categories}
                        onAnchorClick={this.handleAnchorClick}
                        icons={this.icons}
                    />
                </div>

                <Search
                    ref={this.setSearchRef}
                    onSearch={this.handleSearch}
                    data={this.data}
                    i18n={this.i18n}
                    emojisToShowFilter={emojisToShowFilter}
                    include={include}
                    exclude={exclude}
                    custom={this.CUSTOM_CATEGORY.emojis}
                    autoFocus={autoFocus}
                />
                <div
                    ref={this.setScrollRef}
                    className="emoji-mart-scroll"
                    onScroll={this.handleScroll}>
                    <div className="emoji-mart-skin-container">
                        <div className="emoji-mart-preview-skins">
                            <Skins
                                skin={skin}
                                onChange={this.handleSkinChange}
                            />
                        </div>
                    </div>
                    {categories.map((category, i) => {
                        return (
                            <CustomCategory
                                ref={this.setCategoryRef.bind(
                                    this,
                                    `category-${i}`
                                )}
                                key={category.name}
                                id={category.id}
                                name={category.name}
                                emojis={category.emojis}
                                perLine={perLine}
                                native={native}
                                hasStickyPosition={this.hasStickyPosition}
                                data={this.data}
                                i18n={this.i18n}
                                searchText={searchText}
                                anchorClicked={anchorClicked}
                                recent={
                                    category.id === this.RECENT_CATEGORY.id
                                        ? recent
                                        : undefined
                                }
                                custom={
                                    category.id === this.RECENT_CATEGORY.id
                                        ? this.CUSTOM_CATEGORY.emojis
                                        : undefined
                                }
                                emojiProps={{
                                    native,
                                    skin,
                                    size: emojiSize,
                                    set,
                                    sheetSize,
                                    forceSize: native,
                                    tooltip: emojiTooltip,
                                    backgroundImageFn,
                                    // No op on over to disable hiding the skin picker
                                    onOver: () => {},
                                    onLeave: this.handleEmojiLeave,
                                    onClick: this.handleEmojiClick
                                }}
                                notFound={notFound}
                                notFoundEmoji={notFoundEmoji}
                            />
                        )
                    })}
                </div>
            </div>
        )
    }
    handleAnchorClick(category: string, i: number) {
        this.setState({ anchorClicked: true })
        super.handleAnchorClick(category, i)
    }
}
