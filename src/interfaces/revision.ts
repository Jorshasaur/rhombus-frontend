import { DeltaStatic, DeltaOperation } from 'quill-delta'
import json1 from 'ot-json1'
import { JSON1Wrapper } from '../data/panes/Advil'

export interface Revision {
    operation: DeltaStatic
    revision: number
    submissionId: string
    userId: number
    createdAt: string
    revert: boolean
}

export interface BaseServerRevision<T = unknown> {
    operation: T
    submissionId: string
    revision: number
    paneId?: string
}

interface RawOperation<T = unknown> {
    ops: T
}

export type RawDeltaOperation = RawOperation<DeltaOperation[]>
export type RawJSON1Operation = RawOperation<json1.JSONOp>

export type RawDeltaServerRevision = BaseServerRevision<RawDeltaOperation>
export type RawJSON1ServerRevision = BaseServerRevision<RawJSON1Operation>

export type DeltaServerRevision = BaseServerRevision<DeltaStatic>
export type JSON1ServerRevision = BaseServerRevision<JSON1Wrapper>
