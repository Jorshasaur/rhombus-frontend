import React from 'react'
import Enzyme, { mount } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import Editor from '../../components/pages/Editor/Editor'
import { markModifier } from '../../components/quill/modules/CommentMarking/modifier'
import { UNSAVED_CHANGES_MESSAGE } from '../../constants/messages'
import { SOCKET } from '../../constants/network'
import { Modal, Text } from '@invisionapp/helios'
import {
    BannerColor,
    BannerPosition,
    BannerType
} from '../../data/reducers/banner'
import ExpandedImageContainer from '../../components/pages/Editor/ExpandedImage/ExpandedImageContainer'
import PlusMenu from '../../components/pages/Editor/PlusMenu/PlusMenu'
const mockOTOn = jest.fn()
const mockAddModifier = jest.fn()

const Quill: any = jest.genMockFromModule('quill/core')

jest.mock('../../components/quill/QuillSocketIOAdapter', () => {
    return {
        QuillSocketIOAdapter: function() {
            const handlers = {}

            return {
                on: jest.fn((eventName: string, handler: Function) => {
                    handlers[eventName] = handler
                }),
                emit: jest.fn((eventName: string, ...args: any[]) => {
                    handlers[eventName](...args)
                }),
                setDocumentContents: jest.fn(),
                updatePermissions: jest.fn(),
                connect: jest.fn(() => {
                    console.log('!! CONNECT')
                })
            }
        }
    }
})

jest.mock('../../components/ot/OTClient', () => {
    return {
        OTEditorClient: function() {
            return {
                on: mockOTOn,
                addModifier: mockAddModifier,
                resetClientWithRevision: jest.fn(),
                isSynchronized: jest.fn(() => true)
            }
        }
    }
})
jest.mock('create-emotion-styled')

jest.mock('js-cookie', () => {
    return {
        get: jest.fn(() => {
            return 'true'
        })
    }
})

jest.mock('@invisionapp/helios', () => {
    return {
        Alert: 'alert',
        Modal: 'modal',
        Text: (props: any) => {
            let textString = ''
            props.children.forEach((child: any) => {
                if (typeof child === 'string') {
                    textString += ` ${child}`
                }
            })
            return textString
        },
        Padded: 'padded'
    }
})

jest.mock('@invisionapp/helios/icons', () => ({
    Close: () => 'Close'
}))

jest.mock(
    '../../components/pages/Editor/PrivacyDisclaimer/PrivacyDisclaimer.tsx',
    () => {
        return 'PrivacyDisclaimer'
    }
)

jest.mock('../../components/quill/QuillSocketIOAdapter')

jest.mock('quill-cursors/src/cursors', () => {
    return {}
})

jest.mock(
    '../../components/pages/Editor/Placeholder/PlaceholderContainer.tsx',
    () => {
        return 'placeholder'
    }
)

jest.mock('../../components/pages/Editor/Authors/AuthorsContainer.tsx', () => {
    return 'authors'
})

jest.mock(
    '../../components/pages/Editor/EmojiPicker/EmojiPickerContainer.tsx',
    () => {
        return 'emojiPicker'
    }
)

jest.mock(
    '../../components/pages/Editor/LineControls/LineControlsContainer.ts',
    () => {
        return 'lineControls'
    }
)

jest.mock(
    '../../components/pages/Editor/Comments/CommentsContainer.tsx',
    () => {
        return 'comments'
    }
)

jest.mock(
    '../../components/pages/Editor/ExpandedImage/ExpandedImageContainer.tsx',
    () => {
        return 'ExpandedImageContainer'
    }
)

jest.mock('../../components/pages/Editor/PlusMenu/PlusMenu', () => {
    return 'PlusMenu'
})

jest.mock('@invisionapp/helios/icons/Close', () => {
    return 'close'
})

jest.mock('@invisionapp/helios/icons/InVision', () => {
    return 'invision'
})

jest.mock('@invisionapp/helios/icons/Warning', () => {
    return 'warning'
})

beforeEach(() => {
    Quill.on = jest.fn()
    Quill.enable = jest.fn()
    Quill.disable = jest.fn()
    Quill.setContents = jest.fn()
    Quill.container = document.createElement('div')
    Quill.container.id = 'quill-container'

    Quill.getModule = (moduleName: string) => {
        if (moduleName === 'multi-cursor') {
            return {
                removeCursor: jest.fn()
            }
        }
        return
    }

    Quill.root = {
        spellcheck: true
    }
})

