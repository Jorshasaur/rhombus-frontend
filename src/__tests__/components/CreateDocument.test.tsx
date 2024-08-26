import Axios from 'axios'
import * as sinon from 'sinon'
import React from 'react'
import Enzyme, { shallow } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'
import { CreateDocument } from '../../components/pages/CreateDocument/CreateDocument'

Enzyme.configure({ adapter: new Adapter() })

describe('Create Document', () => {
    const sandbox = sinon.createSandbox()

    afterEach(() => {
        sandbox.restore()
    })
    it('should create a document when loaded', async () => {
        const createNewDocumentSpy = jest.spyOn(
            CreateDocument.prototype,
            'createNewDocument'
        )
        const apiCall = sandbox
            .stub(Axios, 'post')
            .resolves({ data: { document: { id: 1 } } })

        shallow(<CreateDocument />)

        expect(createNewDocumentSpy).toHaveBeenCalled()
        expect(apiCall.called).toBe(true)
        createNewDocumentSpy.mockRestore()
    })
})
