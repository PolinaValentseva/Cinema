// ✅ Единственный правильный способ который работает и в DEV и в PRODUCTION сборке
// Vite автоматически соберёт все изображения, переименует с хешами и вернёт правильные пути
const imagesGlob = import.meta.glob('@/assets/images/**/*', { eager: true })

export const useImage = () => {
  const getImagePath = (path: string | undefined): string => {
    if (!path) return ''
    
    const fullPath = `/src/assets/images/${path}`
    const imageModule = imagesGlob[fullPath] as { default: string } | undefined
    
    return imageModule?.default || ''
  }

  return {
    getImagePath
  }
}