import { findIndex } from 'lodash'
import { Props } from './Comments'
import {
    DEFAULT_THREAD_HEIGHT,
    DEFAULT_THREAD_PADDING
} from '../../../../constants/comments'
import { Thread } from '../../../../interfaces/thread'
import blockEmbedStyles from '../Blots/Blots.module.css'

export interface SortedThread extends Thread {
    top: number
    left: number
    height: number
    collapsed?: boolean
}

const checkThreadsByLargeEmbeds = (
    navigation: Props['elementCoordinates']['navigation'],
    selectedCommentMarkId: Props['comments']['selectedCommentMarkId'],
    largeEmbeds: NodeListOf<Element>,
    sortedThreads: SortedThread[],
    appScrollPosition: number
): SortedThread[] => {
    return sortedThreads.map((thread) => {
        largeEmbeds.forEach((embed) => {
            const embedTop =
                embed.getBoundingClientRect().top +
                appScrollPosition -
                navigation.height
            const embedHeight = embed.getBoundingClientRect().height
            // If the comment thread is within a large embed range, collapse those comments to the avatar only view.
            if (
                thread.top >= embedTop &&
                thread.top <= embedTop + embedHeight &&
                thread.markId !== selectedCommentMarkId
            ) {
                thread.collapsed = true
            } else if (
                thread.top + thread.height >= embedTop &&
                thread.top + thread.height <= embedTop + embedHeight &&
                thread.markId !== selectedCommentMarkId
            ) {
                thread.collapsed = true
            }
        })

        return thread
    })
}

const generateReverseOffset = (
    threadIndex: number,
    stopIndex: number,
    threads: SortedThread[]
): number => {
    // Get only the threads that are before the selected thread, and reverse them
    const previousThreads = threads.slice(threadIndex, stopIndex).reverse()
    return previousThreads.reduce(
        (
            accumulator: number,
            currentValue: SortedThread,
            currentIndex: number
        ): number => {
            const currentBottom = currentValue.top + currentValue.height
            const previousThread =
                currentIndex === 0
                    ? threads[stopIndex]
                    : previousThreads[currentIndex - 1]
            const previousTop = previousThread.top

            let offset = currentBottom - previousTop
            offset = offset + accumulator + 15
            return offset
        },
        0
    )
}

const generateOffset = (
    currentThread: SortedThread,
    previousThread: SortedThread
): number => {
    const prevThreadHeight =
        previousThread && previousThread.height
            ? previousThread.height
            : DEFAULT_THREAD_HEIGHT
    // Get the bottom of the previous thread by adding height + top
    const prevThreadBottom =
        previousThread && previousThread.top
            ? previousThread.top + prevThreadHeight
            : prevThreadHeight
    // Get the amount that the two threads overlap
    const overlap = prevThreadBottom - currentThread.top
    // If it is greater than zero, bump the comment thread down by the overlap amount
    let offset = overlap > 0 ? overlap : 0
    // Set offset to be a minimum of 15
    if (overlap - offset === 0) {
        offset = offset + DEFAULT_THREAD_PADDING
    }
    return offset
}

function isThread(thread: Thread | undefined): thread is Thread {
    return thread !== undefined
}

const getThreadsWithPositionData = (
    threads: Thread[],
    navigation: Props['elementCoordinates']['navigation'],
    appScrollPosition: number
) =>
    threads.map((thread) => {
        const element = document.querySelector(
            `.mark-id-${thread.markId}`
        ) as HTMLElement
        if (!element) {
            return
        }

        const top =
            element.getBoundingClientRect().top +
            appScrollPosition -
            navigation.height
        const left = element.getBoundingClientRect().left
        const commentElement = document.getElementById(
            `thread-${thread.markId}`
        )
        const height = commentElement
            ? commentElement.getBoundingClientRect().height
            : DEFAULT_THREAD_HEIGHT
        const sortedThread = {
            ...thread,
            height,
            top,
            left
        }
        return sortedThread
    })

