import { mount } from 'enzyme'
import React from 'react'
import AnalyticsBuilder from '../../analytics/AnalyticsBuilders/AnalyticsBuilder'
import PlusMenuContainer from '../../components/pages/Editor/PlusMenu/PlusMenuContainer'
import FileBlotCreator from '../../components/quill/modules/FileBlotCreator'
import QuillSources from '../../components/quill/modules/QuillSources'
import { RootState } from '../../data/reducers'
import { BlockEmbedService } from '../../interfaces/blockEmbed'
import { SelectionType } from '../../interfaces/selectionType'
import { mockQuill } from '../mockData/mockQuill'
jest.mock('../../data/store', () => {
    return {
        getState(): Partial<RootState> {
            return {
                user: {
                    userId: 1,
                    teamId: '2',
                    email: 'foo@bar.com'
                } as RootState['user'],
                currentDocument: {
                    id: '1'
                } as RootState['currentDocument'],
                plusMenu: {
                    showPlusMenu: true,
                    insertTop: 0
                },
                mouseover: {
                    index: 20,
                    blotType: SelectionType.Embed,
                    blotName: '',
                    blotData: undefined,
                    top: 0,
                    height: 10
                },
                featureFlags: {
                    panes: true,
                    nightly: true,
                    darkMode: false,
                    documentHistory: false
                }
            }
        }
    }
})

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

jest.mock('../../components/quill/entries/Editor', () => {
    return {
        createQuillInstance: () => {
            return function() {
                return {
                    setContents: jest.fn(),
                    getContents: jest.fn(),
                    on: jest.fn()
                }
            }
        }
    }
})

const defaultProps: React.ComponentProps<typeof PlusMenuContainer> = {
    index: 1,
    quill: mockQuill,
    showPlusMenu: true,
    quillScrollTop: 0,
    onClosePlusMenu: jest.fn()
}

const newProps = {
    quill: mockQuill,
    index: 10,
    onClosePlusMenu: jest.fn(),
    showPlusMenu: true,
    quillScrollTop: 0
}
const prevState = {
    isModalShown: false,
    embedType: null,
    lineOffset: 0,
    currentLineIndex: 0,
    showPlaceHolder: false,
    isInsertingOnBlankLine: false
}
const prevProps = {
    ...defaultProps,
    showPlusMenu: false
}

jest.mock('uuid', () => {
    return {
        v4: () => {
            return 12345
        }
    }
})
jest.mock('cuid', () => {
    return () => {
        return 12345
    }
})
jest.mock('@invisionapp/helios/icons/File', () => {
    return () => <div className="helios-file-icon" />
})
jest.mock('@invisionapp/helios/icons/Image', () => {
    return () => <div className="helios-image-icon" />
})
jest.mock('@invisionapp/helios/icons/Prototype', () => {
    return () => <div className="helios-proto-icon" />
})
jest.mock('@invisionapp/helios/icons/Freehand', () => {
    return () => <div className="helios-freehand-icon" />
})

let isBlockEmbed = false
jest.mock('../../../src/components/quill/utils/getEmbedFromIndex', () => ({
    __esModule: true,
    default: () => {
        return isBlockEmbed
    }
}))

AnalyticsBuilder.prototype.track = jest.fn()

FileBlotCreator.createBlotFromFiles = jest.fn()

const newComponent = (props?: any) =>
    mount(<PlusMenuContainer {...defaultProps} {...props} />)

