import { mount } from 'enzyme'
import React from 'react'
import { PaneEmbedProvider } from '../../components/pages/Editor/Blots/PaneEmbed/PaneEmbedProvider'
import quillProvider from '../../components/quill/provider'
import { MAIN_EDITOR_ID } from '../../constants/general'
import { DND_ANIMATION_SPEED } from '../../constants/styles'
import { DOCUMENT_CHANGE_REPOSITION } from '../../constants/topics'
import resizeObserverService from '../../services/ResizeObserverService'

jest.mock('resize-observer-polyfill')

const paneId = 'ff9f8390-8826-4b7b-9e21-d869eb43cbcf'

const baseProps = {
    authorId: '1',
    authorName: 'test',
    key: paneId,
    uuid: paneId,
    version: 1,
    embedData: {},
    createdAt: '2018-11-08T21:18:24.424Z',
    quillBlotElement: document.createElement('div')
}

const Quill: any = jest.genMockFromModule('quill/core')

describe('PaneEmbedProvider', () => {
    beforeEach(() => {
        resizeObserverService.observedElements = new Map()

        const app = document.createElement('div')
        app.setAttribute('id', MAIN_EDITOR_ID)
        document.body.appendChild(app)

        baseProps.quillBlotElement = document.createElement('div')

        Quill.on = jest.fn()
        quillProvider.setQuill(Quill)
    })
    afterEach(() => {
        const app = document.querySelector(`#${MAIN_EDITOR_ID}`)
        app?.parentNode?.removeChild(app)

        jest.resetAllMocks()
    })
    it('creates a container for the portal', () => {
        mount(<PaneEmbedProvider {...baseProps} />) as any
        const portalDiv = document.getElementById(`portal-${paneId}`)
        expect(portalDiv).toBeInstanceOf(HTMLDivElement)
    })
    it('sets embed data', () => {
        const wrapper = mount(<PaneEmbedProvider {...baseProps} />)
        const instance = wrapper.instance() as PaneEmbedProvider
        const newEmbedData = { thing: 'test' }
        instance.resetEmbedData(newEmbedData)

        const embedProps = JSON.parse(instance.quillBlotElement.dataset.props!)
        expect(instance.state.embedData).toEqual(newEmbedData)
        expect(embedProps.embedData).toEqual(newEmbedData)
    })
    it('sets embed data value', () => {
        const wrapper = mount(<PaneEmbedProvider {...baseProps} />)

        const embedData = { cakeIsBetterThanPie: false }
        wrapper.setState({ embedData })

        const instance = wrapper.instance() as PaneEmbedProvider

        const newEmbedData = { pieIsBetterThanCake: true }
        instance.setEmbedDataValue('pieIsBetterThanCake', true)
        const embedProps = JSON.parse(instance.quillBlotElement.dataset.props!)

        expect(instance.state.embedData).toEqual({
            ...embedData,
            ...newEmbedData
        })
        expect(embedProps.embedData).toEqual({ ...embedData, ...newEmbedData })
    })
    it('sets state', () => {
        const wrapper = mount(<PaneEmbedProvider {...baseProps} />)
        const instance = wrapper.instance() as PaneEmbedProvider
        const embedState = { cakeIsBetterThanPie: false }

        expect(instance.state[Object.keys(embedState)[0]]).not.toBeDefined()

        instance.setState(embedState)

        expect(instance.state[Object.keys(embedState)[0]]).toEqual(
            embedState.cakeIsBetterThanPie
        )
    })
    it('should set up the ResizeObserver', () => {
        const wrapper = mount(<PaneEmbedProvider {...baseProps} />)
        const observeSpy = jest.spyOn(
            resizeObserverService.observer!,
            'observe'
        )
        const instance = wrapper.instance() as PaneEmbedProvider
        expect(observeSpy).toHaveBeenNthCalledWith(1, instance.rootElem)
        expect(observeSpy).toHaveBeenNthCalledWith(2, instance.quillBlotElement)
    })
    it('should reposition the embed on document reposition', () => {
        const quillBlotTop = 500
        jest.useFakeTimers()
        const wrapper = mount(<PaneEmbedProvider {...baseProps} />)
        let instance = wrapper.instance() as PaneEmbedProvider

        expect(instance.rootElem.style.top).toBe('')
        Object.defineProperty(instance.quillBlotElement, 'offsetTop', {
            writable: true,
            configurable: true,
            value: quillBlotTop
        })
        PubSub.publish(DOCUMENT_CHANGE_REPOSITION, null)
        jest.advanceTimersByTime(DND_ANIMATION_SPEED)
        wrapper.update()
        instance = wrapper.instance() as PaneEmbedProvider

        expect(instance.rootElem.style.top).toBe(`${quillBlotTop}px`)
    })
})