Enzyme.configure({ adapter: new Adapter() })
type Action = 'PUSH' | 'POP' | 'REPLACE'
const action = 'PUSH' as Action

const currentDocument = {
    createdAt: new Date(),
    id: 'document-id',
    isArchived: false,
    ownerId: 'owner-id',
    teamId: 'team-id',
    title: 'Test Document',
    updatedAt: new Date(),
    members: [],
    success: true,
    contents: {
        revision: 0,
        delta: {}
    },
    teamMembers: [],
    permissions: {
        canEdit: true,
        canComment: false
    },
    updating: false,
    isSubscribed: true
}

const user = {
    userId: 1,
    companyId: 1,
    teamId: 'team-id',
    sessionId: 'session-id',
    name: 'Doc User',
    email: 'doc.user@test.com'
}
const editorProps = {
    bold: false,
    blockquote: false,
    codeBlock: false,
    formatSelection: jest.fn(),
    header: 1,
    index: 1,
    italic: false,
    selectionLength: 0,
    selectionType: 0,
    selectionBlotName: '',
    setCurrentDocument: jest.fn(),
    documentIsMissing: jest.fn(),
    missingDocument: false,
    setMembers: jest.fn(),
    fetchCurrentDocument: jest.fn(() => {
        return Promise.resolve()
    }),
    fetchUser: jest.fn(),
    fetchTeamMembers: jest.fn(),
    fetchAllThreads: jest.fn(),
    fetchFeatureFlags: jest.fn(),
    setTitle: jest.fn(),
    setUpdatedAt: jest.fn(),
    setMissingDocument: jest.fn(),
    createNewCommentThread: jest.fn(),
    cancelNewCommentThread: jest.fn(),
    postNewComment: jest.fn(),
    unarchiveDocument: jest.fn(),
    link: 'link',
    list: 'list',
    navigationHeight: 100,
    strike: false,
    text: 'Some Text',
    underline: false,
    isFirstLine: false,
    currentDocument,
    user,
    permissions: {
        canEdit: true,
        canComment: false,
        loaded: true
    },
    mentions: {
        left: 0,
        showMentionsList: false,
        top: 0,
        members: []
    },
    clearMentionList: jest.fn(),
    title: 'Test Document',
    updatedAt: new Date(),
    match: {
        path: '/:slugAndShortId',
        url: '/Untitled-27ov7J3zfVo9utURj6usvZ',
        isExact: true,
        params: {
            slugAndShortId: 'Untitled-27ov7J3zfVo9utURj6usvZ'
        }
    },
    location: {
        pathname: '/Untitled-27ov7J3zfVo9utURj6usvZ',
        search: 'search',
        hash: 'hash',
        key: 'nzgle2',
        state: 'state'
    },
    history: {
        length: 8,
        action,
        location: {
            pathname: '/Untitled-27ov7J3zfVo9utURj6usvZ',
            search: 'search',
            hash: 'hash',
            key: 'nzgle2',
            state: 'state'
        },
        push: (path: any) => jest.fn(),
        replace: (location: any) => jest.fn(),
        go: (n: number) => jest.fn(),
        goBack: () => jest.fn(),
        goForward: () => jest.fn(),
        block: (prompt?: boolean) => jest.fn(),
        listen: (listener: any) => jest.fn(),
        createHref: (location: any) => ''
    },
    banner: {
        color: BannerColor.DANGER,
        position: BannerPosition.Bottom
    },
    showEmojiPicker: false,
    showBanner: jest.fn(),
    hideBanner: jest.fn(),
    setCommentOnlyPermissions: jest.fn(),
    setPermissions: jest.fn(),
    hasUnsavedComments: false,
    hasCommentError: false,
    keepAlive: jest.fn(),
    loggedIn: true,
    setDocumentUpdating: jest.fn(),
    activeImageId: '',
    setDocumentIsSubscribed: jest.fn(),
    unsubscribeFromDocument: jest.fn(),
    setElementCoordinates: jest.fn(),
    showPlusMenu: false,
    openPlusMenu: jest.fn(),
    closePlusMenu: jest.fn(),
    plusMenu: false
}

