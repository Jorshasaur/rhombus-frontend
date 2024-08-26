import { useCallback, useContext, useEffect, useRef } from 'react'
import Advil, { AdvilEvents, Pane } from '../../../../../../data/panes/Advil'
import { OTEditorClient } from '../../../../../../data/panes/OTClient'
import { OTServerAdapter } from '../../../../../../data/panes/OTServerAdapter'
import { SocketManager } from '../../../../../../data/panes/SocketManager'
import PagesApiService from '../../../../../../data/services/PagesApiService'
import store from '../../../../../../data/store'
import { PaneEmbedContext } from '../PaneEmbedContext'
import GlobalUndo from '../../../../../../data/undo/GlobalUndo'
import * as PaneQuillManager from '../PaneQuillManager'
import {
    registerClient,
    removeClient
} from '../../../../../../OTClientRegistry'

export function useAdvil(onUpdate: (pane: Pane) => void) {
    const { embedData } = useContext(PaneEmbedContext)
    const { pane } = embedData
    const advil = useRef<Advil>()
    const serverAdapter = useRef<OTServerAdapter>()
    const editorClient = useRef<OTEditorClient>()

    const initializePane = useCallback(
        async (paneId: string) => {
            const document = store.getState()
            advil.current = new Advil(paneId)

            GlobalUndo.register(paneId, advil.current.history)

            const paneContents = await PagesApiService.getPaneContents(paneId)

            onUpdate(paneContents.contents)

            advil.current.initialize(paneContents.contents)
            const socket = SocketManager.getInstance()

            socket.init(document.currentDocument.id, {
                id: document.user.userId,
                name: document.user.name,
                color: '#000'
            })

            const newState = {
                revision: paneContents.revision,
                operation: paneContents.contents
            }
            serverAdapter.current = new OTServerAdapter(
                paneId,
                document.currentDocument.id,
                newState,
                socket
            )

            editorClient.current = new OTEditorClient(
                paneId,
                paneContents.revision + 1,
                serverAdapter.current,
                advil.current
            )
            registerClient(paneId, editorClient.current)

            socket.attach()

            advil.current.on(AdvilEvents.UPDATE, (pane, operation, source) => {
                PaneQuillManager.handlePaneUpdate(pane, operation, source)
                onUpdate(advil.current!.pane)
            })
        },
        [onUpdate]
    )

    useEffect(() => {
        if (pane && !advil.current) {
            initializePane(pane)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const disconnect = useCallback(() => {
        editorClient.current?.disconnect()
        if (advil.current) {
            removeClient(advil.current?.paneId)
        }
    }, [])

    return { advil: advil.current, disconnect }
}
