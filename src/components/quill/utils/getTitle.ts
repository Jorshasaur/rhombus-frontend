import { DeltaStatic, StringMap, DeltaOperation } from 'quill-delta'

export default function getTitle(contents: DeltaStatic) {
    let title = ''
    contents.eachLine(
        (line: DeltaStatic, attributes: StringMap, idx: number) => {
            title = line.reduce((res: string, op: DeltaOperation): string => {
                if (typeof op.insert === 'string') {
                    return `${res}${op.insert}`
                }
                return res
            }, '')

            return false
        }
    )
    return title
}
