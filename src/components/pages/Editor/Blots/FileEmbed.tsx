import * as React from 'react'
import { BlockEmbedProps } from '../../../../interfaces/blockEmbed'
import styles from './Blots.module.css'
import persistentBarStyles from './PersistentBar.module.css'
import { Subscribe } from 'unstated'
import FileEmbedContainer from './FileEmbedContainer'
import { Asset } from '../../../../interfaces/asset'
import IconDownload from '../../../../assets/images/icons/icon-download.svg'
import Spinner from '../../Spinner/Spinner'
import EmbedAnalytics from '../../../../analytics/AnalyticsBuilders/EmbedInteractionAnalytics'
import { Timestamp } from './Timestamp'
import { PersistentBar } from './PersistentBar'
import { noop } from 'lodash'

export default class FileEmbed extends React.Component<BlockEmbedProps> {
    render() {
        return (
            <Subscribe to={[FileEmbedContainer]}>
                {(embed: FileEmbedContainer) => {
                    const { fileName } = embed.state.embedData
                    const asset: Asset | undefined = embed.state.asset
                    const fileTypeClass = this._getFileTypeClass(fileName)
                    let createdAt

                    if (this.props.createdAt) {
                        createdAt = this.props.createdAt
                    } else if (asset && asset.createdAt) {
                        createdAt = asset.createdAt
                    }

                    return (
                        <div
                            className={`
                            ${styles.blockEmbedWrapper}
                            ${styles[this.props.service]}
                            ${this.props.uuid}
                            ${asset == null ? styles.uploading : ''}
                        `}>
                            <PersistentBar
                                service={fileTypeClass}
                                onClick={noop}
                                originalLink={this.props.originalLink}
                                name={this._renderFileName(fileName)}>
                                {this._renderActions(asset)}
                            </PersistentBar>
                            <Timestamp
                                author={this.props.authorName}
                                createdAt={createdAt}
                            />
                        </div>
                    )
                }}
            </Subscribe>
        )
    }

    _renderFileName(fullFileName: string | undefined) {
        if (fullFileName == null) {
            return
        }

        const fileNameArray = fullFileName.split('.')
        let fileName
        let ext = ''
        if (fileNameArray.length > 1) {
            ext = `.${fileNameArray.splice(-1)}`
            fileName = fileNameArray.join('.')
        } else {
            fileName = fullFileName
        }

        return (
            <div className={`${persistentBarStyles.textContent}`}>
                <div className={persistentBarStyles.title}>
                    {fileName}
                    <span className={persistentBarStyles.extension}>{ext}</span>
                </div>
            </div>
        )
    }

    _handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
        e.preventDefault()
        new EmbedAnalytics().onDownloaded().track()
    }

    _renderActions(asset: Asset | undefined) {
        let component
        if (asset != null) {
            const url = `${asset.url}?filename=${asset.fileName}`
            component = (
                <a
                    download={asset.fileName}
                    onMouseDown={this._handleMouseDown}
                    href={url}
                    target="_blank">
                    <IconDownload />
                </a>
            )
        } else {
            component = <Spinner />
        }

        return (
            <div className={styles.actionArea}>
                <span className={styles.actionLink}>{component}</span>
            </div>
        )
    }

    _getFileTypeClass(fileName: string | undefined) {
        if (fileName == null) {
            return 'unknown'
        }

        const fileNameArray = fileName.split('.')
        const ext = fileNameArray[fileNameArray.length - 1]

        switch (ext) {
            case 'studio':
                return 'studio'
            case 'sketch':
                return 'sketch'
            case 'pdf':
                return 'pdf'
            case 'xlsx':
            case 'xls':
                return 'excel'
            case 'docx':
            case 'doc':
                return 'word'
            case 'pptx':
            case 'ppt':
                return 'powerpoint'
            case 'mov':
            case 'mp4':
            case 'avi':
            case 'wmv':
            case 'webm':
            case 'ogv':
            case 'flv':
            case 'qt':
            case 'm4v':
                return 'movie'
            default:
                return 'unknown'
        }
    }
}