describe('Editor', () => {
    it('should be an instance of Editor', () => {
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance()
        // @ts-ignore
        inst.quill = Quill
        expect(inst).toBeInstanceOf(Editor)
    })

    it('should set up the Quill Socket IO Adapter', () => {
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any
        inst.quill = Quill
        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)
        wrapper.update()
        expect(mockAddModifier).toHaveBeenCalledWith(markModifier)
        expect(mockOTOn.mock.calls[0][0]).toBe('apply-operation-error')
        expect(inst.quillServerAdapter.on).toHaveBeenCalledTimes(12)
    })

    it('should redirect to request-access when called with inappropriate permissions', () => {
        window.location.assign = jest.fn()
        const noPermissionProps = {
            ...editorProps,
            permissions: {
                canEdit: false,
                canComment: false,
                loaded: true
            }
        }
        mount(<Editor {...noPermissionProps} />)
        expect(window.location.assign).toBeCalledWith(
            '/request-access/rhombus/08fd77f8-1ca4-41a0-a281-32b925df06a3'
        )
    })

    it('should handle server adapter reset doc event', async () => {
        const showBanner = jest.fn()
        const wrapper = mount(
            <Editor {...editorProps} showBanner={showBanner} />
        )
        const inst = wrapper.instance() as any
        inst.quill = Quill
        inst.quill.disable = jest.fn()
        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)
        inst.quillServerAdapter.disconnect = jest.fn()

        inst.quillServerAdapter.emit('reset-doc')
        expect(showBanner).toHaveBeenCalledWith(
            BannerType.RESET_DOC,
            BannerColor.DANGER,
            BannerPosition.Top
        )
        expect(inst.quill.disable).toHaveBeenCalled()
        expect(inst.quillServerAdapter.disconnect).toHaveBeenCalled()
    })

    it('should handle server adapter ready event', async () => {
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any
        inst.quill = Quill
        inst.serverAdapterReady = jest.fn()

        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)

        inst.quillServerAdapter.emit('ready')
        expect(inst.serverAdapterReady).toBeCalled()
    })

    it('should handle server adapter document archived event', async () => {
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any
        inst.quill = Quill

        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)

        inst.quillServerAdapter.emit(SOCKET.documentArchived)
        expect(inst.props.fetchCurrentDocument).toBeCalled()
    })

    it('should handle server adapter document unarchived event', async () => {
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any
        inst.quill = Quill

        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)

        inst.quillServerAdapter.emit(SOCKET.documentUnarchived)
        expect(inst.props.fetchCurrentDocument).toBeCalled()
    })

    it('should handle document permissions changed', async () => {
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any
        inst.quill = Quill

        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)

        inst.quillServerAdapter.emit(SOCKET.documentPermissionsChanged, {
            canEdit: true,
            canComment: true
        })
        expect(inst.props.setPermissions).toBeCalled()
        expect(inst.quillServerAdapter.updatePermissions).toHaveBeenCalled()
    })

    it('should remove user cursor on beforeunload', () => {
        // mock cursor module
        const cursorModule = {
            removeCursor: jest.fn()
        }

        Quill.getModule = (moduleName: string) => {
            if (moduleName === 'multi-cursor') {
                return cursorModule
            }
            return
        }

        // mount Editor component
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any

        // set mock Quill
        inst.quill = Quill

        inst.componentDidMount()

        // spy on removeUsersCursor
        const removeUsersCursorSpy = jest.spyOn(inst, 'removeUsersCursor')

        // attach necessary events
        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)

        // dispatch beforeunload
        const event = document.createEvent('HTMLEvents')
        event.initEvent('beforeunload', false, true)
        window.dispatchEvent(event)

        // check if removeCursor was called
        expect(removeUsersCursorSpy).toBeCalledWith(user.userId)
        expect(cursorModule.removeCursor).toBeCalledWith(user.userId)
    })

    it('should remove user cursor if Editor has invalid users', () => {
        // mock cursor module
        const cursorModule = {
            removeCursor: jest.fn()
        }

        Quill.getModule = (moduleName: string) => {
            if (moduleName === 'multi-cursor') {
                return cursorModule
            }
            return
        }

        // mount Editor component
        const wrapper = mount(<Editor {...editorProps} />)
        const inst = wrapper.instance() as any

        // set mock Quill
        inst.quill = Quill

        // spy on removeUsersCursor
        const removeUsersCursorSpy = jest.spyOn(inst, 'removeUsersCursor')

        inst.members = [
            {
                userId: 1,
                isViewing: false
            },
            {
                userId: 2,
                isViewing: true
            }
        ]

        const connectedList = {
            users: [2]
        }

        inst.hasInvalidConnectedUsers(connectedList)

        // check if removeCursor was called
        expect(removeUsersCursorSpy).toBeCalledWith(1)
        expect(cursorModule.removeCursor).toBeCalledWith(1)
    })
    it('should display a message if there are pending comments on beforeunload', () => {
        const pendingCommentProps = {
            ...editorProps,
            hasUnsavedComments: true
        }

        // mount Editor component
        const wrapper = mount(<Editor {...pendingCommentProps} />)
        const inst = wrapper.instance() as any
        // set mock Quill
        inst.quill = Quill
        // attach necessary events
        inst.setupQuillSocketIOAdapter(user, currentDocument, '#FFFFFF', true)

        // dispatch beforeunload
        const event = document.createEvent('HTMLEvents')
        event.initEvent('beforeunload', false, true)
        const message = inst.handleUserLeave(event)
        // check if removeCursor was called
        expect(message).toBe(UNSAVED_CHANGES_MESSAGE)
    })
    it('should display a modal if the user is logged out', () => {
        const modalProps = {
            ...editorProps,
            loggedIn: false
        }

        // mount Editor component
        const wrapper = mount(<Editor {...modalProps} />)
        const inst = wrapper.instance() as any
        // set mock Quill
        inst.quill = Quill

        // check if removeCursor was called
        expect(wrapper.find('.modalContainer').text()).toContain(
            "You've been logged out. Please log in again."
        )
        expect(wrapper.find(Modal)).toHaveLength(1)
        expect(wrapper.find(Text)).toHaveLength(2)
    })
    it('should display a modal if the user is logged out and has pending changes', () => {
        const pendingModalProps = {
            ...editorProps,
            loggedIn: false,
            hasUnsavedComments: true
        }

        // mount Editor component
        const wrapper = mount(<Editor {...pendingModalProps} />)
        const inst = wrapper.instance() as any
        // set mock Quill
        inst.quill = Quill

        expect(wrapper.find('.modalContainer').text()).toContain(
            "You've been logged out with unsynced changes. Don't close this tab!"
        )
        expect(wrapper.find(Modal)).toHaveLength(1)
        expect(wrapper.find(Text)).toHaveLength(2)
    })

    it('should render expanded image if there is an active image', () => {
        const activeImageProps = {
            ...editorProps,
            activeImageId: 'activeImageId'
        }
        const wrapper = mount(<Editor {...activeImageProps} />)
        expect(wrapper.find(ExpandedImageContainer)).toHaveLength(1)
    })

    it("should not render expanded image if there isn't an active image", () => {
        const activeImageProps = {
            ...editorProps,
            activeImageId: ''
        }
        const wrapper = mount(<Editor {...activeImageProps} />)
        expect(wrapper.find(ExpandedImageContainer)).toHaveLength(0)
    })
    it('should set spellcheck false when canComment is true', () => {
        const editorCanCommentProps = {
            ...editorProps,
            permissions: {
                canEdit: false,
                canComment: true,
                loaded: true
            }
        }
        const wrapper = mount(<Editor {...editorCanCommentProps} />)
        const inst = wrapper.instance() as any
        inst.quill = Quill
        inst.render()
        expect(inst.quill.root.spellcheck).toBeFalsy()
    })
    it('should show the new plus menu correctly ', () => {
        const showPlusMenuProps = {
            ...editorProps,
            showPlusMenu: true
        }
        const wrapper = mount(<Editor {...showPlusMenuProps} />)
        expect(wrapper.find(PlusMenu)).toHaveLength(1)
    })
    it('should hide the new plus menu correctly ', () => {
        const showPlusMenuProps = {
            ...editorProps,
            showPlusMenu: false
        }
        const wrapper = mount(<Editor {...showPlusMenuProps} />)
        expect(wrapper.find(PlusMenu)).toHaveLength(0)
    })
})
