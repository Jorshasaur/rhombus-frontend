function setDevMode() {
    localStorage.setItem('devMode', 'true')
}

function removeDevMode() {
    localStorage.removeItem('devMode')
}

export function isDevelopment() {
    return process.env.NODE_ENV === 'development'
}

export function isDevMode() {
    return isDevelopment() && localStorage.getItem('devMode') === 'true'
}

export function mapDevModeToWindow() {
    window.setDevMode = setDevMode
    window.removeDevMode = removeDevMode
}
