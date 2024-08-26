let Quill: any = jest.genMockFromModule('quill/core')

Quill.root = document.createElement('div')

const events = {}
Quill.on = (eventName: string, handler: Function) => {
    events[eventName] = handler
}

Quill.emit = (eventName: string, ...args: any[]) => {
    events[eventName](...args)
}
Quill.getLine = jest.fn(() => {
    return [
        {
            domNode: {
                clientHeight: 110
            },
            length: () => {
                return 0
            }
        }
    ]
})
Quill.getLength = jest.fn(() => {
    return 0
})

Quill.getIndex = jest.fn(() => {
    return 1
})

Quill.getModule = (mod: string) => {
    if (mod === 'authorship') {
        return {
            options: {
                authorId: 1
            }
        }
    }

    return undefined
}

Quill.deleteText = jest.fn()
Quill.setSelection = jest.fn()
Quill.insertText = jest.fn()
Quill.insertEmbed = jest.fn()
Quill.getText = jest.fn(() => {
    return ''
})
Quill.enable = jest.fn()

Quill.container = document.createElement('div')
Quill.scrollingContainer = document.createElement('div')

Quill.selection = {
    rangeToNative() {
        return [document.createElement('p'), 0, document.createElement('p'), 0]
    }
}

Quill.getBounds = () => {
    return {
        top: 10
    }
}

export const mockQuillProvider = {
    getQuill: () => Quill,
    setQuill: (quill: any) => (Quill = quill)
}

export const mockQuill = Quill
