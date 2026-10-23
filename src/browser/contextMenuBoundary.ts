/** Keep right-click inside the editor's own contextual actions. */
export function installContextMenuBoundary(doc: Document = document): () => void {
  const preventNativeMenu = (event: MouseEvent) => event.preventDefault()
  doc.addEventListener('contextmenu', preventNativeMenu, { capture: true })
  return () => doc.removeEventListener('contextmenu', preventNativeMenu, { capture: true })
}
