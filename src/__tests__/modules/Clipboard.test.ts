import Delta from 'quill-delta'
import { BlockEmbed } from '../../components/quill/blots/BlockEmbed'
import Clipboard, {
    handleDocumentMention,
    handleMention,
    pasteBlockEmbed,
    pasteImageUrl,
    urlRegEx,
    pastePaneEmbed
} from '../../components/quill/modules/Clipboard'
import QuillSources from '../../components/quill/modules/QuillSources'
import store from '../../data/store'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { BlotSize } from '../../interfaces/blotSize'
import { SelectionType } from '../../interfaces/selectionType'
import { mockQuill } from '../mockData/mockQuill'
import { serviceLinks } from '../mockData/serviceLinks'
import { PaneEmbed } from '../../components/quill/blots/PaneEmbed'

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

jest.mock('uuid', () => {
    return {
        v4: jest.fn(() => {
            return '3a74dc93-8bc0-4358-91f3-c15f686d161f'
        })
    }
})

jest.mock('../../components/quill/provider', () => {
    return {
        getQuill: () => {
            return Quill
        }
    }
})

const service: BlockEmbedService = 'prototype'

const blockEmbedValue = {
    version: 1,
    originalLink: 'https://link.com',
    service,
    size: BlotSize.Medium,
    type: 'test',
    uuid: '1',
    authorId: '1',
    embedData: {},
    createdAt: '2018-11-08T21:18:24.424Z'
}

const blockEmbed =
    '<div class="blockEmbed embed-prototype" data-props="{&quot;version&quot;:1,&quot;originalLink&quot;:&quot;https://link.com&quot;,&quot;service&quot;:&quot;prototype&quot;,&quot;size&quot;:&quot;medium&quot;,&quot;type&quot;:&quot;test&quot;,&quot;uuid&quot;:&quot;1&quot;,&quot;authorId&quot;:&quot;1&quot;,&quot;embedData&quot;:{},&quot;createdAt&quot;:&quot;2018-11-08T21:18:24.424Z&quot;}" contenteditable="false" tabindex="0" spellcheck="false" id="1" data-type="test" data-service="prototype" data-version="1" data-uuid="1" data-embed="{}" data-authorid="1" data-originallink="https://link.com" data-createdat="2018-11-08T21:18:24.424Z" data-rhombus="true" data-testid="blot__embed-prototype" data-size="medium"></div>'
const blockEmbedNoRhombus =
    '<div class="blockEmbed embed-prototype" data-props="{&quot;version&quot;:1,&quot;originalLink&quot;:&quot;https://link.com&quot;,&quot;service&quot;:&quot;prototype&quot;,&quot;type&quot;:&quot;test&quot;,&quot;uuid&quot;:&quot;1&quot;,&quot;authorId&quot;:&quot;1&quot;,&quot;embedData&quot;:{},&quot;createdAt&quot;:&quot;2018-11-08T21:18:24.424Z&quot;}" contenteditable="false" tabindex="0" spellcheck="false" id="1" data-type="test" data-service="prototype" data-version="1" data-uuid="1" data-embed="{}" data-authorid="1" data-originallink="https://link.com" data-createdat="2018-11-08T21:18:24.424Z"></div>'
const imageNoRhombus =
    '<div class="blockEmbed embed-prototype" data-props="{&quot;version&quot;:1,&quot;originalLink&quot;:&quot;https://link.com&quot;,&quot;service&quot;:&quot;prototype&quot;,&quot;type&quot;:&quot;test&quot;,&quot;uuid&quot;:&quot;1&quot;,&quot;authorId&quot;:&quot;1&quot;,&quot;embedData&quot;:{},&quot;createdAt&quot;:&quot;2018-11-08T21:18:24.424Z&quot;}" contenteditable="false" tabindex="0" spellcheck="false" id="1" data-type="test" data-service="prototype" data-version="1" data-uuid="1" data-embed="{}" data-authorid="1" data-originallink="https://link.com" data-createdat="2018-11-08T21:18:24.424Z"><div><div><img src="http://deathstar.com" /></div></div></div>'
