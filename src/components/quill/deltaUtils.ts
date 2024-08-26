import { DeltaStatic } from 'quill-delta'
import {
    BLOCK_EMBED_BLOT_NAME,
    PANE_EMBED_BLOT_NAME
} from '../../constants/embeds'

function isEmbedChange(delta: DeltaStatic) {
    const { ops } = delta
    return (
        ops != null &&
        ops.length === 3 &&
        ops[0].retain != null &&
        typeof ops[1].insert === 'object' &&
        (ops[1].insert[BLOCK_EMBED_BLOT_NAME] != null ||
            ops[1].insert[PANE_EMBED_BLOT_NAME] != null) &&
        ops[2].delete != null
    )
}

export default {
    isEmbedChange
}
