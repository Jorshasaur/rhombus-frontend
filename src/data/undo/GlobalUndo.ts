interface UndoDocument {
    undo(): boolean
    redo(): boolean
    clear(): void
    cutoff(): void
    onDidRecord(fn: () => void): void
}

interface Stack {
    undo: string[]
    redo: string[]
}

export class GlobalUndo {
    private documents: Map<string, UndoDocument> = new Map()
    private stack: Stack = {
        undo: [],
        redo: []
    }

    register(id: string, undoDocument: UndoDocument) {
        if (this.documents.has(id)) {
            return
        }
        this.documents.set(id, undoDocument)
        undoDocument.onDidRecord(() => {
            this.stack.undo.push(id)
        })
    }

    cutoff(id: string) {
        const document = this.documents.get(id)
        if (document) {
            document.cutoff()
        }
    }

    clear(id: string) {
        const document = this.documents.get(id)
        if (document) {
            document.clear()
        }
    }

    canUndo() {
        return this.stack.undo.length > 0
    }

    canRedo() {
        return this.stack.redo.length > 0
    }

    undo = () => {
        const id = this.stack.undo.pop()
        if (!id) {
            return
        }

        const document = this.documents.get(id)
        if (!document) {
            return
        }

        if (document.undo()) {
            this.stack.redo.push(id)
        }
    }

    redo = () => {
        const id = this.stack.redo.pop()
        if (!id) {
            return
        }

        const document = this.documents.get(id)
        if (!document) {
            return
        }

        if (document.redo()) {
            this.stack.undo.push(id)
        }
    }
}

export default new GlobalUndo()
