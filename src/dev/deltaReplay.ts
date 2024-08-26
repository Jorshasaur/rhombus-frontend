import QuillSources from '../components/quill/modules/QuillSources'
import Delta from 'quill-delta'

export default function addDeltaReplay(editorQuill: any) {
    const quill = editorQuill
    let index = 0
    let deltas: any[] = []
    const history: any[] = []

    // only set snapshot equal to something if you want the doc to start with content
    // otherwise leave the variable undefined
    const snapshot = [
        {
            insert: 'Freehand Lady Power!\n we want to work together?',
            attributes: { author: 1 }
        },
        { insert: '\n', attributes: { list: 'unchecked', author: 1 } },
        { insert: 'RhombuJou/Freehand embeds', attributes: { author: 1 } },
        { insert: '\n\n', attributes: { list: 'unchecked', author: 1 } },
        { insert: '\n\n\n', attributes: { author: 1 } }
    ]

    if (snapshot) {
        setSnapshot(snapshot)
    }

    // These are the deltas that will be applied step by step to the doc
    const newDeltas = [
        { ops: [{ insert: '\n\n' }] },
        { ops: [{ insert: 'F', attributes: { author: 7783 } }] },
        {
            ops: [
                { retain: 1 },
                { insert: 'reehan', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 7 },
                { insert: 'd Lady ', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [{ retain: 14 }, { insert: 'P', attributes: { author: 7783 } }]
        },
        {
            ops: [
                { retain: 15 },
                { insert: 'ower!', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [{ retain: 21 }, { insert: '[', attributes: { author: 7783 } }]
        },
        {
            ops: [
                { retain: 21 },
                { delete: 1 },
                { retain: 1, attributes: { list: 'unchecked' } },
                { insert: '\n', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 21 },
                { insert: 'Rho', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 24 },
                { insert: 'mbus/', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 29 },
                { insert: 'Freehan', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 36 },
                { insert: 'd embe', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 42 },
                { insert: 'ds', attributes: { author: 7783 } },
                {
                    insert: '\n',
                    attributes: { list: 'unchecked', author: 7783 }
                }
            ]
        },
        {
            ops: [
                { retain: 21 },
                {
                    insert: '\n',
                    attributes: { list: 'unchecked', author: 7783 }
                }
            ]
        },
        {
            ops: [{ retain: 21 }, { insert: 'H', attributes: { author: 7783 } }]
        },
        {
            ops: [
                { retain: 22 },
                { insert: 'ow do', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 27 },
                { insert: ' we want', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 35 },
                { insert: ' to work t', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [
                { retain: 45 },
                { insert: 'ogether?', attributes: { author: 7783 } }
            ]
        },
        {
            ops: [{ retain: 21 }, { insert: 'G', attributes: { author: 7783 } }]
        },
        { ops: [{ retain: 21 }, { delete: 7 }] },
        {
            ops: [
                { retain: 54 },
                { insert: 'Jou', attributes: { author: 7783 } },
                { delete: 1 }
            ]
        },
        {
            ops: [
                { retain: 54 },
                {
                    insert: '\n',
                    attributes: { list: 'unchecked', author: 7783 }
                }
            ]
        },
        {
            ops: [
                { retain: 22 },
                { insert: 'etting', attributes: { author: 7783 } }
            ]
        },
        { ops: [{ retain: 20 }, { delete: 1 }] }
    ]
    setDeltas(newDeltas)

    document.addEventListener('keypress', function(e: any) {
        // backtick (`) key
        if (e.keyCode === 96) {
            nextDelta()
            // tilde (~) key which is shift + backtick
        } else if (e.keyCode === 126) {
            previousDelta()
        }
    })

    window.devModeHelpers = {}
    window.devModeHelpers.setSnapshot = setSnapshot
    window.devModeHelpers.setDeltas = setDeltas
    window.devModeHelpers.nextDelta = nextDelta
    window.devModeHelpers.previousDelta = previousDelta

    function setSnapshot(snapshotToSet: any) {
        quill.setContents(snapshotToSet)
    }

    function setDeltas(newDeltasToSet: any) {
        newDeltasToSet = newDeltasToSet.map(function(delta: any) {
            if (
                delta &&
                delta.ops &&
                delta.ops.attributes &&
                delta.ops.attributes.author
            ) {
                delete delta.ops.attributes.author
            }
            return delta
        })
        deltas = newDeltasToSet
    }

    function nextDelta(n: number = 1) {
        quill.blur()
        let currentContents: Delta
        let newContents: Delta
        let diff: Delta
        for (let i = 0; i < n; i++) {
            if (index >= deltas.length) {
                return
            }
            currentContents = quill.getContents()
            quill.updateContents(deltas[index], QuillSources.USER)
            newContents = quill.getContents()
            diff = newContents.diff(currentContents) as Delta
            history.push(diff)
            index++
        }
    }

    function previousDelta(n: number = 1) {
        quill.blur()
        for (let i = 0; i < n; i++) {
            if (index < 1) {
                return
            }
            if (history.length) {
                quill.updateContents(history[history.length - 1])
                history.pop()
            }
            index--
        }
    }
}
