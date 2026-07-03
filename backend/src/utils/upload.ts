import { promises as fs } from 'fs'
import path from 'path'

export async function saveFile(file: File, folder: string = 'ines'): Promise<string | null> {
    if (!file || file.size === 0) return null;

    try {
        // Extraer extensión del archivo original, fallback a .jpg
        const extension = path.extname(file.name) || '.jpg'
        
        // Crear un nombre de archivo único usando timestamp y un número aleatorio
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`
        
        // La ruta absoluta donde se guardará (en backend/uploads/ines)
        const uploadDir = path.join(process.cwd(), 'uploads', folder)
        
        // Asegurarse de que el directorio exista
        await fs.mkdir(uploadDir, { recursive: true })
        
        const filePath = path.join(uploadDir, uniqueName)
        
        // Convertir File de Bun/Web a Buffer y guardarlo
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        await fs.writeFile(filePath, buffer)
        
        // Retornar la ruta relativa para guardarla en la base de datos y servirla estáticamente
        return `/uploads/${folder}/${uniqueName}`
    } catch (error) {
        console.error('Error guardando archivo:', error)
        throw new Error('No se pudo guardar la imagen.')
    }
}
