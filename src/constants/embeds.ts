export const IMAGE_EMBED_CLASS_NAME = 'ImageEmbed'

export const BLOCK_EMBED_BLOT_NAME = 'block-embed'

export const PANE_EMBED_BLOT_NAME = 'pane-embed'

export const PANE_SERVICE_NAME = 'pane'

export const PANE_CONTAINER_CLASS_NAME = 'pane-container'

export const ACTIVE_EMBED_CLASS = 'embed-is-active'

export const RESIZEABLE_SERVICES = [
    'invision',
    'prototype',
    'freehand',
    'image',
    'video'
]

export const OMIT_AUTHORSHIP_SERVICES = [
    ...RESIZEABLE_SERVICES,
    PANE_SERVICE_NAME
]
