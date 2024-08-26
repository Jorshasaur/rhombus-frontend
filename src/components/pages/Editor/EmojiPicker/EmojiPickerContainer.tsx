import { connect } from 'react-redux'
import { EmojiPicker } from './EmojiPicker'
import { clearEmojiPicker } from '../../../../data/actions'
import { RootState } from '../../../../data/reducers'

const mapStateToProps = (state: RootState) => ({
    ...state.emojiPicker
})

const mapDispatchToProps = {
    clearEmojiPicker
}

export default connect(mapStateToProps, mapDispatchToProps)(EmojiPicker)
