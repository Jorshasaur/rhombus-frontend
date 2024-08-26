import Delta from 'quill-delta'
import { getIdsDelta } from '../../components/quill/modules/Id'

let counter = 0

const resetCuidCounter = () => {
    counter = 0
}

jest.mock('cuid', () => {
    return () => {
        counter += 1
        return `cuid${counter}`
    }
})

describe('Id', () => {
    beforeEach(() => {
        resetCuidCounter()
    })

    describe('getIdsDelta', () => {
        it('should add id attribute to new lines', () => {
            const delta1 = new Delta()
                .insert('\nUnti\n\ntled\n')
                .insert('Test')
                .insert('\n')

            const idDelta1 = getIdsDelta(delta1)

            expect(idDelta1).toEqual({
                ops: [
                    { attributes: { id: 'cuid1' }, retain: 1 },
                    { retain: 4 },
                    { attributes: { id: 'cuid2' }, retain: 1 },
                    { attributes: { id: 'cuid3' }, retain: 1 },
                    { retain: 4 },
                    { attributes: { id: 'cuid4' }, retain: 1 },
                    { retain: 4 },
                    { attributes: { id: 'cuid5' }, retain: 1 }
                ]
            })
            expect(delta1.compose(idDelta1!)).toEqual({
                ops: [
                    { attributes: { id: 'cuid1' }, insert: '\n' },
                    { insert: 'Unti' },
                    { attributes: { id: 'cuid2' }, insert: '\n' },
                    { attributes: { id: 'cuid3' }, insert: '\n' },
                    { insert: 'tled' },
                    { attributes: { id: 'cuid4' }, insert: '\n' },
                    { insert: 'Test' },
                    { attributes: { id: 'cuid5' }, insert: '\n' }
                ]
            })

            resetCuidCounter()

            const delta2 = new Delta()
                .insert('Test', { authorId: true })
                .insert('a\n')
            const idDelta2 = getIdsDelta(delta2)

            expect(idDelta2).toEqual({
                ops: [{ retain: 5 }, { attributes: { id: 'cuid1' }, retain: 1 }]
            })
            expect(delta2.compose(idDelta2!)).toEqual({
                ops: [
                    { attributes: { authorId: true }, insert: 'Test' },
                    { insert: 'a' },
                    { attributes: { id: 'cuid1' }, insert: '\n' }
                ]
            })

            resetCuidCounter()

            const delta3 = new Delta({
                ops: [
                    {
                        retain: 22
                    },
                    {
                        attributes: {
                            bold: true,
                            author: 1
                        },
                        insert: 'aaa'
                    },
                    {
                        attributes: {
                            header: 2,
                            author: 1
                        },
                        insert: '\n'
                    },
                    {
                        attributes: {
                            author: 1
                        },
                        insert: 'b'
                    },
                    {
                        insert: '\n\n\n\n',
                        attributes: {
                            author: 1
                        }
                    }
                ]
            })
            const idDelta3 = getIdsDelta(delta3)

            expect(idDelta3).toEqual({
                ops: [
                    { retain: 25 },
                    { attributes: { id: 'cuid1' }, retain: 1 },
                    { retain: 1 },
                    { attributes: { id: 'cuid2' }, retain: 1 },
                    { attributes: { id: 'cuid3' }, retain: 1 },
                    { attributes: { id: 'cuid4' }, retain: 1 },
                    { attributes: { id: 'cuid5' }, retain: 1 }
                ]
            })

            resetCuidCounter()

            const delta4 = new Delta()
                .insert('Title\n')
                .insert({ embed: { id: 1 } })
                .insert('a\n')
            const idDelta4 = getIdsDelta(delta4)

            expect(idDelta4).toEqual({
                ops: [
                    { retain: 5 },
                    { attributes: { id: 'cuid1' }, retain: 1 },
                    { retain: 2 },
                    { attributes: { id: 'cuid2' }, retain: 1 }
                ]
            })
            expect(delta4.compose(idDelta4!)).toEqual({
                ops: [
                    { insert: 'Title' },
                    { attributes: { id: 'cuid1' }, insert: '\n' },
                    { insert: { embed: { id: 1 } } },
                    { insert: 'a' },
                    { attributes: { id: 'cuid2' }, insert: '\n' }
                ]
            })

            resetCuidCounter()

            const delta5 = new Delta({ ops: [{ insert: 'a\nb\nc' }] })
            const idDelta5 = getIdsDelta(delta5)

            expect(idDelta5).toEqual({
                ops: [
                    {
                        retain: 1
                    },
                    {
                        retain: 1,
                        attributes: {
                            id: 'cuid1'
                        }
                    },
                    {
                        retain: 1
                    },
                    {
                        retain: 1,
                        attributes: {
                            id: 'cuid2'
                        }
                    },
                    {
                        retain: 1
                    }
                ]
            })
            expect(delta5.compose(idDelta5!)).toEqual({
                ops: [
                    { insert: 'a' },
                    { attributes: { id: 'cuid1' }, insert: '\n' },
                    { insert: 'b' },
                    { attributes: { id: 'cuid2' }, insert: '\n' },
                    { insert: 'c' }
                ]
            })
        })

        it('should not return delta when there is no insert new line operation', () => {
            const delta = new Delta()
                .insert('Test', { authorId: true })
                .insert({ embed: { id: 1 } })
            expect(getIdsDelta(delta)).toBeUndefined()
        })

        it('should not preserve id', () => {
            const delta = new Delta()
                .insert('Test', { authorId: true })
                .insert('\n', { id: '123' })
                .insert('\nabc\n')
                .insert('Test')
                .insert('\n', { id: '234' })

            const idDelta = getIdsDelta(delta)

            expect(idDelta).toEqual({
                ops: [
                    {
                        retain: 4
                    },
                    {
                        retain: 1,
                        attributes: {
                            id: 'cuid1'
                        }
                    },
                    {
                        retain: 1,
                        attributes: {
                            id: 'cuid2'
                        }
                    },
                    {
                        retain: 3
                    },
                    {
                        retain: 1,
                        attributes: {
                            id: 'cuid3'
                        }
                    },
                    {
                        retain: 4
                    },
                    {
                        retain: 1,
                        attributes: {
                            id: 'cuid4'
                        }
                    }
                ]
            })

            expect(delta.compose(idDelta!)).toEqual({
                ops: [
                    { insert: 'Test', attributes: { authorId: true } },
                    { insert: '\n', attributes: { id: 'cuid1' } },
                    { insert: '\n', attributes: { id: 'cuid2' } },
                    { insert: 'abc' },
                    { insert: '\n', attributes: { id: 'cuid3' } },
                    { insert: 'Test' },
                    { insert: '\n', attributes: { id: 'cuid4' } }
                ]
            })
        })
    })
})
