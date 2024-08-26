import GlobalNavigation from '@invisionapp/global-navigation'
import Enzyme, { mount, shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import React from 'react'
import sinon from 'sinon'
import Navigation from '../../components/pages/Navigation/Navigation'
import { BannerType } from '../../data/reducers/banner'
import { keycodes } from '../../interfaces/keycodes'
import {
    ARCHIVE_NAVIGATION_COPY,
    DOCUMENT_HISTORY_NAVIGATION_COPY,
    SAVE_PRESSED_COPY,
    THEMES_NAVIGATION_COPY
} from '../../constants/messages'
import { permissions } from '../mockData/permissions'

Enzyme.configure({ adapter: new Adapter() })

jest.mock(
    '@invisionapp/helios/illustrations/spot/space-has-been-archived.svg',
    () => {
        return { ReactComponent: <div /> }
    }
)

jest.mock('@invisionapp/helios', () => {
    return {
        Text: 'text',
        Radio: 'radio',
        Alert: 'alert',
        Toast: 'toast',
        Dialog: 'dialog',
        Modal: ({ children }) => <div className="modal">{children}</div>,
        Illustration: 'illustration'
    }
})

const setElementCoordinatesSpy = sinon.spy()
const archiveDocumentSpy = sinon.spy()

const props = {
    banner: {},
    members: [],
    setElementCoordinates: setElementCoordinatesSpy,
    archiveDocument: archiveDocumentSpy,
    subscribeToDocument: jest.fn(),
    unsubscribeFromDocument: jest.fn(),
    documentId: 'document-id',
    title: 'Title',
    updatedAt: new Date(),
    permissions,
    bannerOffset: false,
    archivedDocument: false,
    isArchived: false,
    updating: false,
    isSubscribed: true,
    navigationHeight: 75,
    showDocumentHistory: jest.fn(),
    canUseDocumentHistory: false,
    canUseTheme: false
}

describe('Navigation', () => {
    it('should render self', () => {
        const wrapper = shallow(<Navigation {...props} />)
        expect(wrapper.at(0).find('.globalNavigation')).toHaveLength(1)
    })
    it('should mount the InVision Global Navigation', () => {
        const wrapper = shallow(<Navigation {...props} />)
        expect(wrapper.find(GlobalNavigation)).toHaveLength(1)
    })
    it('should set element coordinates', () => {
        const wrapper = mount(<Navigation {...props} />)
        wrapper.mount()
        expect(setElementCoordinatesSpy.callCount).toBeGreaterThanOrEqual(1)
        wrapper.unmount()
    })
    it('should hide last edited without permissions', () => {
        const noPermissionProps = {
            ...props,
            permissions: {
                ...permissions,
                canEdit: false,
                canComment: false
            }
        }
        const wrapper = mount(<Navigation {...noPermissionProps} />)
        expect(
            wrapper.find('.globalNavigation').hasClass('noPermissions')
        ).toBe(true)
    })
    it('should hide Archive Doc without permissions', () => {
        const noPermissionProps = {
            ...props,
            permissions: {
                ...permissions,
                canEdit: false,
                canComment: true
            }
        }
        const wrapper = mount(<Navigation {...noPermissionProps} />)
        wrapper
            .find('#settingsDropdownMoreIcon')
            .first()
            .simulate('click')
        wrapper.update()

        expect(wrapper.text()).not.toContain(ARCHIVE_NAVIGATION_COPY)
    })

    it('hides theme picker option without FF', () => {
        const wrapper = mount(<Navigation {...props} canUseTheme={false} />)
        wrapper
            .find('#settingsDropdownMoreIcon')
            .first()
            .simulate('click')
        wrapper.update()

        expect(wrapper.text()).not.toContain(THEMES_NAVIGATION_COPY)
    })

    it('disables dark mode when user is not allowed', () => {
        window.matchMedia = jest.fn(() => ({
            removeListener: jest.fn()
        }))
        const wrapper = mount(<Navigation {...props} canUseTheme={false} />)
        const inst = wrapper.instance() as any

        inst.componentDidUpdate({
            ...props,
            canUseTheme: true
        })

        expect(
            document.querySelector('html')!.getAttribute('color-scheme')
        ).toBe('light')
    })

    describe('when user is allowed', () => {
        it('enables dark mode when theme is "system" and OS is set to dark', () => {
            window.matchMedia = jest.fn(() => ({
                addListener: jest.fn(),
                matches: true
            }))
            localStorage.setItem('@rhombus/theme', 'system')
            const wrapper = mount(<Navigation {...props} canUseTheme />)
            const inst = wrapper.instance() as any

            inst.componentDidUpdate({
                ...props,
                canUseTheme: false
            })

            expect(
                document.querySelector('html')!.getAttribute('color-scheme')
            ).toBe('dark')
        })

        it('enables light mode when theme is "light"', () => {
            window.matchMedia = jest.fn(() => ({
                addListener: jest.fn(),
                matches: true
            }))
            localStorage.setItem('@rhombus/theme', 'light')
            const wrapper = mount(<Navigation {...props} canUseTheme />)
            const inst = wrapper.instance() as any

            inst.componentDidUpdate({
                ...props,
                canUseTheme: false
            })

            expect(wrapper.find('#theme-light').prop('isChecked')).toBe(true)
            expect(
                document.querySelector('html')!.getAttribute('color-scheme')
            ).toBe('light')
        })

        it('enables dark mode when theme is "dark"', () => {
            window.matchMedia = jest.fn(() => ({
                addListener: jest.fn(),
                matches: false
            }))
            localStorage.setItem('@rhombus/theme', 'dark')
            const wrapper = mount(<Navigation {...props} canUseTheme />)
            const inst = wrapper.instance() as any

            inst.componentDidUpdate({
                ...props,
                canUseTheme: false
            })

            expect(wrapper.find('#theme-dark').prop('isChecked')).toBe(true)
            expect(
                document.querySelector('html')!.getAttribute('color-scheme')
            ).toBe('dark')
        })

        it.each`
            theme
            ${'light'}
            ${'dark'}
            ${'system'}
        `('saves the $theme theme in local storage', ({ theme }) => {
            window.matchMedia = jest.fn(() => ({
                addListener: jest.fn(),
                matches: false
            }))
            localStorage.setItem('@rhombus/theme', undefined)
            const wrapper = mount(<Navigation {...props} canUseTheme />)
            const inst = wrapper.instance() as any

            inst.componentDidUpdate({
                ...props,
                canUseTheme: false
            })

            wrapper.setState({ renderThemePicker: true })

            wrapper.find(testid(`theme-${theme}`)).simulate('change')

            const currentTheme = localStorage.getItem('@rhombus/theme')

            expect(currentTheme).toBe(theme)
        })
    })

    it('should show that the document is updating', () => {
        const updatingProps = {
            ...props,
            updating: true
        }
        const wrapper = mount(<Navigation {...updatingProps} />)
        expect(wrapper.find(GlobalNavigation).text()).toContain('Updating...')
    })
    it('should handle the document save event', () => {
        const map = {} as any
        const preventDefault = jest.fn()
        window.addEventListener = jest.fn((event, cb) => {
            map[event] = cb
        })
        const wrapper = mount(<Navigation {...props} />)
        map.keydown({
            ctrlKey: true,
            keyCode: keycodes.S,
            preventDefault
        })
        expect(preventDefault).toHaveBeenCalled()
        expect(wrapper.find(GlobalNavigation).text()).toContain(
            SAVE_PRESSED_COPY.updated
        )
    })
    it('should handle the document save event while updating', () => {
        const updatingProps = {
            ...props,
            updating: true
        }
        const map = {} as any
        const preventDefault = jest.fn()
        window.addEventListener = jest.fn((event, cb) => {
            map[event] = cb
        })
        const wrapper = mount(<Navigation {...updatingProps} />)
        map.keydown({
            ctrlKey: true,
            keyCode: keycodes.S,
            preventDefault
        })
        expect(preventDefault).toHaveBeenCalled()
        expect(wrapper.find(GlobalNavigation).text()).toContain(
            SAVE_PRESSED_COPY.updating
        )
    })
    it('should not update the text on save event when the user does not have permissions', () => {
        const noPermissionProps = {
            ...props,
            permissions: {
                ...permissions,
                canEdit: false,
                canComment: true
            }
        }
        const map = {} as any
        const preventDefault = jest.fn()
        window.addEventListener = jest.fn((event, cb) => {
            map[event] = cb
        })
        const wrapper = mount(<Navigation {...noPermissionProps} />)
        map.keydown({
            ctrlKey: true,
            keyCode: keycodes.S,
            preventDefault
        })
        expect(preventDefault).toHaveBeenCalled()
        expect(wrapper.find(GlobalNavigation).text()).not.toContain(
            SAVE_PRESSED_COPY.updated
        )
    })
    it('should show that the document has updates pending when connection is lost', () => {
        const updatePendingProps = {
            ...props,
            banner: {
                type: BannerType.CONNECTION_LOST_ERROR
            },
            updating: true
        }
        const wrapper = mount(<Navigation {...updatePendingProps} />)
        expect(wrapper.find(GlobalNavigation).text()).toContain(
            'Updates pending'
        )
    })
    it('should hide document history without feature flag access', () => {
        const wrapper = mount(<Navigation {...props} />)
        wrapper
            .find('#settingsDropdownMoreIcon')
            .first()
            .simulate('click')
        wrapper.update()

        expect(wrapper.text()).not.toContain(DOCUMENT_HISTORY_NAVIGATION_COPY)
    })
    it('should show document history with feature flag access', () => {
        const canUseDocumentHistoryProps = {
            ...props,
            canUseDocumentHistory: true
        }
        const wrapper = mount(<Navigation {...canUseDocumentHistoryProps} />)
        wrapper
            .find('#settingsDropdownMoreIcon')
            .first()
            .simulate('click')
        wrapper.update()

        expect(wrapper.text()).toContain(DOCUMENT_HISTORY_NAVIGATION_COPY)
    })
})
