import { RawJSON1ServerRevision } from '../../interfaces/revision'

// Throws an error if the first argument is falsy. Useful for debugging.
function assert(b: boolean, msg: string) {
    if (!b) {
        throw new Error(msg || 'assertion error')
    }
}

export function validateIncomingOperation(
    operation: RawJSON1ServerRevision,
    currentRevision: number
) {
    // If no operation, bail
    assert(
        operation != null,
        'OTServerAdapter: Invalid Incoming Operation (Missing Operation)'
    )
    assert(
        operation.operation != null,
        'OTServerAdapter: Invalid Incoming Operation (Missing Operation.operation)'
    )
    // Delta is object with ops key
    assert(
        operation.operation.ops != null,
        'OTServerAdapter: Invalid Incoming Operation (Delta has not ops key)'
    )
    assert(
        Array.isArray(operation.operation.ops),
        'OTServerAdapter: Invalid Incoming Operation (Delta ops is not Array)'
    )
    // Incoming revision can't be equal or less than the curRevision
    // tslint:disable-next-line:max-line-length
    assert(
        operation.revision > currentRevision,
        'OTServerAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
    )
    // Incoming revision must be curRevision + 1 (otherwise we've missed a revision somewhere)
    // tslint:disable-next-line:max-line-length
    assert(
        currentRevision + 1 === operation.revision,
        'OTServerAdapter: Invalid Incoming Operation (revision is greater than +1 current revision)'
    )

    return true
}

export function validateIncomingJSON1Operation(
    operation: RawJSON1ServerRevision,
    currentRevision: number
) {
    // If no operation, bail
    assert(
        operation != null,
        'OTServerAdapter: Invalid Incoming Operation (Missing Operation)'
    )
    assert(
        operation.operation != null,
        'OTServerAdapter: Invalid Incoming Operation (Missing Operation.operation)'
    )
    assert(
        Array.isArray(operation.operation.ops),
        'OTServerAdapter: Invalid Incoming Operation (JSON1 op is not Array)'
    )
    // Incoming revision can't be equal or less than the curRevision
    // tslint:disable-next-line:max-line-length
    assert(
        operation.revision > currentRevision,
        'OTServerAdapter: Invalid Incoming Operation (revision is equal or less than current revision)'
    )
    // Incoming revision must be curRevision + 1 (otherwise we've missed a revision somewhere)
    // tslint:disable-next-line:max-line-length
    assert(
        currentRevision + 1 === operation.revision,
        'OTServerAdapter: Invalid Incoming Operation (revision is greater than +1 current revision)'
    )

    return true
}

export function validateRevisions(
    revisions: RawJSON1ServerRevision[],
    currentRevision: number
) {
    if (revisions.length === 0) {
        return true
    }

    // Make sure we haven't skipped a revision
    assert(
        currentRevision + 1 === revisions[0].revision,
        'OTServerAdapter: Invalid Revisions (Missing Revision(s) between current revision and revisions)'
    )

    // Make sure revs are sequential, not duplicated, and non-missing
    revisions.forEach((revision: RawJSON1ServerRevision, i: number) => {
        if (i > 0) {
            assert(
                revision.revision - revisions[i - 1].revision === 1,
                'OTServerAdapter: Invalid Revisions (Non-Sequential Revisions)'
            )
        }
    })

    return true
}
