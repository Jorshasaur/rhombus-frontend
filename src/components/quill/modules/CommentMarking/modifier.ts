import { DeltaOperation, DeltaStatic } from 'quill-delta'

export function markModifier(delta: DeltaStatic): DeltaStatic {
    const ops = delta.ops as DeltaOperation[]
    ops.forEach((op) => {
        if (
            op.attributes &&
            op.attributes.mark &&
            op.attributes.mark.length < 1
        ) {
            delete op.attributes.mark
        }
    })
    return delta
}
