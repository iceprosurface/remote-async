import { uuidv4 } from '../src/utils'

describe('remoteAsync:uuidv4', () => {
    test('uuidv4 length should be 36', () => {
        expect(
            uuidv4().length,
        ).toBe(36)
    })
})
