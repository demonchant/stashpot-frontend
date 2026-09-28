import type { ApiRequest } from './_types.js'

export const MAINNET_GENESIS_HASH = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'

const DEFAULT_MAINNET_RPC = 'https://api.mainnet-beta.solana.com'
const MAX_BATCH_SIZE = 12

const ALLOWED_METHODS = new Set([
  'getAccountInfo',
  'getBalance',
  'getBlockHeight',
  'getFeeForMessage',
  'getGenesisHash',
  'getHealth',
  'getLatestBlockhash',
  'getMinimumBalanceForRentExemption',
  'getMultipleAccounts',
  'getProgramAccounts',
  'getRecentPrioritizationFees',
  'getSignatureStatuses',
  'getSignaturesForAddress',
  'getSlot',
  'getTokenAccountBalance',
  'getTokenAccountsByOwner',
  'getTransaction',
  'getVersion',
  'isBlockhashValid',
  'sendTransaction',
  'simulateTransaction',
])

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: string | number | null
  method: string
  params?: unknown
}

export class RpcGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfter?: string | null,
  ) {
    super(message)
  }
}

function parseBody(req: ApiRequest): unknown {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body)
    } catch {
      throw new RpcGatewayError('Invalid JSON body', 400)
    }
  }
  return req.body
}

function isRpcRequest(value: unknown): value is JsonRpcRequest {
  if (!value || typeof value !== 'object') return false
  const request = value as Partial<JsonRpcRequest>
  return request.jsonrpc === '2.0'
    && (typeof request.id === 'string' || typeof request.id === 'number' || request.id === null)
    && typeof request.method === 'string'
    && ALLOWED_METHODS.has(request.method)
}

export function validateRpcBody(req: ApiRequest): JsonRpcRequest | JsonRpcRequest[] {
  const body = parseBody(req)
  const requests = Array.isArray(body) ? body : [body]
  if (requests.length === 0 || requests.length > MAX_BATCH_SIZE) {
    throw new RpcGatewayError(`JSON-RPC batches must contain 1-${MAX_BATCH_SIZE} requests`, 400)
  }
  if (!requests.every(isRpcRequest)) {
    throw new RpcGatewayError('Unsupported or malformed Solana JSON-RPC request', 400)
  }
  return Array.isArray(body) ? requests : requests[0]
}

export function configuredUpstreams(env: NodeJS.ProcessEnv = process.env): string[] {
  const configured = [env.SOLANA_RPC_URLS, env.SOLANA_RPC_URL]
    .filter(Boolean)
    .flatMap((value) => value!.split(/[\s,]+/))
    .map((value) => value.trim())
    .filter(Boolean)

  const candidates = configured.length ? configured : [DEFAULT_MAINNET_RPC]
  return [...new Set(candidates)].filter((candidate) => {
    try {
      const url = new URL(candidate)
      return url.protocol === 'https:'
    } catch {
      return false
    }
  })
}

function isRetryableResponse(status: number, payload: unknown): boolean {
  if (status === 403 || status === 408 || status === 429 || status >= 500) return true
  const errors = Array.isArray(payload) ? payload : [payload]
  return errors.some((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const code = (entry as { error?: { code?: number } }).error?.code
    return code === 403 || code === 429 || code === -32005
  })
}

export async function forwardRpc(
  body: JsonRpcRequest | JsonRpcRequest[],
  fetcher: typeof fetch = fetch,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ payload: unknown; upstreamIndex: number }> {
  const upstreams = configuredUpstreams(env)
  if (!upstreams.length) throw new RpcGatewayError('No valid HTTPS Solana RPC upstream is configured', 503)

  let lastError: unknown
  let retryAfter: string | null = null

  for (let index = 0; index < upstreams.length; index += 1) {
    try {
      const response = await fetcher(upstreams[index], {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'content-type': 'application/json',
          'user-agent': 'StashPot-RPC-Gateway/1.0',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(9_000),
      })
      retryAfter = response.headers.get('retry-after')
      const payload = await response.json().catch(() => null)

      if (!response.ok || isRetryableResponse(response.status, payload)) {
        lastError = new Error(`RPC upstream ${index + 1} returned HTTP ${response.status}`)
        continue
      }
      return { payload, upstreamIndex: index }
    } catch (error) {
      lastError = error
    }
  }

  throw new RpcGatewayError(
    lastError instanceof Error ? lastError.message : 'All Solana RPC upstreams failed',
    503,
    retryAfter,
  )
}
