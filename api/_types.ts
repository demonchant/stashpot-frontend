export interface ApiRequest {
  method?: string
  body?: unknown
}

export interface ApiResponse {
  setHeader(name: string, value: string | number): ApiResponse
  status(code: number): ApiResponse
  json(body: unknown): ApiResponse
  end(): ApiResponse
}
