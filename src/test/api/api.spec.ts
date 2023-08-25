import { afterEach, afterAll, beforeAll, describe, test, expect } from 'vitest'
import { getDepGraph, getNodeDetail } from '../../api/index'
import { server } from '../mock/server'

describe('api test', () => {
    beforeAll(()=>{
        server.listen()
    })
    afterEach(() => server.resetHandlers());
    afterAll(()=>{
        server.close()
    })
    test('should getDepGraph correctly',async () => {
        const res = await getDepGraph("default", 10) as any
        expect(res.entryPackageName).toBe('packagedepgraph')
        
    })
    test('should getNodeDetail correctly', async () => {
        const res = await getNodeDetail("express&4.18.2") as any
        expect(res.entryPackageName).toBe('express')
    })
})
