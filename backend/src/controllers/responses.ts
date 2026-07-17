import { Elysia, t } from 'elysia'
import prisma from '../db'
import { authMiddleware } from '../middleware/auth'
import { generateSurveyExcel } from '../services/excelService'
import path from 'path'
import fs from 'fs'

// Ensure upload directories exist
const UPLOADS_ROOT = 'uploads/responses'
const ABSOLUTE_UPLOADS_ROOT = path.join(import.meta.dir, '../../uploads/responses')
fs.mkdirSync(ABSOLUTE_UPLOADS_ROOT, { recursive: true })

async function saveUploadedFileBuffer(
    buffer: Buffer,
    subDir: string,
    prefix: string,
    ext: string
): Promise<string> {
    const dir = path.join(ABSOLUTE_UPLOADS_ROOT, subDir)
    fs.mkdirSync(dir, { recursive: true })
    const filename = `${prefix}_${Date.now()}.${ext}`
    const filePath = path.join(dir, filename)
    fs.writeFileSync(filePath, buffer)
    return `${UPLOADS_ROOT}/${subDir}/${filename}`
}

export const responsesController = new Elysia({ prefix: '/responses' })
    .use(authMiddleware)
    // -------------------------------------------------------------------------
    // POST /api/responses/submit
    // Recibe multipart/form-data desde la app móvil con:
    //   - surveyId, surveyorId, age, gender, schooling, lat, lng, isCancelled
    //   - answers: JSON string Array<{ questionId, optionId?, subOptionId?, openText? }>
    //   - image?: archivo .jpg (evidencia fotográfica)
    //   - audio?: archivo .m4a (grabación de auditoría)
    // Todo se ejecuta dentro de una transacción atómica. Si algo falla, rollback.
    // -------------------------------------------------------------------------
    .post('/submit', async ({ body, set, authUser }: any) => {
        const {
            surveyId,
            surveyorId,
            age,
            gender,
            schooling,
            latitude,
            longitude,
            isCancelled,
            answers: answersJson,
            imageData,
            audioData,
        } = body

        // Parse answers JSON string sent from the mobile app
        let answers: Array<{
            questionId: number
            optionId?: number | null
            subOptionId?: number | null
            openText?: string | null
        }> = []
        try {
            answers = JSON.parse(answersJson || '[]')
        } catch {
            set.status = 400
            return { error: 'El campo "answers" debe ser un JSON válido.' }
        }

        if (!surveyId || !surveyorId) {
            set.status = 400
            return { error: 'surveyId y surveyorId son requeridos.' }
        }

        // Save files to disk BEFORE transaction so we have paths ready.
        // If the transaction fails we clean them up.
        const subDir = String(surveyorId)
        let imageSavedPath: string | null = null
        let audioSavedPath: string | null = null

        try {
            if (imageData) {
                const buffer = Buffer.from(imageData as string, 'base64')
                imageSavedPath = await saveUploadedFileBuffer(buffer, subDir, 'photo', 'jpg')
            }
            if (audioData) {
                const buffer = Buffer.from(audioData as string, 'base64')
                audioSavedPath = await saveUploadedFileBuffer(buffer, subDir, 'audio', 'm4a')
            }
        } catch (fileError: any) {
            set.status = 500
            return { error: 'Error al guardar los archivos multimedia: ' + fileError.message }
        }

        try {
            // Atomic transaction: respondent + all answers created together or not at all
            const result = await prisma.$transaction(async (tx) => {
                const respondent = await tx.respondent.create({
                    data: {
                        surveyId: Number(surveyId),
                        surveyorId: Number(surveyorId),
                        age: age ? Number(age) : null,
                        gender: gender || null,
                        schooling: schooling || null,
                        latitude: latitude ? Number(latitude) : null,
                        longitude: longitude ? Number(longitude) : null,
                        imagePath: imageSavedPath,
                        audioPath: audioSavedPath,
                        isCancelled: isCancelled === 'true' || isCancelled === true,
                    }
                })

                if (answers.length > 0) {
                    await tx.answer.createMany({
                        data: answers.map((a) => ({
                            respondentId: respondent.id,
                            questionId: Number(a.questionId),
                            optionId: a.optionId ? Number(a.optionId) : null,
                            subOptionId: a.subOptionId ? Number(a.subOptionId) : null,
                            openText: a.openText || null,
                        }))
                    })
                }

                return respondent
            })

            return {
                message: 'Encuesta registrada correctamente.',
                respondentId: result.id
            }

        } catch (txError: any) {
            // Transaction failed — clean up already-saved files to avoid orphans
            if (imageSavedPath && fs.existsSync(imageSavedPath)) fs.unlinkSync(imageSavedPath)
            if (audioSavedPath && fs.existsSync(audioSavedPath)) fs.unlinkSync(audioSavedPath)

            console.error('[responses/submit] Transaction error:', txError)
            set.status = 500
            return { error: 'Error al guardar la encuesta: ' + txError.message }
        }
    }, {
        body: t.Object({
            surveyId: t.String(),
            surveyorId: t.String(),
            age: t.Optional(t.String()),
            gender: t.Optional(t.String()),
            schooling: t.Optional(t.String()),
            latitude: t.Optional(t.String()),
            longitude: t.Optional(t.String()),
            isCancelled: t.Optional(t.String()),
            answers: t.String(),        // JSON string
            imageData: t.Optional(t.String()),  // base64 .jpg
            audioData: t.Optional(t.String()),  // base64 .m4a
        })
    })
    .get('/', async ({ query, set }) => {
        const surveyId = parseInt(query.surveyId as string)
        if (!surveyId || isNaN(surveyId)) {
            set.status = 400
            return { error: 'Se requiere el ID de la encuesta' }
        }

        const page = parseInt(query.page as string) || 1
        const limit = parseInt(query.limit as string) || 20
        const skip = (page - 1) * limit

        // Build Where Clause
        const whereClause: any = { surveyId }

        if (query.surveyorId) {
            whereClause.surveyorId = parseInt(query.surveyorId as string)
        }
        if (query.age) {
            whereClause.age = parseInt(query.age as string)
        }
        if (query.gender) {
            whereClause.gender = query.gender
        }
        if (query.schooling) {
            whereClause.schooling = { contains: query.schooling as string, mode: 'insensitive' }
        }

        try {
            // Get paginated respondents
            const [respondents, total] = await Promise.all([
                prisma.respondent.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    include: {
                        surveyor: { select: { name: true, username: true } }
                    },
                    orderBy: { id: 'desc' }
                }),
                prisma.respondent.count({ where: whereClause })
            ])

            // Get ALL coordinates for the map (ignoring pagination, but applying the same filters)
            const mapPins = await prisma.respondent.findMany({
                where: {
                    ...whereClause,
                    latitude: { not: null },
                    longitude: { not: null }
                },
                select: {
                    id: true,
                    latitude: true,
                    longitude: true,
                    surveyor: { select: { name: true } }
                }
            })

            return {
                data: respondents,
                mapData: mapPins,
                meta: {
                    total,
                    page,
                    lastPage: Math.ceil(total / limit) || 1
                }
            }
        } catch (error) {
            console.error('Error fetching responses:', error)
            set.status = 500
            return { error: 'Error interno del servidor al cargar las respuestas' }
        }
    })
    .get('/export/:surveyId', async ({ params, set }) => {
        const surveyId = parseInt(params.surveyId)
        if (isNaN(surveyId)) {
            set.status = 400
            return { error: 'ID de encuesta inválido' }
        }

        try {
            const buffer = await generateSurveyExcel(surveyId)

            // Generate filename based on survey title
            const survey = await prisma.survey.findUnique({ where: { id: surveyId }, select: { title: true } })
            const title = survey?.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'encuesta'

            // The response headers must correctly define it as an attachment
            set.headers['Content-Type'] = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            set.headers['Content-Disposition'] = `attachment; filename="resultados_${title}.xlsx"`

            // In Elysia, returning a buffer or blob directly will send it with the given headers
            return buffer
        } catch (error: any) {
            console.error('Error generating Excel:', error)
            set.status = 500
            return { error: error.message || 'Error al generar el Excel' }
        }
    })
    .get('/:id', async ({ params, set }) => {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            set.status = 400
            return { error: 'ID inválido' }
        }

        try {
            const respondent = await prisma.respondent.findUnique({
                where: { id },
                include: {
                    surveyor: { select: { name: true, username: true } },
                    survey: {
                        include: {
                            questions: {
                                include: {
                                    options: true,
                                    subOptions: true
                                },
                                orderBy: { id: 'asc' }
                            }
                        }
                    },
                    answers: {
                        include: {
                            question: true,
                            option: true,
                            subOption: true
                        }
                    }
                }
            })

            if (!respondent) {
                set.status = 404
                return { error: 'Respuesta no encontrada' }
            }

            return respondent
        } catch (error) {
            console.error('Error fetching respondent details:', error)
            set.status = 500
            return { error: 'Error al cargar los detalles de la respuesta' }
        }
    })
