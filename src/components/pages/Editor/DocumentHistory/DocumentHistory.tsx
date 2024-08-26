import { Adjacent, Button, Modal, Skeleton, Text } from '@invisionapp/helios'
import cx from 'classnames'
import QuillType from 'quill'
import Delta from 'quill-delta'
import React, { useEffect, useState } from 'react'
import { IS_END_TO_END_TEST } from '../../../../constants/general'
import { types } from '../../../../data/documentHistory/types'
import PagesApiService from '../../../../data/services/PagesApiService'
import { useCustomQuillInstance } from '../../../../hooks/useCustomQuillInstance'
import { DocumentHistoryRevision } from '../../../../interfaces/documentHistoryRevision'
import QuillSources from '../../../quill/modules/QuillSources'
import styles from './DocumentHistory.module.css'
import Revision from './Revision/RevisionContainer'

interface Props {
    editorQuill: QuillType
    prepareRevert: () => void
    hideDocumentHistory: () => { type: types }
}

const DOCUMENT_HISTORY_EDITOR_ID = 'document-history-editor'

const quillOptions = {
    modules: {
        keyboard: {
            emoji: {
                picker: false,
                shortcode: false
            },
            mentions: false
        },
        permissions: {
            canEdit: false
        },
        clipboard: {
            matchVisual: false
        },
        toolbar: false,
        'multi-cursor': false,
        authorship: {
            enabled: false
        },
        history: {
            userOnly: true
        },
        emoji: true,
        'emoji-picker-manager': {
            enabled: false
        },
        'file-paste': false,
        'file-drop': false,
        'mentions-manager': false,
        'selection-manager': {
            enabled: true,
            editorId: DOCUMENT_HISTORY_EDITOR_ID
        },
        'mouseover-manager': false,
        'authors-manager': false,
        placeholder: { enabled: false }
    },
    theme: 'snow'
}

export function DocumentHistory(props: Props) {
    const [editorRef, quill] = useCustomQuillInstance('history', quillOptions)
    const [revisions, setRevisions] = useState<DocumentHistoryRevision[]>([])
    const [activeRevision, setActiveRevision] = useState<number>()
    const [currentRevisionSelected, setCurrentRevisionSelected] = useState<
        boolean
    >(true)

    useEffect(() => {
        if (quill) {
            quill.setContents(props.editorQuill.getContents())
            if (IS_END_TO_END_TEST) {
                window.historyQuill = quill
            }
            quill.disable()
        }
    }, [props.editorQuill, quill])

    useEffect(() => {
        if (!revisions.length) {
            PagesApiService.getRevisions().then((remoteRevisions) => {
                const sortedRevisions = remoteRevisions.sort((a, b) => {
                    return new Date(b.createdAt) > new Date(a.createdAt)
                        ? 1
                        : -1
                })
                setRevisions(sortedRevisions)
                setActiveRevision(sortedRevisions[0].revision)
            })
        }
    })

    async function updateDocument(
        newRevision: number,
        isCurrentRevision: boolean
    ) {
        setActiveRevision(newRevision)
        setCurrentRevisionSelected(isCurrentRevision)
        if (quill) {
            const diff = await PagesApiService.getContentAtRevision(newRevision)
            quill.setContents(new Delta(diff.contents.delta), QuillSources.API)
        }
    }

    async function applyRevision() {
        if (quill) {
            props.prepareRevert()
            const diff = props.editorQuill
                .getContents()
                .diff(quill.getContents())
            props.editorQuill.updateContents(diff, QuillSources.USER)
            props.hideDocumentHistory()
        }
    }

    return (
        <div className={styles.modalContainer}>
            <Modal
                // @ts-ignore
                style={{ background: 'var(--color-doc-history-background)' }}
                data-testid="history-modal"
                open={revisions.length > 0}
                closeOnEsc
                onRequestClose={() => {
                    props.hideDocumentHistory()
                }}
                aria-label="Add embed"
                maxWidth={1024}>
                <div className={styles.historyModal}>
                    {revisions.length > 0 ? (
                        <React.Fragment>
                            <div
                                className={styles.revisionsContainer}
                                data-testid="revisions-container">
                                <Text
                                    size="larger"
                                    order="subtitle"
                                    className={styles.revisionsHeader}>
                                    Document History
                                </Text>
                                <div className={styles.revisionsList}>
                                    {revisions.map(
                                        (
                                            revision: DocumentHistoryRevision,
                                            index: number
                                        ) => {
                                            return (
                                                <Revision
                                                    onClick={() => {
                                                        updateDocument(
                                                            revision.revision,
                                                            index === 0
                                                        )
                                                    }}
                                                    key={revision.id}
                                                    id={revision.id}
                                                    users={revision.users}
                                                    date={
                                                        new Date(
                                                            revision.createdAt
                                                        )
                                                    }
                                                    isActive={
                                                        activeRevision ===
                                                        revision.revision
                                                    }
                                                    isCurrent={index === 0}
                                                />
                                            )
                                        }
                                    )}
                                </div>
                                <Adjacent
                                    spacing="m"
                                    className={styles.buttonContainer}>
                                    <React.Fragment>
                                        <Button
                                            data-testid="history-cancel-button"
                                            order="secondary"
                                            size="smaller"
                                            role="button"
                                            className={styles.historyButton}
                                            onClick={() => {
                                                props.hideDocumentHistory()
                                            }}>
                                            Cancel
                                        </Button>
                                        <Button
                                            data-testid="history-revert-button"
                                            size="smaller"
                                            order="primary"
                                            role="button"
                                            className={styles.historyButton}
                                            disabled={currentRevisionSelected}
                                            onClick={() => {
                                                applyRevision()
                                            }}>
                                            Revert
                                        </Button>
                                    </React.Fragment>
                                </Adjacent>
                            </div>
                            <div className={styles.editorContainer}>
                                <div
                                    id={DOCUMENT_HISTORY_EDITOR_ID}
                                    className={cx(
                                        styles.previewEditor,
                                        'quill-container'
                                    )}
                                    ref={editorRef}
                                />
                            </div>
                        </React.Fragment>
                    ) : (
                        <Skeleton />
                    )}
                </div>
            </Modal>
        </div>
    )
}
