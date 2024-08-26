import React, { useState } from 'react'
import styles from './CreateEmbedModal.module.css'
import { ThemeProvider } from 'styled-components'
import theme from '@invisionapp/helios/css/theme'
import { BlockEmbedService } from '../../../../interfaces/blockEmbed'
import { Button, Modal, Input, Text } from '@invisionapp/helios'
import { startCase } from 'lodash'
import { useModalCopy, isDisabled } from './hooks/useModalCopy'

export interface Props {
    isShown: boolean
    embedType: BlockEmbedService
    onAddAndClose: (url: string) => void
    onClose: () => void
}

export const CreateEmbedModal: React.SFC<Props> = ({
    isShown,
    embedType,
    onAddAndClose,
    onClose
}) => {
    const [url, setUrl] = useState('')

    const modalCopy = useModalCopy(embedType)

    return (
        <ThemeProvider theme={theme}>
            <div
                className={
                    isShown ? styles.containerVisible : styles.container
                }>
                <Modal
                    data-testid="create-embed-modal"
                    className={styles.createEmbedModal}
                    open={isShown}
                    closeOnEsc
                    onRequestClose={onClose}
                    aria-label="Add embed">
                    <div
                        data-testid="create-embed-modal__container"
                        className={styles.modal}>
                        <h3>Add {modalCopy.title}</h3>
                        <p>{modalCopy.subtitle}</p>
                        <form
                            className={styles.inputContainer}
                            onSubmit={(e) => {
                                e.preventDefault()
                                onAddAndClose(url)
                            }}>
                            <Input
                                id="create-embed-modal__input"
                                className={styles.input}
                                data-testid="create-embed-modal__input"
                                compact
                                placeholder={`Paste a ${startCase(
                                    embedType
                                )} URL`}
                                type="text"
                                value={url}
                                onChange={(
                                    event: React.ChangeEvent<HTMLInputElement>
                                ) => setUrl(event.target.value)}
                            />
                            <Button
                                disabled={isDisabled(url, embedType)}
                                type="submit"
                                data-testid="create-embed-modal__add-button"
                                order="primary">
                                Add
                            </Button>
                        </form>
                        <Text
                            order="body"
                            size="smaller"
                            color="text-lightest"
                            className={
                                isShown ? styles.tipVisible : styles.tip
                            }>
                            Pro tip: {modalCopy.tip}
                        </Text>
                        {modalCopy.exampleUrl && (
                            <div
                                className={styles.exampleContainer}
                                onClick={() => setUrl(modalCopy.exampleUrl!)}>
                                <Text
                                    element="div"
                                    order="body"
                                    size="smaller"
                                    className={styles.exampleHeader}>
                                    Try this example
                                </Text>
                                <Text
                                    color="text-lightest"
                                    element="div"
                                    order="body"
                                    size="smaller">
                                    {modalCopy.exampleUrl}
                                </Text>
                            </div>
                        )}
                    </div>
                </Modal>
            </div>
        </ThemeProvider>
    )
}
