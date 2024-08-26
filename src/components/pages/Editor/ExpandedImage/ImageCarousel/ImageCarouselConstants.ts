export const MARGIN = 110
export const IMAGE_TRANSITION_TIME = 200
export const KEYBOARD_ZOOM_TRANSITION_TIME = 100

export const DEFAULT_X_POSITION = 0
export const DEFAULT_Y_POSITION = 0

export const ZOOM_STEP_UP = 2
export const ZOOM_STEP_DOWN = 0.5
export const WHEEL_ZOOM_STEP_MULTIPLIER = 0.0009
export const INITIAL_SCALE = 1
export const INITIAL_CURRENT_SCALE = 100
export const MAX_SCALE_MULTIPLIER = 4

export const PANZOOM_OPTIONS = {
    maxScale: INITIAL_SCALE,
    minScale: INITIAL_SCALE,
    startX: DEFAULT_X_POSITION,
    startY: DEFAULT_Y_POSITION,
    animate: true,
    disablePan: true,
    startScale: 0.5
}

export interface ImageSizeObject {
    width?: number
    height?: number
    scaleFactor?: number
}

export enum DIRECTION {
    RIGHT = 'right',
    LEFT = 'left',
    NONE = ''
}

export interface PanObject {
    x: number
    y: number
}
