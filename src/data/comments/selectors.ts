import { createSelector } from 'reselect'
import { Props } from '../../components/pages/Editor/Comments/CommentThread/Comment/Comment'
import { find } from 'lodash'
import { Member } from '../../interfaces/member'
import { MENTIONS_DOC_USER_ID } from '../../constants/mentions'
import { Text, Content } from '../../interfaces/content'
import { ContentType } from '../../interfaces/contentType'

const MENTION_V1_REGEX = /^(\d+):(.+)$/
const MENTION_V2_REGEX = /(<@U\d+>)/g
const MENTION_V2_CAPTURE_REGEX = /<@U(\d+)>/

function getText(text: string) {
    const parts = text.split('\n')
    const len = parts.length - 1
    return parts.reduce((res: Content[], part, index) => {
        if (part.length > 0) {
            res.push({
                type: ContentType.Text,
                text: part
            })
        }
        if (len !== index) {
            res.push({
                type: ContentType.Break
            })
        }
        return res
    }, [])
}

function getV1Content(source: string, teamMembers: Member[]) {
    const parts = source.split('<#')
    return parts.reduce((res: Content[], part) => {
        if (part.indexOf('#>') === -1) {
            res = res.concat(getText(part))
        } else {
            const [mention, text] = part.split('#>')
            const match = mention.match(MENTION_V1_REGEX)
            if (match != null) {
                const userId = parseInt(match[1], 10)
                const user = find(teamMembers, { userId })

                if (userId === MENTIONS_DOC_USER_ID) {
                    res.push({
                        type: ContentType.DocumentMention,
                        token: match[2]
                    })
                } else {
                    res.push({
                        type: ContentType.Mention,
                        token: match[2],
                        userId,
                        user
                    })
                }
            }
            res = res.concat(getText(text))
        }

        return res
    }, [])
}

function getV2Mentions(textContent: Text['text'], teamMembers: Member[]) {
    const mentionParts = textContent.split(MENTION_V2_REGEX)
    return mentionParts.reduce((res: Content[], part) => {
        const match = part.match(MENTION_V2_CAPTURE_REGEX)
        if (match) {
            const userId = parseInt(match[1], 10)
            const user = find(teamMembers, { userId })

            res.push({
                type: ContentType.Mention,
                token: user ? user.name : '',
                userId,
                user
            })
        } else {
            res = res.concat(getText(part))
        }
        return res
    }, [])
}

function getV2Content(content: Content[], teamMembers: Member[]) {
    return content.reduce((res: Content[], part) => {
        let parts: Content[] = [part]
        if (part.type === ContentType.Text) {
            parts = getV2Mentions(part.text, teamMembers)
        }

        return [...res, ...parts]
    }, [])
}

export function getContent(source: string, teamMembers: Member[]) {
    const v1Content = getV1Content(source, teamMembers)
    return getV2Content(v1Content, teamMembers)
}

export const makeGetCommentUserSelector = () => {
    return createSelector(
        [(props: Props) => props.userId, (props: Props) => props.teamMembers],
        (userId, teamMembers) => {
            return find(teamMembers, { userId: parseInt(userId, 10) })
        }
    )
}

export const makeGetContentSelector = () => {
    return createSelector(
        [
            (props: Props) => props.commentText,
            (props: Props) => props.teamMembers
        ],
        (commentText, teamMembers) => {
            return getContent(commentText, teamMembers)
        }
    )
}
