import QuillCursors from 'quill-cursors/src/cursors'
import Quill from 'quill/core'
import Blockquote from 'quill/formats/blockquote'
import CodeBlock, { Code as InlineCode } from 'quill/formats/code'
import Header from 'quill/formats/header'
import Image from 'quill/formats/image'
import { IndentClass } from 'quill/formats/indent'
import Italic from 'quill/formats/italic'
import Link from 'quill/formats/link'
import List, { ListItem } from 'quill/formats/list'
import Script from 'quill/formats/script'
import Strike from 'quill/formats/strike'
import Underline from 'quill/formats/underline'
import Toolbar from 'quill/modules/toolbar'
import Snow from 'quill/themes/snow'
import AuthorsManager from '../../pages/Editor/AuthorsManager'
import EmojiPickerManager from '../../pages/Editor/EmojiPickerManager'
import MentionsManager from '../../pages/Editor/MentionsManager'
// Custom Quill Classes
import MouseOverManager from '../../pages/Editor/MouseOverManager'
import SelectionManager from '../../pages/Editor/SelectionManager'
import IdAttribute from '../../quill/attributes/Id'
import { KeepAuthorAttribute } from '../../quill/attributes/KeepAuthor'
import { Divider } from '../../quill/blots/Divider'
import { DocumentMentionBlot } from '../../quill/blots/DocumentMention'
import { MentionBlot } from '../../quill/blots/Mention'
import { Bold } from '../../quill/formats/Bold'
import Authorship, { AuthorClass } from '../../quill/modules/Authorship'
import Clipboard from '../../quill/modules/Clipboard'
import { Emoji, EmojiEmbed } from '../../quill/modules/Emoji'
import FileDrop from '../../quill/modules/FileDrop'
import FilePaste from '../../quill/modules/FilePaste'
import History from '../../../data/undo/UndoModule'
import Permissions from '../../quill/modules/Permissions'
import Placeholder from '../../quill/modules/Placeholder'
import { BlockEmbed } from '../blots/BlockEmbed'
import { PaneEmbed } from '../blots/PaneEmbed'
import { CommentMarking, Mark } from '../modules/CommentMarking'
import Keyboard from '../modules/Keyboard'

Quill.register(
    {
        'formats/blockquote': Blockquote,
        'formats/code-block': CodeBlock,
        'formats/header': Header,
        'formats/list': List,
        'formats/list-item': ListItem,
        'formats/bold': Bold,
        'formats/code': InlineCode,
        'formats/italic': Italic,
        'formats/link': Link,
        'formats/script': Script,
        'formats/strike': Strike,
        'formats/underline': Underline,
        'formats/indent': IndentClass,
        'formats/image': Image,
        'modules/toolbar': Toolbar,
        'themes/snow': Snow
    },
    true
)
Quill.register('modules/permissions', Permissions)
Quill.register('modules/authorship', Authorship)
Quill.register('modules/multi-cursor', QuillCursors)
Quill.register('modules/clipboard', Clipboard, true)
Quill.register('modules/keyboard', Keyboard, true)
Quill.register('modules/history', History, true)
Quill.register('modules/file-paste', FilePaste)
Quill.register('modules/file-drop', FileDrop)
Quill.register('modules/mentions-manager', MentionsManager)
Quill.register('modules/selection-manager', SelectionManager)
Quill.register('modules/authors-manager', AuthorsManager)
Quill.register('modules/comment-marking', CommentMarking)
Quill.register('modules/emoji', Emoji)
Quill.register('modules/emoji-picker-manager', EmojiPickerManager)
Quill.register('modules/mouseover-manager', MouseOverManager)
Quill.register('modules/placeholder', Placeholder)

Quill.register('formats/emoji', EmojiEmbed)
Quill.register('formats/document-mention', DocumentMentionBlot)
Quill.register('formats/mention', MentionBlot)
Quill.register('formats/author', AuthorClass)

Quill.register('formats/divider', Divider)
Quill.register('formats/block-embed', BlockEmbed)
Quill.register('formats/bold', Bold, true)
Quill.register('formats/mark', Mark)

Quill.register(KeepAuthorAttribute)
Quill.register(IdAttribute)

export function createQuillInstance(usePaneEmbed: boolean = true) {
    if (usePaneEmbed) {
        Quill.register('formats/pane-embed', PaneEmbed)
    }

    return Quill
}

export default Quill
