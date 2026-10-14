// Stamps a preview before it is uploaded, so the stored file already says where it came from.
// The clean original never leaves the graduate's device. Redrawing images also drops their hidden
// details (location, camera). PDFs are stamped on every page; pdf-lib loads only when a PDF is picked.

const MAX_SIDE = 2000
const MAX_BYTES = 5 * 1024 * 1024

export class StampError extends Error {}

export async function stampPreview(file: File, text: string): Promise<File> {
  if (file.type === 'application/pdf') return stampPdf(file, text)
  return stampImage(file, text)
}

async function stampImage(file: File, text: string): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new StampError("We couldn't read that image. Try a PNG or JPG screenshot.")
  })
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  // Diagonal rows of faint text across the whole image, hard to crop out.
  const size = Math.max(14, Math.round(Math.min(w, h) / 28))
  ctx.save()
  ctx.font = `600 ${size}px system-ui, sans-serif`
  ctx.fillStyle = 'rgba(20, 20, 20, 0.14)'
  ctx.translate(w / 2, h / 2)
  ctx.rotate(-Math.PI / 7)
  const step = ctx.measureText(text).width + size * 3
  const diag = Math.hypot(w, h)
  for (let y = -diag / 2; y < diag / 2; y += size * 4) {
    const offset = (Math.round(y / (size * 4)) % 2) * (step / 2)
    for (let x = -diag / 2 - offset; x < diag / 2; x += step) ctx.fillText(text, x, y)
  }
  ctx.restore()

  const blob = await toBlob(canvas, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.88)
  const out = blob.size > MAX_BYTES ? await toBlob(canvas, 'image/jpeg', 0.8) : blob
  if (out.size > MAX_BYTES) throw new StampError('The preview is too large. Use a smaller screenshot.')
  const ext = out.type === 'image/png' ? 'png' : 'jpg'
  return new File([out], `preview.${ext}`, { type: out.type })
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new StampError("We couldn't prepare the preview. Try another file."))), type, quality),
  )
}

async function stampPdf(file: File, text: string): Promise<File> {
  const { PDFDocument, StandardFonts, rgb, degrees } = await import('pdf-lib')
  let doc
  try {
    doc = await PDFDocument.load(await file.arrayBuffer())
  } catch {
    throw new StampError("We couldn't open that PDF. If it has a password, export it again without one, or upload a screenshot.")
  }
  const font = await doc.embedFont(StandardFonts.HelveticaBold)
  const safe = text.replace(/[^\x20-\x7E]/g, '') // the built-in font only has basic characters
  for (const page of doc.getPages()) {
    const { width, height } = page.getSize()
    const size = Math.max(12, Math.min(width, height) / 30)
    const step = font.widthOfTextAtSize(safe, size) + size * 3
    for (let y = -height; y < height * 2; y += size * 5) {
      for (let x = -width; x < width * 2; x += step) {
        page.drawText(safe, { x, y, size, font, color: rgb(0.08, 0.08, 0.08), opacity: 0.12, rotate: degrees(26) })
      }
    }
  }
  const bytes = await doc.save()
  if (bytes.byteLength > MAX_BYTES) throw new StampError('The PDF is too large after stamping. Export a smaller one, or upload a screenshot.')
  return new File([bytes as BlobPart], 'preview.pdf', { type: 'application/pdf' })
}