const sortThreadsByMarkPosition = (filteredThreads: SortedThread[]) =>
    filteredThreads.sort(function(a: SortedThread, b: SortedThread) {
        return a.top === b.top ? a.left - b.left : a.top - b.top
    })

const getSortedThreads = (
    threadsByMark: SortedThread[],
    selectedCommentMarkId: Props['comments']['selectedCommentMarkId']
) => {
    let previousThread: SortedThread

    return threadsByMark.map((thread: SortedThread, index: number) => {
        const sortedThread = {
            ...thread,
            top: thread.top
        }
        const offset = index > 0 ? generateOffset(thread, previousThread) : 0
        // If the current thread is selected, keep it on the same line as it's mark
        sortedThread.top =
            selectedCommentMarkId === thread.markId
                ? sortedThread.top
                : sortedThread.top + offset
        previousThread = sortedThread
        return sortedThread
    })
}

const resortThreadsBeforeSelectedThread = (
    sortedThreads: SortedThread[],
    selectedThreadIndex: number
) =>
    sortedThreads.map(
        (thread: SortedThread, index: number, threadsArray: SortedThread[]) => {
            // If the thread is before the selected thread, and it's overlaps with the position of the selected thread, move it
            if (
                selectedThreadIndex > index &&
                threadsArray[selectedThreadIndex - 1].top +
                    threadsArray[selectedThreadIndex - 1].height >
                    threadsArray[selectedThreadIndex].top
            ) {
                const offset = generateReverseOffset(
                    index,
                    selectedThreadIndex,
                    threadsArray
                )
                return {
                    ...thread,
                    top:
                        thread.top - offset > thread.top
                            ? thread.top
                            : thread.top - offset
                }
            }
            return thread
        }
    )

const getSelectedThreadIndex = (
    threadsByMark: SortedThread[],
    selectedCommentMarkId: string | undefined
) => {
    let selectedThreadIndex = -1
    if (selectedCommentMarkId) {
        const threadIndex = findIndex(threadsByMark, {
            markId: selectedCommentMarkId
        })

        if (threadIndex > -1) {
            selectedThreadIndex = threadIndex
        }
    }
    return selectedThreadIndex
}

const getAppScrollPosition = () => {
    const appElement = document.getElementById('app')
    return appElement && appElement !== null ? appElement.scrollTop : 0
}

export const sortThreads = (props: Props) => {
    const { navigation } = props.elementCoordinates
    const { selectedCommentMarkId } = props.comments

    const appScrollPosition = getAppScrollPosition()

    // Add the positioning data of the thread's corresponding mark
    const threadsWithPosition = getThreadsWithPositionData(
        props.comments.threads,
        navigation,
        appScrollPosition
    )
    // Filter out threads where the mark is gone
    const filteredThreads = threadsWithPosition.filter(
        isThread
    ) as SortedThread[]

    // Sort threads by position of mark in the editor
    const threadsByMark = sortThreadsByMarkPosition(filteredThreads)

    // Position threads based on the height of the comment thread in the comments bar
    let sortedThreads = getSortedThreads(threadsByMark, selectedCommentMarkId)

    // Get the index of the selected thread
    const selectedThreadIndex = getSelectedThreadIndex(
        threadsByMark,
        selectedCommentMarkId
    )
    // If a comment thread is active, and has threads before it, reorganize the threads before the selected thread
    if (selectedCommentMarkId && selectedThreadIndex > 0) {
        sortedThreads = resortThreadsBeforeSelectedThread(
            sortedThreads,
            selectedThreadIndex
        )
    }

    // Get all large embeds in the document
    const largeEmbeds = document.querySelectorAll(
        `.${blockEmbedStyles.blockEmbed}[data-size='large']`
    )

    // If there are any large embeds check to see if any comments are located within their range.
    if (largeEmbeds.length) {
        sortedThreads = checkThreadsByLargeEmbeds(
            navigation,
            selectedCommentMarkId,
            largeEmbeds,
            sortedThreads,
            appScrollPosition
        )
    }

    return sortedThreads
}
