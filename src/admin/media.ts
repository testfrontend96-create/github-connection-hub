import { supabase } from '../integrations/supabase/client'

const TEN_YEARS = 60 * 60 * 24 * 365 * 10

/** Converts large photos to WebP in the browser; keeps SVG/GIF and failures as-is. */
async function toWebp(file: File): Promise<File> {
  if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale)
    c.height = Math.round(bmp.height * scale)
    c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise<Blob | null>((r) => c.toBlob(r, 'image/webp', 0.86))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    return file
  }
}

/** Uploads an image to Hub media and returns a long-lived link the site can show. */
export async function uploadImage(original: File, folder: string): Promise<string> {
  const file = await toWebp(original)
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase()
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from('hub-media').upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })
  if (error) throw new Error(error.message)
  const { data, error: e2 } = await supabase.storage.from('hub-media').createSignedUrl(path, TEN_YEARS)
  if (e2 || !data) throw new Error(e2?.message || 'Could not create image link')
  return data.signedUrl
}