const atMentionGood =
    '<span class="mention" data-user-id="1" data-name="Admin User" data-email="admin@invisionapp.com" data-rhombus="true">&#65279;<span contenteditable="false"><span class="Mention__mention__3onz5"><span class="Mention__mention-text__1ZXOh">@Admin User</span><div class="Mention__mention-hover__2syTO"><div class="MentionAvatar__avatar-container__10nIw" style="background-color: rgb(89, 99, 118); background-size: cover; background-position: center center; border-radius: 32px; height: 32px; width: 32px; background-image: url(&quot;&quot;);"><svg width="32" height="32" viewBox="0 0 32 32"><g><g><circle cx="16" cy="16" fill="#596376" r="16"></circle><text class="MentionAvatar__text__OdDgS" dx="14" dy="18" fill="#ffffff" text-anchor="middle">AU</text></g></g></svg></div><div class="Mention__member-info__1SSHA"><span class="Mention__member-info-name__2X7wJ">Admin User</span><span class="Mention__member-info-email__1Tp4v">admin@invisionapp.com</span></div></div></span></span>&#65279;</span>'
const atMentionBad =
    '<span class="mention" data-user-id="1" data-name="Admin User" data-email="admin@invisionapp.com">&#65279;<span contenteditable="false"><span class="Mention__mention__3onz5"><span class="Mention__mention-text__1ZXOh">@Admin User</span><div class="Mention__mention-hover__2syTO"><div class="MentionAvatar__avatar-container__10nIw" style="background-color: rgb(89, 99, 118); background-size: cover; background-position: center center; border-radius: 32px; height: 32px; width: 32px; background-image: url(&quot;&quot;);"><svg width="32" height="32" viewBox="0 0 32 32"><g><g><circle cx="16" cy="16" fill="#596376" r="16"></circle><text class="MentionAvatar__text__OdDgS" dx="14" dy="18" fill="#ffffff" text-anchor="middle">AU</text></g></g></svg></div><div class="Mention__member-info__1SSHA"><span class="Mention__member-info-name__2X7wJ">Admin User</span><span class="Mention__member-info-email__1Tp4v">admin@invisionapp.com</span></div></div></span></span>&#65279;</span>'
const docMentionGood =
    '<span class="document-mention" data-document-mention="true" data-rhombus="true">&#65279;<span contenteditable="false"><span class="Mention__mention__3onz5"><span class="Mention__mention-text__1ZXOh">@Doc</span><div class="Mention__mention-hover__2syTO"><div class="undefined "><div class="MentionAvatar__avatar-container__10nIw" style="background-color: rgb(89, 99, 118); background-size: cover; background-position: center center; border-radius: 32px; height: 32px; width: 32px; background-image: url(&quot;https://assets.local.invision.works/assets/A_UUhjcVpLdFltdXhqSXV6QqKmf9mT5lOZCa4o2AjtuE832LlhRuCHMpmWCwa9BYa1NAdFjhDzTkyz7nirFEmftZ0PjknwA5oR3Bsw2I-MsZ8_BjMORuZyYckQ9yXDIx_5&quot;);"><svg width="32" height="32" viewBox="0 0 32 32"><g></g></svg></div></div><div class="Mention__member-info__1SSHA"><span class="Mention__member-info-name__2X7wJ">Doc</span><span class="Mention__member-info-email__1Tp4v">Everyone in this document</span></div></div></span></span>&#65279;</span>'
const docMentionBad =
    '<span class="document-mention" data-document-mention="true">&#65279;<span contenteditable="false"><span class="Mention__mention__3onz5"><span class="Mention__mention-text__1ZXOh">@Doc</span><div class="Mention__mention-hover__2syTO"><div class="undefined "><div class="MentionAvatar__avatar-container__10nIw" style="background-color: rgb(89, 99, 118); background-size: cover; background-position: center center; border-radius: 32px; height: 32px; width: 32px; background-image: url(&quot;https://assets.local.invision.works/assets/A_UUhjcVpLdFltdXhqSXV6QqKmf9mT5lOZCa4o2AjtuE832LlhRuCHMpmWCwa9BYa1NAdFjhDzTkyz7nirFEmftZ0PjknwA5oR3Bsw2I-MsZ8_BjMORuZyYckQ9yXDIx_5&quot;);"><svg width="32" height="32" viewBox="0 0 32 32"><g></g></svg></div></div><div class="Mention__member-info__1SSHA"><span class="Mention__member-info-name__2X7wJ">Doc</span><span class="Mention__member-info-email__1Tp4v">Everyone in this document</span></div></div></span></span>&#65279;</span>'

