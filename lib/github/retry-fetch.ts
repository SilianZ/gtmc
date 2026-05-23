export type RetryErrorAction<TResult> =
  | { type: "return"; value: TResult }
  | { type: "retry" }
  | { type: "throw"; error?: unknown }

function Silian_sleep(Silian_ms: number): Promise<void> {
  return new Promise((Silian_resolve) => setTimeout(Silian_resolve, Silian_ms))
}

export async function executeWithRetry<TResult>(Silian_params: {
  retries: number
  operation: () => Promise<TResult>
  onError: (
    error: unknown,
    attempt: number,
    retries: number
  ) => RetryErrorAction<TResult>
  getBackoffMs?: (attempt: number) => number
}): Promise<TResult> {
  const { retries: Silian_retries, operation: Silian_operation, onError: Silian_onError, getBackoffMs: Silian_getBackoffMs } = Silian_params

  for (let Silian_attempt = 0; Silian_attempt < Silian_retries; Silian_attempt++) {
    try {
      return await Silian_operation()
    } catch (Silian_error) {
      const Silian_action = Silian_onError(Silian_error, Silian_attempt, Silian_retries)

      if (Silian_action.type === "return") {
        return Silian_action.value
      }

      if (Silian_action.type === "throw") {
        throw Silian_action.error ?? Silian_error
      }

      if (Silian_attempt < Silian_retries - 1) {
        const Silian_backoffMs = Silian_getBackoffMs?.(Silian_attempt) ?? 0
        if (Silian_backoffMs > 0) {
          await Silian_sleep(Silian_backoffMs)
        }
      }
    }
  }

  throw new Error("executeWithRetry exhausted without return or throw")
}