describe('<PlusMenuContainer />', () => {
    it('renders', () => {
        jest.useFakeTimers()
        const component = mount(<PlusMenuContainer {...defaultProps} />)
        expect(component.children('PlusMenu')).toExist()
    })

    describe('adding embeds', () => {
        it.each`
            menuItem       | service        | url
            ${'prototype'} | ${'invision'}  | ${'https://slate.invisionbeta.com/console/test-cjpd2fwug0228018ydtgggnxm/cjpd2g1ug022a018ygocwf6ea/play'}
            ${'prototype'} | ${'prototype'} | ${'https://slate.invisionbeta.com/prototype/cjp4997ih0006kp01q4qk67nj'}
        `(
            'inserts $service links as embeds',
            ({
                menuItem,
                service,
                url
            }: {
                menuItem: string
                service: BlockEmbedService
                url: string
            }) => {
                jest.useFakeTimers()
                const component = newComponent()
                component.find(testid(menuItem)).simulate('click')
                jest.advanceTimersByTime(200)
                component.find('Input').simulate('change', {
                    target: {
                        value: url
                    }
                })
                const button = component.find(
                    'Button' + testid('create-embed-modal__add-button')
                )
                expect(button.prop('disabled')).toBe(false)
                component.find('form').simulate('submit')
                expect(mockQuill.insertEmbed).toHaveBeenCalledWith(
                    defaultProps.index,
                    'block-embed',
                    expect.objectContaining({
                        originalLink: url,
                        service
                    }),
                    QuillSources.USER
                )
                expect(AnalyticsBuilder.prototype.track).toHaveBeenCalled()
            }
        )

        it('inserts freehand links as embeds', () => {
            const service = 'freehand'
            const url =
                'https://slate.invisionbeta.com/freehand/super-secret-freehand-sOsygkHMW'
            jest.useFakeTimers()
            const component = newComponent()
            // @ts-ignore
            component.instance().handleAddEmbed(url)
            expect(mockQuill.insertEmbed).toHaveBeenCalledWith(
                defaultProps.index,
                'block-embed',
                expect.objectContaining({
                    originalLink: url,
                    service
                }),
                QuillSources.USER
            )
            expect(AnalyticsBuilder.prototype.track).toHaveBeenCalled()
        })

        it.each`
            menuItem       | service        | url
            ${'prototype'} | ${'invision'}  | ${'https://youtube.com/watch?v=12345abcde'}
            ${'prototype'} | ${'prototype'} | ${'https://slate.invisionbeta.com/freehand/super-secret-freehand-sOsygkHMW'}
        `(
            'does not enable the "Add" button for $menuItem when url does not match for $service',
            ({ menuItem, url }: { menuItem: string; url: string }) => {
                jest.useFakeTimers()
                const component = newComponent()
                component.find(testid(menuItem)).simulate('click')
                jest.advanceTimersByTime(200)
                component.find('Input').simulate('change', {
                    target: {
                        value: url
                    }
                })
                const button = component.find(
                    'Button' + testid('create-embed-modal__add-button')
                )
                expect(button.prop('disabled')).toBe(true)
            }
        )
        it('adds a newline at the end when inserting on the very last line', () => {
            jest.spyOn(mockQuill, 'getLength').mockImplementation(() => 2)
            const service = 'freehand'
            const url =
                'https://slate.invisionbeta.com/freehand/super-secret-freehand-sOsygkHMW'
            jest.useFakeTimers()
            const component = newComponent()
            // @ts-ignore
            component.instance().handleAddEmbed(url)
            expect(mockQuill.insertEmbed).toHaveBeenCalledWith(
                defaultProps.index,
                'block-embed',
                expect.objectContaining({
                    originalLink: url,
                    service
                }),
                QuillSources.USER
            )
            expect(mockQuill.insertText).toHaveBeenCalledWith(
                defaultProps.index! + 1,
                '\n',
                { id: expect.anything() },
                QuillSources.USER
            )
        })
    })

    describe('adding the correct line', () => {
        beforeEach(() => {
            jest.resetAllMocks()

            isBlockEmbed = false

            mockQuill.getLine = jest.fn(() => {
                return [{}, 12]
            })

            mockQuill.getText = () => {
                return ''
            }
        })
        it('should insert at the correct index for blockembeds', () => {
            isBlockEmbed = true
            const component = new PlusMenuContainer(newProps)
            component.setState = jest.fn()
            component.componentDidUpdate(prevProps, prevState)
            expect(mockQuill.insertText).toHaveBeenCalledWith(
                21,
                '\n',
                { id: 12345 },
                QuillSources.USER
            )
            expect(component.setState).toHaveBeenCalledWith({
                lineOffset: 10,
                currentLineIndex: 20,
                showPlaceHolder: true,
                isInsertingOnBlankLine: false
            })
            expect(mockQuill.enable).toHaveBeenCalledWith(false)
        })
        it('should insert at the correct index for empty lines', () => {
            mockQuill.getLine = jest.fn(() => {
                return [{}, 0]
            })
            const component = new PlusMenuContainer(newProps)
            component.setState = jest.fn()
            component.componentDidUpdate(prevProps, prevState)
            expect(mockQuill.insertText).not.toHaveBeenCalled()
            expect(component.setState).toHaveBeenCalledWith({
                lineOffset: 10,
                currentLineIndex: 20,
                showPlaceHolder: true,
                isInsertingOnBlankLine: true
            })
            expect(mockQuill.enable).toHaveBeenCalledWith(false)
        })
        it('should insert at the correct index for non-empty lines', () => {
            const component = new PlusMenuContainer(newProps)
            component.setState = jest.fn()
            component.componentDidUpdate(prevProps, prevState)
            expect(mockQuill.insertText).toHaveBeenCalledWith(
                20,
                '\n',
                { id: 12345 },
                QuillSources.USER
            )
            expect(component.setState).toHaveBeenCalledWith({
                lineOffset: 32,
                currentLineIndex: 20,
                showPlaceHolder: true,
                isInsertingOnBlankLine: false
            })
            expect(mockQuill.enable).toHaveBeenCalledWith(false)
        })
        it('aborting the placeholder on empty lines should not remove those lines', () => {
            const component = new PlusMenuContainer(newProps)
            component.state.isInsertingOnBlankLine = true
            component.setState = jest.fn()
            component.abortPlusMenu()
            expect(newProps.onClosePlusMenu).toHaveBeenCalled()
            expect(mockQuill.enable).toHaveBeenCalledWith(true)
            expect(component.setState).toHaveBeenCalledWith({
                lineOffset: 0,
                showPlaceHolder: false
            })
        })
        it('aborting the placeholder on non-empty lines should remove that line', () => {
            const component = new PlusMenuContainer(newProps)
            component.removePlaceholderLine = jest.fn()
            component.abortPlusMenu()
            expect(newProps.onClosePlusMenu).toHaveBeenCalled()
            expect(mockQuill.enable).toHaveBeenCalledWith(true)
            expect(component.removePlaceholderLine).toHaveBeenCalled()
        })
        it('should remove the placeholder line if it is empty', () => {
            mockQuill.getText = jest.fn(() => {
                return '\n'
            })
            const component = new PlusMenuContainer(newProps)
            component.setState = jest.fn()
            component.removePlaceholderLine()
            expect(mockQuill.deleteText).toHaveBeenCalled()
            expect(component.setState).toHaveBeenCalledWith({
                lineOffset: 0,
                showPlaceHolder: false
            })
        })
        it('should not remove a placeholder line if it has copy', () => {
            mockQuill.getText = jest.fn(() => {
                return 'Theres some copy here yo'
            })
            const component = new PlusMenuContainer(newProps)
            component.setState = jest.fn()
            component.removePlaceholderLine()
            expect(mockQuill.deleteText).not.toHaveBeenCalled()
            expect(component.setState).toHaveBeenCalledWith({
                lineOffset: 0,
                showPlaceHolder: false
            })
        })
        it('should not animate the container after aborting the plus menu', () => {
            const component = new PlusMenuContainer(newProps)
            component.animateContainer = jest.fn()
            component.abortPlusMenu()
            expect(component.animateContainer).not.toHaveBeenCalled()
        })
        it('should animate when a file is added', () => {
            const component = new PlusMenuContainer(newProps)
            component.animateContainer = jest.fn()
            component.onUploadFiles([])
            expect(component.animateContainer).toHaveBeenCalled()
        })
        it('should animate when an embed is added', () => {
            const component = new PlusMenuContainer(newProps)
            component.animateContainer = jest.fn()
            component.handleAddEmbed('https://www.deathstar.com')
            expect(component.animateContainer).toHaveBeenCalled()
        })
    })
})
