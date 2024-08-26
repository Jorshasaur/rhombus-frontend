import LineDragPreviewLayer from '../../components/pages/Editor/LineDrag/LineDragPreviewLayer'
import { DRAG_ITEM_TYPE } from '../../components/pages/Editor/LineDrag/DragItem'
import blotStyles from '../Blots/Blots.module.css'
import quillProvider from '../../components/quill/provider'
import theQuill from 'quill/core'
const Parchment = theQuill.import('parchment')
const Quill: any = jest.genMockFromModule('quill/core')
quillProvider.setQuill(Quill)

function createEmbed(text: string) {
    const embedNode = document.createElement(text)
    embedNode.setAttribute('data-props', '{}')
    const node: HTMLDivElement = new Parchment.Embed(embedNode).domNode
    node.innerHTML = `
        <div data-persistent-bar="true">
            <div>Prototype</div>
            <div class="${blotStyles.actionArea}"></div>
        </div>
    `
    return node
}

const firstDraggingNode = createEmbed('test')

Parchment.find = () => ({
    value() {
        return {
            'block-embed': {
                service: 'invision'
            }
        }
    }
})

const defaultProps = {
    item: {
        draggingNodes: [],
        firstDraggingNode,
        type: DRAG_ITEM_TYPE.EMBED
    }
}

describe('<LineDragPreviewLayer />', () => {
    beforeEach(() => {
        Quill.root = document.createElement('div')
        Quill.scrollingContainer = document.createElement('div')
        const originalListener = Quill.root.addEventListener.bind(Quill.root)
        Quill.root.addEventListener = jest.fn((eventName, cb) => {
            originalListener(eventName, cb)
        })

        const modules = {}

        Quill.setModule = (name: string, module: any) => {
            modules[name] = module
        }

        Quill.getModule = (name: string) => {
            return modules[name]
        }
    })

    describe('dragging non-image embeds', () => {
        it('uses the persistent-bar without the action area as the drag preview', () => {
            // @ts-ignore
            const component = new LineDragPreviewLayer(defaultProps)
            expect(component._clonedNode.dataset.persistentBar).toBeTruthy()
            expect(
                component._clonedNode.querySelector('.actionArea').style
                    .visibility
            ).toBe('hidden')

            expect(
                component._clonedNode.querySelector(`.${blotStyles.actionArea}`)
                    .style.visibility
            ).toBe('hidden')
        })
    })
})
