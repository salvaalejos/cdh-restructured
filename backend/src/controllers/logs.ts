import { Elysia, t } from 'elysia'
import prisma from '../db'
import { authMiddleware } from '../middleware/auth'

export const logsController = new Elysia({ prefix: '/logs' })
    .use(authMiddleware)
    // -------------------------------------------------------------------------
    // POST /api/logs/batch
    // Recibe un lote de logs desde la aplicación móvil o cliente web
    // -------------------------------------------------------------------------
    .post('/batch', async ({ body, authUser, set }: any) => {
        const { logs } = body

        if (!Array.isArray(logs) || logs.length === 0) {
            set.status = 400
            return { error: 'El campo "logs" debe ser un arreglo no vacío.' }
        }

        try {
            const userId = authUser?.id ? Number(authUser.id) : null

            const logsToCreate = logs.map((log: any) => ({
                userId: log.userId ? Number(log.userId) : userId,
                level: (log.level || 'INFO').toUpperCase(),
                tag: (log.tag || 'SYSTEM').toUpperCase(),
                message: String(log.message || 'Sin mensaje'),
                details: log.details ?? null,
                createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
            }))

            await prisma.appLog.createMany({
                data: logsToCreate,
            })

            return {
                success: true,
                message: `${logsToCreate.length} log(s) guardado(s) correctamente.`,
                count: logsToCreate.length,
            }
        } catch (err: any) {
            console.error('[logs/batch] Error guardando logs:', err)
            set.status = 500
            return { error: 'Error interno al procesar los logs: ' + err.message }
        }
    }, {
        body: t.Object({
            logs: t.Array(t.Object({
                userId: t.Optional(t.Union([t.Number(), t.String()])),
                level: t.Optional(t.String()),
                tag: t.Optional(t.String()),
                message: t.String(),
                details: t.Optional(t.Any()),
                createdAt: t.Optional(t.String()),
            }))
        })
    })

    // -------------------------------------------------------------------------
    // GET /api/logs
    // Consulta paginada de logs para la Web Admin con filtros y estadísticas
    // -------------------------------------------------------------------------
    .get('/', async ({ query, set }: any) => {
        const page = parseInt(query.page as string) || 1
        const limit = parseInt(query.limit as string) || 20
        const skip = (page - 1) * limit

        const whereClause: any = {}

        if (query.level) {
            whereClause.level = (query.level as string).toUpperCase()
        }

        if (query.tag) {
            whereClause.tag = (query.tag as string).toUpperCase()
        }

        if (query.userId) {
            whereClause.userId = parseInt(query.userId as string)
        }

        if (query.search) {
            whereClause.OR = [
                { message: { contains: query.search as string, mode: 'insensitive' } },
                { tag: { contains: query.search as string, mode: 'insensitive' } },
            ]
        }

        if (query.startDate || query.endDate) {
            whereClause.createdAt = {}
            if (query.startDate) whereClause.createdAt.gte = new Date(query.startDate as string)
            if (query.endDate) whereClause.createdAt.lte = new Date(query.endDate as string)
        }

        try {
            const [logs, total, totalErrors, uploadErrors] = await Promise.all([
                prisma.appLog.findMany({
                    where: whereClause,
                    skip,
                    take: limit,
                    include: {
                        user: { select: { id: true, name: true, username: true } },
                    },
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.appLog.count({ where: whereClause }),
                prisma.appLog.count({ where: { level: 'ERROR' } }),
                prisma.appLog.count({ where: { tag: 'UPLOAD' } }),
            ])

            return {
                logs,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                stats: {
                    totalErrors,
                    uploadErrors,
                    totalLogs: total,
                },
            }
        } catch (err: any) {
            console.error('[logs/get] Error al consultar logs:', err)
            set.status = 500
            return { error: 'Error al obtener los logs: ' + err.message }
        }
    })