const goodUrls = [
    'http://invisionapp.com',
    'http://invisionapp.com',
    'https://invisionapp.com',
    'HTTP://invisionapp.com',
    'HTTPS://invisionapp.com',
    'invisionapp.com',
    'www.invisionapp.com',
    'something.invisionapp.com',
    'http://12345.invisionapp.com',
    'youtu.be/f2dXFzXQ-Bs?t=201',
    'www.youtube.com/watch?v=kX0tXk6XrHE',
    'invis.io/blahblah',
    '127.0.0.1/whatever.html',
    'http://127.0.0.1/whatever.html',
    'https://127.0.0.1/whatever.html',
    'in-v7.invisionapp.com/prototype/RBU-Thermometer-cjksjrvxs00009f01etmy5jps?v=WCOOmuLdMF15wuvIwYg0Ig%3D%3D&linkshare=urlcopied'
]

const badUrls = [
    'http123://invisionapp.com',
    'httpv://invisionapp.com',
    'ftp://invisionapp.com',
    'sftp://invisionapp.com',
    'not-a-link',
    'david@invisionapp.com',
    'com/homepage.html',
    'javascript:console.log(/"hello world/")',
    '[[[[',
    `const EXAMPLE_TABLE_PANE = { TOP_LEVEL_PANE_TYPE: { // This is the list of rows ORGANIZING_PANE_TYPES.list: { elements: [ // This list *is* the row. Each item in this list // is a column and its value in that row ORGANIZING_PANE_TYPES.list: { BASE_PANE_TYPES.text, BASE_PANE_TYPES.select, }, // Another row ORGANIZING_PANE_TYPES.list: { BASE_PANE_TYPES.text, BASE_PANE_TYPES.select, }, // Another row ORGANIZING_PANE_TYPES.list: { BASE_PANE_TYPES.text, BASE_PANE_TYPES.select, }, // etc ] } }`
]

const editorId = 'editor-id'

const testUrl = (url: string) => {
    return new RegExp(urlRegEx, 'i').test(url)
}

const clipboardOptions = {
    pane: true
}

beforeEach(() => {
    Quill.root = document.createElement('div')
    Quill.addContainer = () => {
        return document.createElement('div')
    }
    Quill.setSelection = jest.fn()
    Quill.insertText = jest.fn()
    Quill.getFormat = jest.fn(() => ({ id: 'cuid2' }))
})

