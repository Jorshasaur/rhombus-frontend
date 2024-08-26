import * as React from 'react'
import { Provider } from 'unstated'
import { v4 as uuid } from 'uuid'
import { getAuthor } from '../../../data/authors/selectors'
import store from '../../../data/store'
import { getPlayUrl } from '../../../helpers/EmbedHelper'
import { BlockEmbedValue } from '../../../interfaces/blockEmbed'
import CodepenEmbed from '../../pages/Editor/Blots/CodepenEmbed'
import DirectIframeBlockEmbed from '../../pages/Editor/Blots/DirectIframeBlockEmbed'
import FileEmbed from '../../pages/Editor/Blots/FileEmbed'
import FileEmbedContainer from '../../pages/Editor/Blots/FileEmbedContainer'
import FlatPrototypeEmbed from '../../pages/Editor/Blots/FlatPrototypeEmbed/FlatPrototypeEmbed'
import FlatProtoEmbedContainer from '../../pages/Editor/Blots/FlatPrototypeEmbed/FlatPrototypeEmbedContainer'
import FreehandEmbed from '../../pages/Editor/Blots/FreehandEmbed/FreehandEmbed'
import FreehandEmbedContainer from '../../pages/Editor/Blots/FreehandEmbed/FreehandEmbedContainer'
import ImageEmbed from '../../pages/Editor/Blots/ImageEmbed'
import ImageEmbedContainer from '../../pages/Editor/Blots/ImageEmbedContainer'
import MarvelEmbed from '../../pages/Editor/Blots/MarvelEmbed'
import PrototypeEmbed from '../../pages/Editor/Blots/PrototypeEmbed'
import PrototypeEmbedContainer from '../../pages/Editor/Blots/PrototypeEmbedContainer'
import VideoEmbed from '../../pages/Editor/Blots/VideoEmbed'
import JiraEmbed from '../../pages/Editor/Blots/JiraEmbed/JiraEmbed'
import JiraEmbedContainer from '../../pages/Editor/Blots/JiraEmbed/JiraEmbedContainer'

export default {
    prototype: (data: BlockEmbedValue, domNode: HTMLElement) => {
        const provider = new PrototypeEmbedContainer(data, domNode)
        provider.quillBlotElement = domNode
        const container = domNode.parentNode
        if (!container || !(container instanceof HTMLElement)) {
            return
        }
        const playUrl = getPlayUrl(data.originalLink!)
        const component = (
            <Provider inject={[provider]}>
                <PrototypeEmbed
                    authorId={data.authorId}
                    authorName={getAuthor(store.getState(), data.authorId)}
                    embedData={data.embed}
                    key={uuid()}
                    originalLink={playUrl}
                    service={data.service}
                    title="Prototype"
                    type={data.type}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                    container={container}
                />
            </Provider>
        )

        return [component, provider]
    },
    invision: (data: BlockEmbedValue, domNode: HTMLElement) => {
        const provider = new FlatProtoEmbedContainer(data, domNode)
        provider.quillBlotElement = domNode
        const container = domNode.parentNode
        if (!container || !(container instanceof HTMLElement)) {
            return
        }
        const component = (
            <Provider inject={[provider]}>
                <FlatPrototypeEmbed
                    authorId={data.authorId}
                    authorName={getAuthor(store.getState(), data.authorId)}
                    embedData={data.embed}
                    key={uuid()}
                    originalLink={data.originalLink}
                    service={data.service}
                    title="Prototype"
                    type={data.type}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                    container={container}
                />
            </Provider>
        )

        return [component, provider]
    },
    freehand: (data: BlockEmbedValue, domNode: HTMLElement) => {
        const container = domNode.parentNode
        if (!container || !(container instanceof HTMLElement)) {
            return
        }

        const provider = new FreehandEmbedContainer(data, domNode)
        const component = (
            <Provider inject={[provider]}>
                <FreehandEmbed
                    authorId={data.authorId}
                    authorName={getAuthor(store.getState(), data.authorId)}
                    embedData={data.embed}
                    key={uuid()}
                    originalLink={data.originalLink}
                    service={data.service}
                    title="Freehand"
                    type={data.type}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                    container={container}
                />
            </Provider>
        )
        return [component, provider]
    },
    codepen: (data: BlockEmbedValue) => (
        <CodepenEmbed
            authorId={data.authorId}
            authorName={getAuthor(store.getState(), data.authorId)}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink}
            service={data.service}
            title="Codepen"
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    marvel: (data: BlockEmbedValue) => (
        <MarvelEmbed
            authorId={data.authorId}
            authorName={getAuthor(store.getState(), data.authorId)}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink}
            service={data.service}
            title="Marvel App"
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    youtube: (data: BlockEmbedValue) => (
        <DirectIframeBlockEmbed
            authorId={data.authorId}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink!}
            service={data.service}
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    vimeo: (data: BlockEmbedValue) => (
        <DirectIframeBlockEmbed
            authorId={data.authorId}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink!}
            service={data.service}
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    soundcloud: (data: BlockEmbedValue) => (
        <DirectIframeBlockEmbed
            authorId={data.authorId}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink!}
            service={data.service}
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    spotify: (data: BlockEmbedValue) => (
        <DirectIframeBlockEmbed
            authorId={data.authorId}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink!}
            service={data.service}
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    linkedin: (data: BlockEmbedValue) => (
        <DirectIframeBlockEmbed
            authorId={data.authorId}
            embedData={data.embed}
            key={uuid()}
            originalLink={data.originalLink!}
            service={data.service}
            type={data.type}
            uuid={data.uuid}
            version={data.version}
            createdAt={data.createdAt}
        />
    ),
    jira: (data: BlockEmbedValue, domNode: HTMLElement) => {
        const provider = new JiraEmbedContainer(data, domNode)

        const component = (
            <Provider inject={[provider]}>
                <JiraEmbed
                    authorId={data.authorId}
                    embedData={data.embedData}
                    key={uuid()}
                    service={data.service}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                />
            </Provider>
        )

        return [component, provider]
    },
    file: (data: BlockEmbedValue, domNode: HTMLElement) => {
        const provider = new FileEmbedContainer(data, domNode)

        const component = (
            <Provider inject={[provider]}>
                <FileEmbed
                    authorId={data.authorId}
                    embedData={data.embedData}
                    key={uuid()}
                    service={data.service}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                />
            </Provider>
        )

        return [component, provider]
    },
    image: (
        data: BlockEmbedValue,
        domNode: HTMLElement,
        insidePane: boolean
    ) => {
        const provider = new ImageEmbedContainer(data, domNode)
        const container = domNode.parentNode
        if (!container || !(container instanceof HTMLElement)) {
            return
        }

        const component = (
            <Provider inject={[provider]}>
                <ImageEmbed
                    authorId={data.authorId}
                    embedData={data.embedData}
                    key={uuid()}
                    service={data.service}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                    container={container}
                    insidePane={insidePane}
                />
            </Provider>
        )

        return [component, provider]
    },
    video: (data: BlockEmbedValue, domNode: HTMLElement) => {
        const provider = new FileEmbedContainer(data, domNode)
        const container = domNode.parentNode
        if (!container || !(container instanceof HTMLElement)) {
            return
        }

        const component = (
            <Provider inject={[provider]}>
                <VideoEmbed
                    authorId={data.authorId}
                    authorName={getAuthor(store.getState(), data.authorId)}
                    embedData={data.embedData}
                    key={uuid()}
                    service={data.service}
                    uuid={data.uuid}
                    version={data.version}
                    createdAt={data.createdAt}
                    container={container}
                />
            </Provider>
        )

        return [component, provider]
    }
}
