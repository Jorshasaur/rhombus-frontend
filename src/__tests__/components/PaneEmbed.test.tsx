import { mount } from 'enzyme'
import Delta from 'quill-delta'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { PaneEmbed } from '../../components/pages/Editor/Blots/PaneEmbed/PaneEmbed'
import { PaneEmbedContext } from '../../components/pages/Editor/Blots/PaneEmbed/PaneEmbedContext'
import { PaneCell } from '../../components/pages/Editor/Blots/PaneEmbed/PaneTable/PaneRow/PaneCell/PaneCell'
import QuillSources from '../../components/quill/modules/QuillSources'
import { PaneElementType, PaneViewType } from '../../data/panes/Advil'
import PagesApiService from '../../data/services/PagesApiService'

const setContentsMock = jest.fn()
const getContentsMock = jest.fn()
const onMock = jest.fn()

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: setContentsMock,
                    getContents: getContentsMock,
                    on: onMock
                }
            }
        }
    }
})

const paneId = '1afce8b3-2c49-4be3-b5a2-9776a01ae5bb'

const context = {
    authorId: '1',
    authorName: 'test',
    uuid: paneId,
    version: 1,
    embedData: {
        pane: paneId
    },
    createdAt: '2018-11-08T21:18:24.424Z',
    quillBlotElement: document.createElement('div')
}

const paneCellElements = [
    {
        type: PaneElementType.TEXT,
        value: new Delta().insert('Hello World')
    },
    {
        type: PaneElementType.TEXT,
        value: new Delta().insert('Hello Two')
    }
]

describe('PaneEmbed', () => {
    afterEach(() => {
        jest.resetAllMocks
    })

    it('renders cells and sets Quill contents', async () => {
        const getPaneContentsMock = (PagesApiService.getPaneContents = jest.fn(
            () =>
                Promise.resolve({
                    revision: 1,
                    contents: {
                        id: paneId,
                        viewType: PaneViewType.TABLE,
                        elements: [
                            {
                                id: 'one',
                                elements: paneCellElements
                            }
                        ]
                    }
                })
        ))
        const getPanesRevisionsSinceRevisionMock = (PagesApiService.getPanesRevisionsSinceRevision = jest.fn(
            () => Promise.resolve([])
        ))

        const wrapper = mount(
            <PaneEmbedContext.Provider value={context}>
                <PaneEmbed />
            </PaneEmbedContext.Provider>
        )

        await act(async () => {
            await getPaneContentsMock
            await getPanesRevisionsSinceRevisionMock
        })

        wrapper.update()

        expect(wrapper.at(0).find(PaneCell).length).toBe(
            paneCellElements.length
        )
        expect(onMock).toHaveBeenCalledTimes(paneCellElements.length)
        expect(setContentsMock).nthCalledWith(
            1,
            paneCellElements[0].value,
            QuillSources.API
        )
        expect(setContentsMock).nthCalledWith(
            2,
            paneCellElements[1].value,
            QuillSources.API
        )
    })
})