describe('Clipboard', () => {
    it('should handle cut for embeds', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            handleEmbeds: true,
            editorId
        })

        store.getState = jest.fn(() => {
            return {
                selection: {
                    selectionType: SelectionType.Embed,
                    editorId,
                    index: 1
                }
            }
        })

        const embed = new BlockEmbed(BlockEmbed.create(blockEmbedValue))
        Quill.getLeaf = () => {
            return [embed]
        }
        Quill.deleteText = jest.fn()

        const cutEvent = document.createEvent('HTMLEvents')
        cutEvent.initEvent('cut', false, true)
        const clipboardData = {
            setData: jest.fn(),
            clearData: jest.fn()
        }
        cutEvent['clipboardData'] = clipboardData
        document.dispatchEvent(cutEvent)

        expect(Quill.deleteText).toBeCalledWith(1, 1, QuillSources.USER)
        expect(clipboardData.clearData).toHaveBeenCalled()
        expect(clipboardData.setData).toHaveBeenCalledWith(
            'text/html',
            embed.domNode.outerHTML
        )

        clipboard.detach()
    })

    it('should handle cut for pane embeds', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            handleEmbeds: true,
            editorId
        })

        store.getState = jest.fn(() => {
            return {
                selection: {
                    selectionType: SelectionType.Embed,
                    index: 1,
                    editorId
                },
                currentDocument: {
                    members: []
                }
            }
        })
        const paneNode = Object.assign({}, blockEmbedValue, {
            embedData: {
                pane: 'aabbcc'
            },
            service: 'pane'
        }) as any
        const embed = new PaneEmbed(PaneEmbed.create(paneNode))
        Quill.getLeaf = () => {
            return [embed]
        }
        Quill.deleteText = jest.fn()

        const cutEvent = document.createEvent('HTMLEvents')
        cutEvent.initEvent('cut', false, true)
        const clipboardData = {
            setData: jest.fn(),
            clearData: jest.fn()
        }
        cutEvent['clipboardData'] = clipboardData
        document.dispatchEvent(cutEvent)

        expect(Quill.deleteText).toBeCalledWith(1, 1, QuillSources.USER)
        expect(clipboardData.clearData).toHaveBeenCalled()
        expect(clipboardData.setData).toHaveBeenCalledWith(
            'text/html',
            embed.domNode.outerHTML
        )

        clipboard.detach()
    })

    it('should handle paste for embeds', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            handleEmbeds: true,
            editorId
        })

        store.getState = jest.fn(() => {
            return {
                selection: {
                    selectionType: SelectionType.Embed,
                    index: 1,
                    editorId
                }
            }
        })

        Quill.getLeaf = () => {
            return ['']
        }

        const pasteEvent = document.createEvent('HTMLEvents')
        pasteEvent.initEvent('paste', false, true)
        document.body.dispatchEvent(pasteEvent)

        expect(Quill.setSelection).toBeCalledWith(2, QuillSources.SILENT)

        clipboard.detach()
    })

    it('should handle paste for panes', () => {
        const element = document.createElement('div')
        element.setAttribute('data-props', '{}')
        element.setAttribute('uuid', '')
        element.setAttribute('data-rhombus', 'true')
        const match = {
            value: jest.fn(() => {
                return ''
            })
        }
        store.getState = jest.fn(() => {
            return {
                featureFlags: {
                    panes: true
                }
            }
        })
        PaneEmbed.clonePane = jest.fn()
        pastePaneEmbed(match, element, new Delta())
        expect(PaneEmbed.clonePane).toHaveBeenCalled()
    })

    it('should handle paste for embeds and insert new line when next is embed', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            handleEmbeds: true,
            editorId
        })

        store.getState = jest.fn(() => {
            return {
                selection: {
                    selectionType: SelectionType.Embed,
                    index: 1,
                    editorId
                }
            }
        })

        Quill.getLeaf = () => {
            return [new BlockEmbed(BlockEmbed.create(blockEmbedValue))]
        }

        const pasteEvent = document.createEvent('HTMLEvents')
        pasteEvent.initEvent('paste', false, true)
        document.body.dispatchEvent(pasteEvent)

        expect(Quill.insertText).toBeCalledWith(
            2,
            '\n',
            { id: expect.any(String) },
            QuillSources.USER
        )
        expect(Quill.setSelection).toBeCalledWith(2, QuillSources.SILENT)

        clipboard.detach()
    })

    it('should copy embeds', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            handleEmbeds: true,
            editorId
        })

        store.getState = jest.fn(() => {
            return {
                selection: {
                    selectionType: SelectionType.Embed,
                    index: 1,
                    editorId
                }
            }
        })

        Quill.getLeaf = () => {
            return [new BlockEmbed(BlockEmbed.create(blockEmbedValue))]
        }

        const clipboardData = {
            clearData: jest.fn(),
            setData: jest.fn()
        }

        const copyEvent = document.createEvent('HTMLEvents')
        copyEvent.initEvent('copy', false, true)
        Object.defineProperty(copyEvent, 'clipboardData', {
            writable: true,
            configurable: true,
            value: clipboardData
        })
        document.dispatchEvent(copyEvent)

        const format = 'text/html'

        expect(clipboardData.clearData).toHaveBeenCalled()
        expect(clipboardData.setData).toBeCalledWith(format, blockEmbed)

        clipboard.detach()
    })
    it('should convert unsupported nodes to text', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            formats: []
        })
        const headerText = 'Hello World'
        const header = document.createElement('H1')
        const headerTextNode = document.createTextNode(headerText)
        header.appendChild(headerTextNode)
        const textDelta = clipboard.convertNodeToText(header, new Delta())
        expect(textDelta).toEqual({ ops: [{ insert: headerText + '\n' }] })

        clipboard.detach()
    })
    it('should return the blot originalLink if rhombus isnt true', () => {
        const match = {
            value: (node: any) => ({
                service: 'freehand',
                originalLink: 'http://test.com'
            }),
            formats: () => {
                return
            }
        }
        const template = document.createElement('div')
        template.innerHTML = blockEmbedNoRhombus

        const textDelta = pasteBlockEmbed(
            match,
            template.firstChild as HTMLElement,
            new Delta(),
            clipboardOptions
        )
        expect(textDelta).toEqual({
            ops: [{ insert: match.value('').originalLink }]
        })
    })
    it('should return an imagelink if its an image and rhombus isnt true', () => {
        const match = {
            value: (node: any) => ({
                service: 'image'
            }),
            formats: () => {
                return
            }
        }
        const template = document.createElement('div')
        template.innerHTML = imageNoRhombus

        const textDelta = pasteBlockEmbed(
            match,
            template.firstChild as HTMLElement,
            new Delta(),
            clipboardOptions
        )
        expect(textDelta).toEqual({
            ops: [{ insert: 'http://deathstar.com/' }]
        })
    })
    it('should return an embed if rhombus is true', () => {
        const match = {
            value: (node: any) => ({
                service: 'image',
                embedData: {
                    id: 0
                },
                blotName: 'image'
            }),
            formats: () => {
                return
            }
        }
        store.getState = jest.fn(() => {
            return {
                assets: [
                    {
                        selectionType: SelectionType.Embed,
                        index: 0
                    }
                ]
            }
        })
        const template = document.createElement('div')
        template.innerHTML = blockEmbed

        const textDelta = pasteBlockEmbed(
            match,
            template.firstChild as HTMLElement,
            new Delta(),
            clipboardOptions
        )
        expect(textDelta).toEqual({
            ops: [
                {
                    insert: {
                        undefined: {
                            blotName: 'image',
                            embedData: { id: 0 },
                            service: 'image',
                            size: 'medium'
                        }
                    }
                }
            ]
        })
    })
    it('should return an at mention if rhombus is true', () => {
        const template = document.createElement('div')
        const emptyDelta = new Delta()
        template.innerHTML = atMentionGood
        const delta = handleMention(
            template.firstChild as HTMLElement,
            emptyDelta
        )
        expect(delta).toEqual(emptyDelta)
    })
    it('should change the delta on at mentions if rhombus isnt set', () => {
        const template = document.createElement('div')
        const emptyDelta = new Delta()
        template.innerHTML = atMentionBad
        const delta = handleMention(
            template.firstChild as HTMLElement,
            emptyDelta
        )
        expect(delta !== emptyDelta).toBeTruthy()
    })
    it('should return a doc mention if rhombus is true', () => {
        const template = document.createElement('div')
        const emptyDelta = new Delta()
        template.innerHTML = docMentionGood
        const delta = handleDocumentMention(
            template.firstChild as HTMLElement,
            emptyDelta
        )
        expect(delta).toEqual(emptyDelta)
    })
    it('should change the delta on doc mention if rhombus isnt set', () => {
        const template = document.createElement('div')
        const emptyDelta = new Delta()
        template.innerHTML = docMentionBad
        const delta = handleDocumentMention(
            template.firstChild as HTMLElement,
            emptyDelta
        )
        expect(delta !== emptyDelta).toBeTruthy()
    })
    it('should paste image urls if disabled', () => {
        const image = document.createElement('img')
        const imageLoc = 'http://nowhere.com/something.jpg'
        image.src = imageLoc
        const delta = pasteImageUrl(image)
        expect(delta).toEqual({ ops: [{ insert: imageLoc }] })
    })
    it('should paste node contents if disabled', () => {
        const clipboard = new Clipboard(Quill, {
            matchers: [],
            formats: [],
            enabled: false
        })
        const boldText = 'Hello World'
        const bold = document.createElement('b')
        const boldTextNode = document.createTextNode(boldText)
        bold.appendChild(boldTextNode)
        const delta = clipboard.convertNodeToText(bold, new Delta())
        expect(delta).toEqual({ ops: [{ insert: boldText }] })
    })

    it.each([
        ...goodUrls.map((goodUrl) => [goodUrl, true]),
        ...badUrls.map((badUrl) => [badUrl, false])
    ])('should match urls correctly', (url, result) => {
        expect(testUrl(url)).toBe(result)
    })

    describe('convert', () => {
        it.each(goodUrls)('converts %s to a URL', (testString) => {
            const clipboard = new Clipboard(
                {
                    ...Quill,
                    getText: jest.fn(() => true),
                    selection: {
                        savedRange: {
                            index: 0
                        }
                    }
                },
                {
                    matchers: [],
                    formats: []
                }
            )

            clipboard.container.innerText = {
                trim: jest.fn(() => testString)
            }

            const textDelta = clipboard.convert(testString)
            expect(textDelta.ops[0].insert).toEqual(true)
            expect(textDelta.ops[0].attributes.link).toContain(testString)

            clipboard.detach()
        })

        it.each(badUrls)(
            'should not attempt convert %s to a URL',
            (testString) => {
                const clipboard = new Clipboard(
                    {
                        ...Quill,
                        getText: jest.fn(() => true),
                        selection: {
                            savedRange: {
                                index: 0
                            }
                        }
                    },
                    {
                        matchers: [],
                        formats: []
                    }
                )

                clipboard.container.innerText = {
                    trim: jest.fn(() => testString)
                }

                const textDelta = clipboard.convert(testString)
                expect(textDelta).toEqual({ ops: [{ insert: testString }] })

                clipboard.detach()
            }
        )

        it.each(
            serviceLinks.map((serviceLink) => [
                serviceLink.originalLink,
                serviceLink.service
            ])
        )('converts %s to a %s service embed', (link, service) => {
            const authorId = 1
            const clipboard = new Clipboard(
                {
                    ...Quill,
                    getModule: jest.fn(() => ({
                        options: {
                            authorId
                        }
                    })),
                    getText: jest.fn(() => false),
                    selection: {
                        savedRange: {
                            index: 0
                        }
                    }
                },
                {
                    matchers: [],
                    formats: []
                }
            )

            clipboard.container.innerText = {
                trim: jest.fn(() => link)
            }

            const textDelta = clipboard.convert(link)

            const numberOfKeys = Object.keys(
                textDelta.ops[0].insert['block-embed']
            ).length
            expect.assertions(numberOfKeys + 1)

            expect(textDelta.ops).toHaveLength(1)
            expect(textDelta.ops[0].insert['block-embed'].authorId).toEqual(
                authorId
            )
            expect(textDelta.ops[0].insert['block-embed'].createdAt).toEqual(
                expect.any(Date)
            )
            expect(textDelta.ops[0].insert['block-embed'].embedData).toEqual({})
            expect(textDelta.ops[0].insert['block-embed'].originalLink).toEqual(
                link
            )
            expect(textDelta.ops[0].insert['block-embed'].service).toEqual(
                service
            )
            expect(textDelta.ops[0].insert['block-embed'].size).toEqual(
                'medium'
            )
            expect(textDelta.ops[0].insert['block-embed'].type).toEqual(
                'iframe'
            )
            expect(textDelta.ops[0].insert['block-embed'].uuid).toEqual(
                expect.any(String)
            )
            expect(textDelta.ops[0].insert['block-embed'].version).toEqual(1)

            clipboard.detach()
        })

        it.each(
            serviceLinks.map((serviceLink) => [
                serviceLink.originalLink,
                serviceLink.service
            ])
        )('converts %s to a %s link if text is selected', (link, service) => {
            const authorId = 1
            const clipboard = new Clipboard(
                {
                    ...Quill,
                    getModule: jest.fn(() => ({
                        options: {
                            authorId
                        }
                    })),
                    getText: jest.fn(() => true),
                    selection: {
                        savedRange: {
                            index: 0
                        }
                    }
                },
                {
                    matchers: [],
                    formats: []
                }
            )

            clipboard.container.innerText = {
                trim: jest.fn(() => link)
            }

            const textDelta = clipboard.convert(link)

            expect(textDelta).toEqual({
                ops: [{ insert: true, attributes: { link } }]
            })

            clipboard.detach()
        })
    })
})
