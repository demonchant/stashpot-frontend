import { forwardRpc, RpcGatewayError, validateRpcBody } from './_rpc.js'
import type { ApiRequest, ApiResponse } from './_types.js'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(204).end()
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = validateRpcBody(req)
    const { payload, upstreamIndex } = await forwardRpc(body)
    res.setHeader('X-StashPot-RPC-Upstream', String(upstreamIndex + 1))
    return res.status(200).json(payload)
  } catch (error) {
    const status = error instanceof RpcGatewayError ? error.status : 500
    if (error instanceof RpcGatewayError && error.retryAfter) {
      res.setHeader('Retry-After', error.retryAfter)
    }
    return res.status(status).json({
      jsonrpc: '2.0',
      id: null,
      error: {
        code: status === 400 ? -32600 : -32005,
        message: status === 400 ? (error as Error).message : 'Solana RPC is temporarily unavailable',
      },
    })
  }
}
