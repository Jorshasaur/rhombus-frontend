import activeEmbed from '../activeEmbed/reducers'
import authors from '../authors'
import { AuthorsState } from '../authors/interfaces'
import comments, { CommentsState } from '../comments/reducers'
import documentHistory from '../documentHistory'
import { DocumentHistoryState } from '../documentHistory/interfaces'
import images from '../images'
import { ImagesStoreState } from '../images/interfaces'
import archivedDocument from './archivedDocument'
import assets, { AssetsState } from './assets'
import banner, { BannerState } from './banner'
import currentDocument, { CurrentDocumentState } from './currentDocument'
import drag, { DragState } from './drag'
import elementCoordinates, {
    ElementCoordinatesState
} from './elementCoordinates'
import emojiPicker, { EmojiPickerState } from './emojiPicker'
import featureFlags, { FeatureFlags } from './featureFlags'
import loggedIn from './loggedIn'
import mentions, { MentionsState } from './mentions'
import missingDocument from './missingDocument'
import mouseover, { MouseOverState } from './mouseover'
import permissions, { PermissionsState } from './permissions'
import placeholder, { PlaceholderState } from './placeholder'
import plusMenu, { PlusMenuState } from './plusMenu'
import { selection, SelectionState } from './selection'
import title from './title'
import updatedAt from './updatedAt'
import user, { UserState } from './user'

export const reducer = {
    activeEmbed,
    assets,
    authors,
    banner,
    comments,
    currentDocument,
    missingDocument,
    archivedDocument,
    drag,
    elementCoordinates,
    emojiPicker,
    mentions,
    mouseover,
    permissions,
    selection,
    title,
    user,
    updatedAt,
    placeholder,
    loggedIn,
    featureFlags,
    documentHistory,
    images,
    plusMenu
}

export interface RootState {
    activeEmbed: string | null
    assets: AssetsState
    authors: AuthorsState
    banner: BannerState
    comments: CommentsState
    currentDocument: CurrentDocumentState
    drag: DragState
    elementCoordinates: ElementCoordinatesState
    emojiPicker: EmojiPickerState
    mentions: MentionsState
    mouseover: MouseOverState
    permissions: PermissionsState
    selection: SelectionState
    title: string
    updatedAt: Date
    user: UserState
    missingDocument: boolean
    archivedDocument: boolean
    placeholder: PlaceholderState
    loggedIn: boolean
    featureFlags: FeatureFlags
    images: ImagesStoreState
    plusMenu: PlusMenuState
    documentHistory: DocumentHistoryState
}
