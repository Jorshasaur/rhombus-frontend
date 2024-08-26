const BETA_TIER = 'testing'

export function isOnBeta(serverTier: string = '') {
    return serverTier === BETA_TIER
}