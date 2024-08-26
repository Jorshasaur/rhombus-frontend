export const RHOMBUS_PRIVACY_COOKIE_KEY = 'rhombus-privacy-seen'

export const RHOMBUS_PRIVACY_COOKIE_TTL = 365

export const SHORTKEY = /Mac/i.test(navigator.platform) ? 'metaKey' : 'ctrlKey'

export const IS_END_TO_END_TEST = window.__call$ != null || navigator.webdriver

export const NEW_LINE = '\n'

export const UPDATING_DOCUMENT_DEBOUNCE = 1000 // 1s

export const MEDIA_BUTTON_TYPES = {
    file: 'File',
    image: 'Image'
}

export const MAIN_EDITOR_ID = 'main-editor-container'

export const GLOBAL_NAVIGATION_ID = 'global-navigation'
