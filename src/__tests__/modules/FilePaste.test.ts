import Axios from 'axios'
import * as mockdate from 'mockdate'
import QuillModule from 'quill/core'
import * as sinon from 'sinon'
import EmbedContainer from '../../components/pages/Editor/Blots/EmbedContainer'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import DefaultEmbedTypes from '../../components/quill/blots/DefaultEmbedTypes'
import FilePaste from '../../components/quill/modules/FilePaste'
import * as EmbedHelpers from '../../helpers/EmbedHelper'
import { BlockEmbedService, BlockEmbedValue } from '../../interfaces/blockEmbed'
import { mockQuill } from '../mockData/mockQuill'
import { assertFirstCallArgs } from '../utils'
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

const sandbox = sinon.createSandbox()

const defaultEmbedTypesImageClone = DefaultEmbedTypes.image.bind({})

beforeEach(() => {
    const events = {}
    DefaultEmbedTypes.image = jest.fn((data, domNode) => {
        const container = document.createElement('div')
        container.append(domNode)
        return defaultEmbedTypesImageClone(data, domNode)
    })
    Quill.root = {
        addEventListener: jest.fn((eventName, cb) => {
            events[eventName] = cb
        }),
        getEvent: jest.fn((eventName) => {
            return events[eventName]
        })
    }
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
        const embedOptions = {
            version: 1,
            service: 'image' as BlockEmbedService,
            uuid: '123',
            authorId: '1',
            embedData: {},
            createdAt: '2018-11-08T21:18:24.424Z'
        } as BlockEmbedValue

        const blockEmbed = new BlockEmbed(BlockEmbed.create(embedOptions))
        blockEmbed.formatAt(0, 1, '', '')
        return [blockEmbed]
    })

    document.getElementById = jest.fn(() => {
        return {
            id: '123'
        }
    })

    Parchment.find = () => {
        const [leaf] = Quill.getLeaf()
        leaf.offset = () => {
            return 2
        }
        leaf.length = () => {
            return 1
        }

        return leaf
    }

    Quill.getModule = jest.fn(() => {
        return {
            options: {
                authorId: 1
            }
        }
    })
    Quill.setSelection = jest.fn()

    window.getComputedStyle = jest.fn(() => {
        return {}
    })
    jest.spyOn(EmbedHelpers, 'getContainerWidth').mockReturnValue(100)
})

afterEach(() => {
    sandbox.restore()
})

describe('FilePaste module', () => {
    it('should watch for editor and clipboard changes when module is enabled', () => {
        const handlePaste = FilePaste.prototype.handlePaste as any
        const handlePasteBindSpy = jest.spyOn(handlePaste, 'bind')
        new FilePaste(Quill, true)
        expect(handlePasteBindSpy).toHaveBeenCalledTimes(1)
        expect(Quill.root.addEventListener).toHaveBeenCalledTimes(1)
        handlePasteBindSpy.mockRestore()
    })
    it('should not watch for editor and clipboard changes when module is disabled', () => {
        const handlePaste = FilePaste.prototype.handlePaste as any
        const handlePasteBindSpy = jest.spyOn(handlePaste, 'bind')
        new FilePaste(Quill, false)
        expect(handlePasteBindSpy).not.toBeCalled()
        expect(Quill.root.addEventListener).not.toBeCalled()
        handlePasteBindSpy.mockRestore()
    })
    it('should insert image block embed after paste is fired', async () => {
        mockdate.set('2018-11-08')
        expect.assertions(2)

        new FilePaste(Quill, true)

        const eventData = {
            preventDefault: jest.fn(),
            clipboardData: {
                items: [
                    {
                        getAsFile: jest.fn(() => {
                            return new File(['aaa'], 'image.png', {
                                type: 'image/jpeg'
                            })
                        })
                    }
                ]
            }
        }
        sandbox.stub(Axios, 'post').resolves({
            data: {
                assets: [
                    {
                        id: '2d5d48dc-529d-48a7-b414-3d35aabf7e28',
                        fileName: 'test.png',
                        url:
                            'https://assets.local.invision.works/assets/16e2a1e8-2465-400e-8086-0760575521b3'
                    }
                ]
            }
        })

        const resetEmbedDataCall = sandbox.spy(
            EmbedContainer.prototype,
            'resetEmbedData'
        )

        await Quill.root.getEvent('paste')(eventData)

        const index = 5
        const embedType = BlockEmbed.blotName

        const embedOptions = {
            authorId: 1,
            embedData: {},
            service: 'image',
            uuid: undefined,
            version: 1,
            createdAt: new Date()
        }
        const source = 'user'

        assertFirstCallArgs(resetEmbedDataCall, {
            id: '2d5d48dc-529d-48a7-b414-3d35aabf7e28'
        })
        expect(Quill.insertEmbed).toHaveBeenCalledWith(
            index,
            embedType,
            embedOptions,
            source
        )
        mockdate.reset()
    })

    it('should paste only image types', async () => {
        expect.assertions(1)

        new FilePaste(Quill, true)

        const eventData = {
            preventDefault: jest.fn(),
            clipboardData: {
                items: [
                    {
                        getAsFile: jest.fn(() => {
                            return new Blob(['aaaa'], {
                                type: 'application/json'
                            })
                        })
                    }
                ]
            }
        }

        await Quill.root.getEvent('paste')(eventData)

        expect(Quill.insertEmbed).not.toHaveBeenCalled()
    })
})
