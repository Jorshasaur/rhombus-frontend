import { mount, ReactWrapper } from 'enzyme'
import Quill from 'quill'
import Delta from 'quill-delta'
import React from 'react'
import { act } from 'react-dom/test-utils'
import { Provider } from 'react-redux'
import configureMockStore from 'redux-mock-store'
import { DocumentHistory } from '../../components/pages/Editor/DocumentHistory/DocumentHistory'
import { Revision } from '../../components/pages/Editor/DocumentHistory/Revision/Revision'
import QuillSources from '../../components/quill/modules/QuillSources'
import PagesApiService from '../../data/services/PagesApiService'

const revisions = [
    {
        revision: 0,
        users: [1],
        id: 'e7913f97-40ee-448f-bd6b-e01802653512',
        createdAt: '2015-03-25T12:00:00Z'
    },
    {
        revision: 1,
        users: [1, 2],
        id: '62ce8880-4e87-417b-a6b6-d0f2a75689fa',
        createdAt: '2016-03-25T12:00:00Z'
    }
]

const mockDelta = {
    ops: [{ insert: 'Gandalf' }, { insert: ' the ' }, { insert: 'Grey' }]
}

const defaultStore = { currentDocument: { ownerId: 1 } }
const mockedStore = configureMockStore()(defaultStore)

const props = {
    editorQuill: ({
        getContents: jest.fn()
    } as unknown) as Quill,
    hideDocumentHistory: jest.fn(),
    prepareRevert: jest.fn()
}

const setContentsMock = jest.fn()
const disableMock = jest.fn()

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: setContentsMock,
                    disable: disableMock,
                    getContents: jest.fn()
                }
            }
        }
    }
})

jest.mock('@invisionapp/helios', () => {
    return {
        Adjacent: ({ children }) => <div>{children}</div>,
        Button: ({ onClick, children }) => (
            <div
                onClick={() => {
                    onClick()
                }}>
                {children}
            </div>
        ),
        Modal: ({ children }) => <div className="modal">{children}</div>,
        Skeleton: ({ children }) => <div>{children}</div>,
        Text: ({ children }) => <div>{children}</div>
    }
})

describe('DocumentHistory', () => {
    beforeEach(() => {
        jest.resetAllMocks()
    })

    it('should render the component and display revisions', async () => {
        const mock = (PagesApiService.getRevisions = jest.fn(() =>
            Promise.resolve([...revisions])
        ))
        let wrapper!: ReactWrapper
        act(() => {
            wrapper = mount(
                <Provider store={mockedStore}>
                    <DocumentHistory {...props} />
                </Provider>
            )
        })
        await mock
        wrapper.update()
        wrapper.update()
        expect(wrapper.find(Revision)).toHaveLength(revisions.length)
        expect(
            wrapper
                .find(Revision)
                .at(0)
                .props().id
        ).toEqual(revisions[1].id)
        expect(
            wrapper
                .find(Revision)
                .at(0)
                .props().isActive
        ).toEqual(true)
        expect(
            wrapper
                .find(Revision)
                .at(1)
                .props().id
        ).toEqual(revisions[0].id)
        expect(
            wrapper
                .find(Revision)
                .at(1)
                .props().isActive
        ).toEqual(false)
        expect(disableMock).toHaveBeenCalled()
    })
    // This test is failing right now and seems to be covered by https://github.com/InVisionApp/pages-e2e-tests/blob/a76edd17b34e1b82f886b35b3e41a5bb11207e13/tests/document-history.ts#L24-L42
    it('should update a to active revision when a revision is clicked', async () => {
        const mock = (PagesApiService.getRevisions = jest.fn(() =>
            Promise.resolve([...revisions])
        ))

        const getContentAtRevisionMock = (PagesApiService.getContentAtRevision = jest.fn(
            () =>
                Promise.resolve({
                    contents: {
                        delta: mockDelta
                    }
                })
        ))
        let wrapper
        act(() => {
            wrapper = mount(
                <Provider store={mockedStore}>
                    <DocumentHistory {...props} />
                </Provider>
            )
        })
        await mock
        wrapper.update()

        expect(
            wrapper
                .find(Revision)
                .at(0)
                .props().isActive
        ).toEqual(true)
        expect(
            wrapper
                .find(Revision)
                .at(1)
                .props().isActive
        ).toEqual(false)

        act(() => {
            wrapper
                .find(Revision)
                .at(1)
                .simulate('click')
        })
        await getContentAtRevisionMock
        wrapper.update()

        expect(
            wrapper
                .find(Revision)
                .at(1)
                .props().isActive
        ).toEqual(true)
        expect(setContentsMock).toHaveBeenCalledTimes(2)
        expect(setContentsMock).toHaveBeenNthCalledWith(
            2,
            new Delta(mockDelta),
            QuillSources.API
        )
    })
    it('should apply a revision when the revert button is clicked', async () => {
        const editorQuillUpdateContentsMock = jest.fn()
        const mock = (PagesApiService.getRevisions = jest.fn(() =>
            Promise.resolve([...revisions])
        ))

        PagesApiService.getContentAtRevision = jest.fn(() =>
            Promise.resolve({
                contents: {
                    delta: mockDelta
                }
            })
        )
        let wrapper
        const testDiff = {
            ops: [
                { insert: 'Gandalf' },
                { insert: ' the ' },
                { insert: 'White' }
            ]
        }
        const applyRevisionProps = {
            ...props,
            editorQuill: ({
                ...props.editorQuill,
                getContents: jest.fn(() => ({
                    diff: jest.fn(() => new Delta(testDiff))
                })),
                updateContents: editorQuillUpdateContentsMock
            } as unknown) as Quill
        }
        act(() => {
            wrapper = mount(
                <Provider store={mockedStore}>
                    <DocumentHistory {...applyRevisionProps} />
                </Provider>
            )
        })
        await mock
        wrapper.update()
        act(() => {
            wrapper
                .find('Button')
                .at(1)
                .childAt(0)
                .simulate('click')
        })
        expect(editorQuillUpdateContentsMock).toHaveBeenCalledWith(
            new Delta(testDiff),
            QuillSources.USER
        )
        expect(applyRevisionProps.hideDocumentHistory).toHaveBeenCalled()
    })
    it('should close the modal when the cancel button is clicked', async () => {
        const mock = (PagesApiService.getRevisions = jest.fn(() =>
            Promise.resolve([...revisions])
        ))

        PagesApiService.getContentAtRevision = jest.fn(() =>
            Promise.resolve({
                contents: {
                    delta: mockDelta
                }
            })
        )
        let wrapper
        const testDiff = {
            ops: [
                { insert: 'Gandalf' },
                { insert: ' the ' },
                { insert: 'White' }
            ]
        }
        act(() => {
            wrapper = mount(
                <Provider store={mockedStore}>
                    <DocumentHistory {...props} />
                </Provider>
            )
        })
        await mock
        wrapper.update()
        act(() => {
            wrapper
                .find('Button')
                .at(0)
                .childAt(0)
                .simulate('click')
        })
        expect(props.hideDocumentHistory).toHaveBeenCalled()
    })
})
