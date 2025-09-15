export function dataURLtoFile(dataUrl: string, filename = 'capture.jpg'): File {
  const [meta, b64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg'
  const bin = atob(b64)
  const len = bin.length
  const u8 = new Uint8Array(len)
  for (let i = 0; i < len; i++) u8[i] = bin.charCodeAt(i)
  return new File([u8], filename, { type: mime })
}
