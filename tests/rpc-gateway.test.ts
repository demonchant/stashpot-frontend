import { describe, expect, it, vi } from 'vitest'
import type { ApiRequest } from '../api/_types'
import {
  configuredUpstreams,
  forwardRpc,
  RpcGatewayError,
  validateRpcBody,
} from '../api/_rpc'

const getBalance = {
  jsonrpc: '2.0' as const,
  id: 1,
  method: 'getBalance',
  params: ['11111111111111111111111111111111'],
}

describe('Solana RPC gateway', () => {
  it('uses only configured HTTPS upstreams and preserves order', () => {
    expect(configuredUpstreams({
      SOLANA_RPC_URLS: 'https://one.example, http://unsafe.example https://two.example',
    } as NodeJS.ProcessEnv)).toEqual(['https://one.example', 'https://two.example'])
  })

  it('rejects unknown RPC methods', () => {
    const req = { body: { ...getBalance, method: 'validatorExit' } } as ApiRequest
    expect(() => validateRpcBody(req)).toThrow(RpcGatewayError)
  })

  it('rejects oversized batches', () => {
    const req = { body: Array.from({ length: 13 }, (_, id) => ({ ...getBalance, id })) } as ApiRequest
    expect(() => validateRpcBody(req)).toThrow(/batches/)
  })

  it('fails over on rate limits and does not forward a browser Origin header', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 429 } }), { status: 429 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { value: 42 } }), { status: 200 }))

    const result = await forwardRpc(
      getBalance,
      fetcher,
      { SOLANA_RPC_URLS: 'https://one.example,https://two.example' } as NodeJS.ProcessEnv,
    )

    expect(result.upstreamIndex).toBe(1)
    expect(result.payload).toMatchObject({ result: { value: 42 } })
    expect(fetcher).toHaveBeenCalledTimes(2)
    const headers = fetcher.mock.calls[0][1]?.headers as Record<string, string>
    expect(headers.origin).toBeUndefined()
  })

  it('returns a controlled 503 after all upstreams fail', async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error('network down'))
    await expect(forwardRpc(
      getBalance,
      fetcher,
      { SOLANA_RPC_URL: 'https://one.example' } as NodeJS.ProcessEnv,
    )).rejects.toMatchObject({ status: 503 })
  })
})
