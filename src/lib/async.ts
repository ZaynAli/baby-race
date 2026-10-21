export function withTimeout<T>(promise: PromiseLike<T>, ms = 12000) {
  return new Promise<T>((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error('Network timeout')), ms)
    promise.then(
      (value) => {
        window.clearTimeout(id)
        resolve(value)
      },
      (error: unknown) => {
        window.clearTimeout(id)
        reject(error)
      },
    )
  })
}
