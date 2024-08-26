import Authorship from '../../components/quill/modules/Authorship'
import QuillEvents from '../../components/quill/modules/QuillEvents'
import QuillSources from '../../components/quill/modules/QuillSources'

const Quill: any = jest.genMockFromModule('quill/core')

const insertDelta = {
    ops: [
        {
            insert: {
                length: 1
            }
        }
    ]
}
const retainDelta = {
    ops: [
        {
            retain: {
                length: 1
            }
        }
    ]
}
const deleteDelta = {
    ops: [
        {
            delete: {
                length: 1
            }
        }
    ]
}

const authorId = 1

beforeEach(() => {
    const events = {}

    Quill.root = document.createElement('div')

    Quill.on = (eventName: string, handler: Function) => {
        events[eventName] = handler
    }

    Quill.off = (eventName: string, handler: Function) => {
        delete events[eventName]
    }

    Quill.emit = (eventName: string, ...args: any[]) => {
        events[eventName](...args)
    }

    Quill.scrollingContainer = HTMLDivElement
    Quill.updateContents = jest.fn()
    Quill.setSelection = jest.fn()
    Quill.getSelection = jest.fn(() => {
        return {
            index: 1,
            length: 5
        }
    })
})

describe('Authorship', () => {
    it('should add the pages-authorship class to the Quill root when enabled', () => {
        new Authorship(Quill, {
            authorId,
            enabled: true,
            color: '#FFFFFF'
        })
        expect(Quill.root.classList.contains('pages-authorship')).toBe(true)
    })
    it('should remove the pages-authorship class to the Quill root when disabled', () => {
        new Authorship(Quill, {
            authorId,
            enabled: false,
            color: '#FFFFFF'
        })
        expect(Quill.root.classList.contains('pages-authorship')).toBe(false)
    })
    it('should add authorship on an insert operation', () => {
        new Authorship(Quill, {
            authorId,
            enabled: true,
            color: '#FFFFFF'
        })
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            insertDelta,
            {},
            QuillSources.USER
        )
        expect(Quill.updateContents).toBeCalledWith(
            {
                ops: [
                    {
                        attributes: { author: authorId, keepAuthor: false },
                        retain: insertDelta.ops[0].insert.length
                    }
                ]
            },
            QuillSources.SILENT
        )
    })
    it('should not authorship on a retain operation', () => {
        new Authorship(Quill, {
            authorId,
            enabled: true,
            color: '#FFFFFF'
        })
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            retainDelta,
            {},
            QuillSources.USER
        )
        expect(Quill.updateContents).toBeCalledWith(
            {
                ops: [
                    {
                        attributes: { keepAuthor: false },
                        retain: { length: retainDelta.ops[0].retain.length }
                    }
                ]
            },
            QuillSources.SILENT
        )
    })
    it('should return an empty op on a delete operation', () => {
        new Authorship(Quill, {
            authorId,
            enabled: true,
            color: '#FFFFFF'
        })
        Quill.emit(
            QuillEvents.EDITOR_CHANGE,
            QuillEvents.TEXT_CHANGE,
            deleteDelta,
            {},
            QuillSources.USER
        )
        expect(Quill.updateContents).toBeCalledWith(
            { ops: [] },
            QuillSources.SILENT
        )
    })
})
