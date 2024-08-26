import Axios from 'axios'
import * as mockdate from 'mockdate'
import QuillModule from 'quill/core'
import EmbedContainer from '../../components/pages/Editor/Blots/EmbedContainer'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import FileDrop from '../../components/quill/modules/FileDrop'
import { TypeKeys } from '../../data/ActionTypes'
import store from '../../data/store'
import { BlockEmbedService, BlockEmbedValue } from '../../interfaces/blockEmbed'
import { mockQuill } from '../mockData/mockQuill'
const Parchment = QuillModule.import('parchment')

jest.mock('uuid')
const Quill = mockQuill

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

jest.mock('../../QuillRegistry', () => {
    return {
        getEditor: () => {
            return Quill
        }
    }
})

jest.mock('../../components/quill/getEditorId', () => {
    return {
        getEditorId: () => {
            return Quill
        }
    }
})

let getEvent: jest.Mock

beforeEach(() => {
    const events = {}

    document.addEventListener = jest.fn((eventName, cb) => {
        events[eventName] = cb
    })
    document.removeEventListener = jest.fn()

    getEvent = jest.fn((eventName) => {
        return events[eventName]
    })

    Quill.getSelection = jest.fn(() => {
        return {
            index: 4
        }
    })
    Quill.getLine = jest.fn(() => {
        const line = {
            length() {
                return 3
            }
        }
        const offset = 2
        return [line, offset]
    })

    Quill.insertText = jest.fn()
    Quill.insertEmbed = jest.fn()
    Quill.getLeaf = jest.fn(() => {
        const embedOptions: BlockEmbedValue = {
            version: 1,
            service: 'file' as BlockEmbedService,
            dataUrl: '',
            uuid: '123',
            authorId: '1',
            embedData: { fileName: 'test.sketch' },
            createdAt: '2018-11-08T21:18:24.424Z'
        }

        const blockEmbed = new BlockEmbed(BlockEmbed.create(embedOptions))
        blockEmbed.formatAt(0, 1, '', '')
        return [blockEmbed]
    })

    document.getElementById = jest.fn(() => {
        return {
            id: '123'
        }
    })

    Quill.getModule = jest.fn(() => {
        return {
            options: {
                authorId: 1
            }
        }
    })
    Quill.setSelection = jest.fn()

    Quill.root = document.createElement('div')
})

describe('FileDrop module', () => {
    it('should watch for editor and clipboard changes when module is enabled', () => {
        Quill.on = jest.fn()
        const fileDropModule = new FileDrop(Quill, true)
        expect(document.addEventListener).toHaveBeenCalledTimes(3)
        expect(document.addEventListener).toHaveBeenCalledWith(
            'drop',
            fileDropModule.handleDrop
        )
        expect(document.addEventListener).toHaveBeenCalledWith(
            'dragenter',
            fileDropModule.dragEnter,
            true
        )
        expect(document.addEventListener).toHaveBeenCalledWith(
            'dragleave',
            fileDropModule.dragLeave,
            true
        )
    })

    it('should not watch for editor and clipboard changes when module is disabled', () => {
        Quill.on = jest.fn()
        new FileDrop(Quill, false)
        expect(document.addEventListener).not.toBeCalled()
    })

    it('should insert file block embed after drop is fired', async () => {
        mockdate.set('2018-11-08')
        const fileDropModule = new FileDrop(Quill, true)

        // prepare mock data
        store.dispatch = jest.fn()

        const eventData = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            dataTransfer: {
                files: [
                    new File(['aaaa'], 'test.sketch', {
                        type: 'application/sketch'
                    })
                ],
                types: ['Files']
            }
        }

        const asset = {
            id: '2d5d48dc-529d-48a7-b414-3d35aabf7e28',
            fileName: 'test.sketch',
            url:
                'https://assets.local.invision.works/assets/16e2a1e8-2465-400e-8086-0760575521b3'
        }

        const axios = Axios as any
        axios.post = () => {
            return Promise.resolve({
                data: {
                    assets: [asset]
                }
            })
        }

        axios.get = () => {
            return Promise.resolve({ data: asset })
        }

        const resetEmbedDataSpy = jest.spyOn(
            EmbedContainer.prototype,
            'resetEmbedData'
        )

        // drag enter
        await getEvent('dragenter')(eventData)

        expect(fileDropModule.dragging).toEqual(true)
        expect(Quill.root.classList.contains('hide-cursor')).toBeTruthy()
        expect(store.dispatch).toBeCalledWith({
            data: {
                dragging: true
            },
            type: TypeKeys.SET_DRAGGING
        })
        expect(document.addEventListener).toBeCalledWith(
            'dragover',
            fileDropModule.dragEventData.handler,
            true
        )

        const dragOverElement = document.createElement('div')
        fileDropModule.dragEventData.dragOver.element = dragOverElement
        Parchment.find = () => {
            const [leaf] = Quill.getLeaf()
            leaf.offset = () => {
                return 2
            }
            leaf.length = () => {
                return 3
            }

            return leaf
        }

        // drop
        await getEvent('drop')(eventData)

        const index = 5
        const embedType = BlockEmbed.blotName
        const embedOptions = {
            authorId: 1,
            embedData: { fileName: 'test.sketch' },
            service: 'file',
            uuid: undefined,
            version: 1,
            createdAt: new Date()
        }
        const source = 'user'

        expect(resetEmbedDataSpy).toBeCalledWith({
            id: '2d5d48dc-529d-48a7-b414-3d35aabf7e28',
            fileName: 'test.sketch'
        })
        expect(Quill.insertEmbed).toHaveBeenCalledWith(
            index,
            embedType,
            embedOptions,
            source
        )
        expect(fileDropModule.dragging).toEqual(false)
        expect(Quill.root.classList.contains('hide-cursor')).toBeFalsy()
        expect(store.dispatch).toBeCalledWith({
            data: {
                dragging: false
            },
            type: TypeKeys.SET_DRAGGING
        })
        expect(document.removeEventListener).toBeCalledWith(
            'dragover',
            fileDropModule.dragEventData.handler,
            true
        )
        expect(fileDropModule.dragEventData.dragOver.end).toBeTruthy()
        mockdate.reset()
    })

    it('should call endDrag function on dragLeave', () => {
        jest.useFakeTimers()

        const fileDropModule = new FileDrop(Quill, true)
        const endDragSpy = jest.spyOn(fileDropModule, 'endDrag')

        const eventData = {
            preventDefault: jest.fn(),
            stopPropagation: jest.fn(),
            dataTransfer: {
                files: [
                    new File(['aaaa'], 'test.sketch', {
                        type: 'application/sketch'
                    })
                ],
                types: ['Files']
            }
        }

        getEvent('dragenter')(eventData)
        getEvent('dragleave')(eventData)

        expect(fileDropModule.dragEndTimeout).not.toBeUndefined()

        jest.runOnlyPendingTimers()

        expect(endDragSpy).toBeCalled()
    })
})
