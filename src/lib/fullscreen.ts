type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null
  webkitExitFullscreen?: () => Promise<void> | void
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

export function isFullscreen() {
  const doc = document as FullscreenDocument
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement)
}

export function requestFullscreen(element: HTMLElement) {
  const node = element as FullscreenElement
  if (node.requestFullscreen) return node.requestFullscreen()
  return node.webkitRequestFullscreen?.()
}

export function exitFullscreen() {
  const doc = document as FullscreenDocument
  if (document.exitFullscreen) return document.exitFullscreen()
  return doc.webkitExitFullscreen?.()
}
