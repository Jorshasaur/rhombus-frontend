import React, { useState, useEffect } from 'react'
import styles from '../CreateEmbedModal.module.css'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { BlockEmbedService } from '../../../../../interfaces/blockEmbed'
import { Modal, Input, Text } from '@invisionapp/helios'
import { useModalCopy } from '../hooks/useModalCopy'
import { FreehandDocumentSuccess } from '../../../../../data/services/FreehandResponseTypes'
import { ProjectsList } from './ProjectsList'
import useFuse from '../../../../../hooks/useFuse'
import { FuseOptions } from 'fuse.js'
import { useKeyboardHandler } from './hooks/useKeyboardHandler'
import { pipe } from 'lodash/fp'
import { useCreateFreehandHandler } from './hooks/useCreateFreehandHandler'
import PagesApiService from '../../../../../data/services/PagesApiService'
import FreehandIcon from '../../../../../assets/images/embeds/freehand.svg'

export const fuseOptions: FuseOptions = {
    distance: 20,
    threshold: 0.4,
    keys: ['name']
}

export interface Props {
    isShown: boolean
    embedType: BlockEmbedService
    onAddAndClose: (url: string) => void
    onClose: () => void
}

const getFreehandUrl = (path: string) => window.INVISION_ENV.BASE_URL + path

export const CreateFreehandModal: React.SFC<Props> = ({
    isShown,
    embedType,
    onAddAndClose,
    onClose
}) => {
    // set up state variables
    const modalCopy = useModalCopy(embedType)
    const [searchText, setSearchText] = useState('')
    const [error, setError] = useState('')
    const [freehands, setFreehands] = useState<FreehandDocumentSuccess[]>([])
    const suggestions = useFuse(freehands, searchText, fuseOptions)
    const [currentSuggestion, setCurrentSuggestion] = useState(0)

    // Hydrate with freehand documents
    useEffect(() => {
        PagesApiService.getFreehands().then((res) => {
            if (!res.success) {
                setError(res.error)
            }

            if (res.success) {
                setFreehands(res.freehands)
            }
        })
    }, [isShown])

    // set up event handlers
    const handleAdd = pipe(getFreehandUrl, onAddAndClose)
    const handleCreate = useCreateFreehandHandler(
        searchText,
        handleAdd,
        setError
    )
    const handleKeyDown = useKeyboardHandler(
        suggestions,
        currentSuggestion,
        setCurrentSuggestion,
        handleCreate,
        handleAdd
    )

    return (
        <ThemeProvider theme={theme}>
            <div
                className={
                    isShown ? styles.containerVisible : styles.container
                }>
                <Modal
                    data-testid="create-freehand-modal"
                    className={styles.createEmbedModal}
                    open={isShown}
                    closeOnEsc
                    onRequestClose={onClose}
                    aria-label="Add freehand">
                    <div
                        data-testid="create-freehand-modal__container"
                        className={styles.modal}>
                        <h3>Embed a new or existing Freehand</h3>
                        <form className={styles.inputContainerFreehand}>
                            <div className={styles.inputIcon}>
                                <FreehandIcon
                                    width={18}
                                    height={18}
                                    viewBox="8 2 8 18"
                                />
                            </div>
                            <Input
                                autoComplete="off"
                                id="create-freehand-modal__input"
                                className={
                                    searchText.length > 0
                                        ? styles.inputWithSuggestions
                                        : styles.input
                                }
                                style={{
                                    borderTopLeftRadius: 0,
                                    borderBottomLeftRadius: 0
                                }}
                                data-testid="create-freehand-modal__input"
                                compact
                                placeholder="Find or create a Freehand..."
                                type="text"
                                value={searchText}
                                onKeyDown={handleKeyDown}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>
                                ) => setSearchText(event.target.value)}
                            />
                        </form>
                        {error && (
                            <Text
                                order="body"
                                color="danger"
                                size="smaller"
                                style={{ margin: '10px 0' }}>
                                {error}
                            </Text>
                        )}
                        <div
                            style={{
                                position: 'relative',
                                display: error ? 'none' : undefined
                            }}>
                            <ProjectsList
                                projects={suggestions}
                                filter={searchText}
                                selectedProject={currentSuggestion}
                                onAdd={handleAdd}
                                onCreateNew={handleCreate}
                            />
                        </div>
                        <Text
                            order="body"
                            size="smaller"
                            color="text-lightest"
                            className={
                                isShown ? styles.tipVisible : styles.tip
                            }>
                            Pro tip: {modalCopy.tip}
                        </Text>
                    </div>
                </Modal>
            </div>
        </ThemeProvider>
    )
}
