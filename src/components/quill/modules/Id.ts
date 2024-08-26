import Delta, { DeltaStatic } from 'quill-delta'
import cuid from 'cuid'

export function getIdsDelta(delta: DeltaStatic) {
    const idDelta: DeltaStatic = new Delta()
    let idAdded = false

    delta.forEach((op) => {
        if (op.insert) {
            if (typeof op.insert === 'string') {
                if (op.insert === '\n') {
                    idAdded = true
                    idDelta.retain(1, {
                        id: cuid()
                    })
                } else if (op.insert.includes('\n')) {
                    idAdded = true
                    const parts = op.insert.split('\n')
                    const len = parts.length - 1
                    parts.forEach((part, index) => {
                        idDelta.retain(part.length)
                        if (index !== len) {
                            idDelta.retain(1, {
                                id: cuid()
                            })
                        }
                        return idDelta
                    })
                } else {
                    idDelta.retain(op.insert.length)
                }
            } else {
                idDelta.retain(1)
            }
        } else if (op.retain) {
            idDelta.retain(op.retain || 0)
        }
    })

    if (idAdded) {
        return idDelta
    }
    return
}
