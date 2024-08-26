import { renderHook } from '@testing-library/react-hooks'
import useFuse from '../useFuse'
import { FuseOptions } from 'fuse.js'

const list = [{ name: 'foo' }, { name: 'bar' }, { name: 'quux' }]
const fuseOptions: FuseOptions = {
    distance: 40,
    keys: ['name']
}

describe('useFuse', () => {
    it.each`
        searchTerm | expected
        ${'b'}     | ${list[1].name}
        ${'ba'}    | ${list[1].name}
        ${'bar'}   | ${list[1].name}
        ${'q'}     | ${list[2].name}
        ${'qu'}    | ${list[2].name}
        ${'quu'}   | ${list[2].name}
        ${'quux'}  | ${list[2].name}
    `('returns $expected for $searchTerm', ({ searchTerm, expected }) => {
        const { result } = renderHook(() =>
            useFuse(list, searchTerm, fuseOptions)
        )
        expect(result.current[0].name).toBe(expected)
    })
})
