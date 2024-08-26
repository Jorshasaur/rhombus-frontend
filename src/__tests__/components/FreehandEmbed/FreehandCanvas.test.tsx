import React from 'react'
import { mount, MountRendererProps } from 'enzyme'
import FreehandCanvas from '../../../components/pages/Editor/Blots/FreehandEmbed/FreehandCanvas'
import { Zoom, Popover } from '@invisionapp/helios'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { createContainer } from '../../utils'
import URI from 'urijs'
import _ from 'lodash'
import { FreehandCanvas2D } from '@invisionapp/freehand-canvas-2d'
import { noop } from 'lodash'
import FreehandEmbedContainer from '../../../components/pages/Editor/Blots/FreehandEmbed/FreehandEmbedContainer'
// @ts-ignore
_.debounce = (f) => f

jest.mock('pubsub-js', () => ({
    subscribe: (e: string, fn: Function) => fn('freehand-document-updated', 1)
}))

const freehand = {
    state: { id: 1 },
    setState: jest.fn()
}

jest.mock('@invisionapp/freehand-canvas-2d', () => {
    class F {
        zoomIn: () => {}
        zoomOut: () => {}
        resetViewport: () => {}
        redraw: () => {}
        updateSize: () => {}
    }

    F.prototype.zoomIn = jest.fn()
    F.prototype.zoomOut = jest.fn()
    F.prototype.resetViewport = jest.fn()
    F.prototype.redraw = jest.fn()
    F.prototype.updateSize = jest.fn()

    return {
        FreehandCanvas2D: F
    }
})

const baseProps = {
    id: '1',
    content: new ArrayBuffer(1),
    onZoom: noop,
    onPan: noop,
    freehand: (freehand as any) as FreehandEmbedContainer
}

const createComponent = (props: any = {}, options?: MountRendererProps) => {
    const subdomain = new URI().subdomain()

    const baseProps = {
        originalLink: `https://${subdomain}.invisionapp.com/freehand/document/rD4MXMdKY`,
        authorId: '1',
        authorName: 'James Dean',
        key: '123456',
        service: 'freehand',
        uuid: '123456',
        version: 1,
        container: createContainer(100, 100),
        id: '1',
        content: new ArrayBuffer(1)
    }

    return mount(
        <ThemeProvider theme={theme}>
            <FreehandCanvas freehand={freehand} {...baseProps} {...props} />
        </ThemeProvider>,
        options
    )
}

describe('FreehandCanvas component', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should render', async () => {
        const component = await createComponent()
        const canvas = component.find(FreehandCanvas)
        expect(canvas).toExist()
    })

    it('should render a zoom button', async () => {
        const component = await createComponent()
        expect(component.find(Zoom)).toHaveLength(1)
    })

    it('should render a zoom button with a popover to explain scrolling', async () => {
        // @ts-ignore
        window.navigator.__defineGetter__('platform', () => 'Mac')

        const component = await createComponent()
        const popoverText = component
            .find(Popover)
            .children()
            .text()
        expect(popoverText).toMatch('⌘ + Scroll')
    })

    it('should use "ctrl" on non-apple devices', async () => {
        // @ts-ignore
        window.navigator.__defineGetter__('platform', () => 'Windows')

        const component = await createComponent()
        const popoverText = component
            .find(Popover)
            .children()
            .text()
        expect(popoverText).toMatch('Ctrl + Scroll')
    })

    it('updates the freehand when an update is available', () => {
        createComponent()

        expect(freehand.setState).toHaveBeenCalledWith({
            updateAvailable: true
        })
    })

    describe('limitZoom', () => {
        it('should call Freehand redraw if zoom below 0', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.freehandCanvas.camera = {
                x: 0,
                y: 0,
                scale: -1
            }
            c.limitZoom()
            expect(FreehandCanvas2D.prototype.redraw).toBeCalled()
        })

        it('should call Freehand redraw if zoom greater than 64', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.freehandCanvas.camera = {
                x: 0,
                y: 0,
                scale: 65
            }
            c.limitZoom()
            expect(FreehandCanvas2D.prototype.redraw).toBeCalled()
        })

        it('should not call Freehand redraw if zoom is within limits', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.freehandCanvas.camera = {
                x: 0,
                y: 0,
                scale: 10
            }
            c.limitZoom()
            expect(FreehandCanvas2D.prototype.redraw).not.toBeCalled()
        })
    })

    describe('zoomIn', () => {
        it('should call Freehand zoomIn if freehand exists', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.zoomIn()
            expect(FreehandCanvas2D.prototype.zoomIn).toBeCalled()
        })

        it("should not call Freehand zoomIn if the freehand doesn't exist", () => {
            const c = new FreehandCanvas(baseProps)
            c.zoomIn()
            expect(FreehandCanvas2D.prototype.zoomIn).not.toBeCalled()
        })
    })

    describe('zoomOut', () => {
        it('should call Freehand zoomOut if freehand exists', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.zoomOut()
            expect(FreehandCanvas2D.prototype.zoomOut).toBeCalled()
        })

        it("should not call Freehand zoomOut if the freehand doesn't exist", () => {
            const c = new FreehandCanvas(baseProps)
            c.zoomOut()
            expect(FreehandCanvas2D.prototype.zoomOut).not.toBeCalled()
        })
    })

    describe('recenter', () => {
        it('should call Freehand resetViewport if freehand exists', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.recenter()
            expect(FreehandCanvas2D.prototype.resetViewport).toBeCalled()
        })

        it("should not call Freehand resetViewport if the freehand doesn't exist", () => {
            const c = new FreehandCanvas(baseProps)
            c.recenter()
            expect(FreehandCanvas2D.prototype.resetViewport).not.toBeCalled()
        })
    })

    describe('updateSize', () => {
        it('should call Freehand updateSize if freehand exists', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.updateSize()
            expect(FreehandCanvas2D.prototype.updateSize).toBeCalled()
        })

        it("should not call Freehand updateSize if the freehand doesn't exist", () => {
            const c = new FreehandCanvas(baseProps)
            c.updateSize()
            expect(FreehandCanvas2D.prototype.updateSize).not.toBeCalled()
        })

        it("should not change the height if maintainScale isn't requested", () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.canvas = document.createElement('canvas')
            const expectedHeight = 50
            c.height = 50
            c.updateSize()
            expect(c.height).toBe(expectedHeight)
        })

        it('should change the height if maintainScale is requested and the canvas height has changed', () => {
            const c = new FreehandCanvas(baseProps)
            c.freehandCanvas = new FreehandCanvas2D()
            c.freehandCanvas.camera = {
                x: 0,
                y: 0,
                scale: 10
            }
            c.canvas = document.createElement('canvas')
            const expectedHeight = c.canvas.offsetHeight
            c.height = 50
            c.updateSize(true)
            expect(c.height).toBe(expectedHeight)
        })
    })
})
