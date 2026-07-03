import { Elysia, t } from 'elysia'
import prisma from '../db'
import { authMiddleware } from '../middleware/auth'
import { saveFile } from '../utils/upload'

export const formsController = new Elysia({ prefix: '/forms' })
    .use(authMiddleware)
    // GET /api/forms
    .get('/', async ({ query }) => {
        const page = parseInt(query.page as string) || 1
        const limit = parseInt(query.limit as string) || 10
        const search = (query.search as string) || ''
        const status = query.status ? parseInt(query.status as string) : undefined
        const date = query.date as string | undefined

        const skip = (page - 1) * limit

        const whereClause: any = {}
        if (search) {
            whereClause.title = { contains: search, mode: 'insensitive' }
        }
        if (status !== undefined && !isNaN(status)) {
            whereClause.status = status
        }
        if (date) {
            const startDate = new Date(date)
            const endDate = new Date(startDate)
            endDate.setDate(endDate.getDate() + 1)
            whereClause.createdAt = { gte: startDate, lt: endDate }
        }

        const [forms, total] = await Promise.all([
            prisma.survey.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: {
                        select: { questions: true, respondents: true, assignments: true }
                    }
                }
            }),
            prisma.survey.count({ where: whereClause })
        ])

        return {
            data: forms,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit) || 1
            }
        }
    })
    // GET /api/forms/:id
    .get('/:id', async ({ params, set }) => {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            set.status = 400
            return { error: 'ID inválido' }
        }

        const form = await prisma.survey.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { assignments: true }
                },
                questions: {
                    orderBy: { id: 'asc' },
                    include: {
                        options: { orderBy: { id: 'asc' } },
                        subOptions: { orderBy: { id: 'asc' } }
                    }
                }
            }
        })

        if (!form) {
            set.status = 404
            return { error: 'Formulario no encontrado' }
        }

        return form
    })
    // POST /api/forms (Create Complex Survey)
    .post('/', async ({ authUser, body, set }: any) => {
        try {
            if (authUser?.roleId === 2) {
                const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
                const perms = dbUser?.permissions as Record<string, boolean> | null;
                if (!perms?.createSurvey) {
                    set.status = 403;
                    return { error: 'No tienes permiso para crear encuestas.' };
                }
            }

            // Handle multipart (survey JSON string + image files) or plain JSON
            let data: any;
            const imageFiles: Record<string, File> = {};

            if (typeof body.survey === 'string') {
                data = JSON.parse(body.survey);
                for (const key of Object.keys(body)) {
                    if (key.startsWith('image_') && body[key]?.size) {
                        imageFiles[key] = body[key] as File;
                    }
                }
            } else {
                data = body;
            }

            if (!data.title || !data.questions || !Array.isArray(data.questions)) {
                set.status = 400
                return { error: 'Faltan campos obligatorios o el formato es incorrecto' }
            }

            const hasEmptyQuestion = data.questions.some((q: any) => !q.text || q.text.trim() === '');
            if (hasEmptyQuestion) {
                set.status = 400;
                return { error: 'Una o más preguntas tienen el texto vacío. Por favor complétalas.' };
            }

            const hasMissingOptions = data.questions.some((q: any) => 
                [2, 3, 4, 5].includes(q.typeId) && (!q.options || q.options.length === 0)
            );
            if (hasMissingOptions) {
                set.status = 400;
                return { error: 'Una o más preguntas requieren opciones y no tienen ninguna válida.' };
            }

            // Save uploaded images and replace placeholders with URLs
            for (const q of data.questions) {
                for (const opt of q.options ?? []) {
                    if (typeof opt.image === 'string' && opt.image.startsWith('image_') && imageFiles[opt.image]) {
                        const url = await saveFile(imageFiles[opt.image], 'options');
                        opt.image = url;
                    }
                }
            }

            const survey = await prisma.$transaction(async (tx) => {
                const newSurvey = await tx.survey.create({
                    data: {
                        title: data.title,
                        description: data.description || '',
                        location: data.location || '',
                        status: data.status !== undefined ? parseInt(data.status) : 1
                    }
                })

                for (const q of data.questions) {
                    const newQuestion = await tx.question.create({
                        data: {
                            surveyId: newSurvey.id,
                            text: q.text,
                            typeId: q.typeId
                        }
                    })

                    if (q.options && Array.isArray(q.options)) {
                        await tx.option.createMany({
                            data: q.options.map((opt: any) => ({
                                questionId: newQuestion.id,
                                text: opt.text,
                                image: opt.image || null
                            }))
                        })
                    }

                    if (q.subOptions && Array.isArray(q.subOptions)) {
                        await tx.subOption.createMany({
                            data: q.subOptions.map((sub: any) => ({
                                questionId: newQuestion.id,
                                text: sub.text
                            }))
                        })
                    }
                }

                return newSurvey
            })

            set.status = 201
            return { message: 'Encuesta creada exitosamente', surveyId: survey.id }
        } catch (error) {
            console.error('Error creating survey:', error)
            set.status = 500
            return { error: 'Error interno del servidor al crear la encuesta' }
        }
    })
    // PUT /api/forms/:id (Update Complex Survey)
    .put('/:id', async ({ authUser, params, body, set }: any) => {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            set.status = 400
            return { error: 'ID inválido' }
        }

        if (authUser?.roleId === 2) {
            const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
            const perms = dbUser?.permissions as Record<string, boolean> | null;
            if (!perms?.createSurvey) {
                set.status = 403;
                return { error: 'No tienes permiso para modificar encuestas.' };
            }
        }

        try {
            let data: any;
            const imageFiles: Record<string, File> = {};

            if (typeof body.survey === 'string') {
                data = JSON.parse(body.survey);
                for (const key of Object.keys(body)) {
                    if (key.startsWith('image_') && body[key]?.size) {
                        imageFiles[key] = body[key] as File;
                    }
                }
            } else {
                data = body;
            }
            
            if (!data.title || !data.questions || !Array.isArray(data.questions)) {
                set.status = 400
                return { error: 'Faltan campos obligatorios o el formato es incorrecto' }
            }

            const hasEmptyQuestion = data.questions.some((q: any) => !q.text || q.text.trim() === '');
            if (hasEmptyQuestion) {
                set.status = 400;
                return { error: 'Una o más preguntas tienen el texto vacío. Por favor complétalas.' };
            }

            const hasMissingOptions = data.questions.some((q: any) => 
                [2, 3, 4, 5].includes(q.typeId) && (!q.options || q.options.length === 0)
            );
            if (hasMissingOptions) {
                set.status = 400;
                return { error: 'Una o más preguntas requieren opciones y no tienen ninguna válida.' };
            }

            const existingSurvey = await prisma.survey.findUnique({
                where: { id },
                include: { _count: { select: { assignments: true } } }
            })

            if (!existingSurvey) {
                set.status = 404
                return { error: 'Encuesta no encontrada' }
            }

            if (existingSurvey._count.assignments > 0) {
                set.status = 400
                return { error: 'No se puede modificar una encuesta que ya tiene asignaciones' }
            }

            // Save uploaded images and replace placeholders with URLs
            for (const q of data.questions) {
                for (const opt of q.options ?? []) {
                    if (typeof opt.image === 'string' && opt.image.startsWith('image_') && imageFiles[opt.image]) {
                        const url = await saveFile(imageFiles[opt.image], 'options');
                        opt.image = url;
                    }
                }
            }

            const survey = await prisma.$transaction(async (tx) => {
                const updatedSurvey = await tx.survey.update({
                    where: { id },
                    data: {
                        title: data.title,
                        description: data.description || '',
                        location: data.location || '',
                        status: data.status !== undefined ? parseInt(data.status) : existingSurvey.status
                    }
                })

                await tx.question.deleteMany({ where: { surveyId: id } })

                for (const q of data.questions) {
                    const newQuestion = await tx.question.create({
                        data: {
                            surveyId: id,
                            text: q.text,
                            typeId: q.typeId
                        }
                    })

                    if (q.options && Array.isArray(q.options)) {
                        await tx.option.createMany({
                            data: q.options.map((opt: any) => ({
                                questionId: newQuestion.id,
                                text: opt.text,
                                image: opt.image || null
                            }))
                        })
                    }

                    if (q.subOptions && Array.isArray(q.subOptions)) {
                        await tx.subOption.createMany({
                            data: q.subOptions.map((sub: any) => ({
                                questionId: newQuestion.id,
                                text: sub.text
                            }))
                        })
                    }
                }

                return updatedSurvey
            })

            return { message: 'Encuesta actualizada exitosamente', surveyId: survey.id }
        } catch (error) {
            console.error('Error updating survey:', error)
            set.status = 500
            return { error: 'Error interno del servidor al actualizar la encuesta' }
        }
    })
    // DELETE /api/forms/:id
    .delete('/:id', async ({ authUser, params, set }: any) => {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            set.status = 400
            return { error: 'ID inválido' }
        }

        if (authUser?.roleId === 2) {
            const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
            const perms = dbUser?.permissions as Record<string, boolean> | null;
            if (!perms?.createSurvey) {
                set.status = 403;
                return { error: 'No tienes permiso para eliminar encuestas.' };
            }
        }

        try {
            await prisma.survey.delete({ where: { id } })
            return { message: 'Encuesta eliminada' }
        } catch (error) {
            set.status = 500
            return { error: 'Error al eliminar encuesta. Puede que no exista.' }
        }
    })
