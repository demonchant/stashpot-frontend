export {}

declare global {
  interface Window {
    Jupiter?: {
      init: (props: Record<string, unknown>) => void
      close: () => void
      syncProps: (props: Record<string, unknown>) => void
    }
  }
}
