import { Elysia, t } from 'elysia'
import prisma from '../db'
import { authMiddleware } from '../middleware/auth'

export const assignmentsController = new Elysia({ prefix: '/assignments' })
    .use(authMiddleware)
    // List surveyors with their current assignment and progress
    .get('/surveyors', async ({ query }) => {
        const limit = Number(query.limit) || 20
        const skip = (Number(query.page || 1) - 1) * limit
        
        const where: any = { roleId: 3 }
        if (query.search) {
            where.name = { contains: query.search as string, mode: 'insensitive' }
        }

        const total = await prisma.user.count({ where })
        
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            select: {
                id: true,
                username: true,
                name: true,
                assignments: {
                    include: { survey: { select: { title: true } } },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        })

        const data = await Promise.all(users.map(async (u) => {
            const assignment = u.assignments[0] || null;
            let progress = { men: 0, women: 0 };
            
            if (assignment) {
                const menCount = await prisma.respondent.count({
                    where: { surveyorId: u.id, surveyId: assignment.surveyId, gender: { in: ['Hombre', 'M'] } }
                });
                const womenCount = await prisma.respondent.count({
                    where: { surveyorId: u.id, surveyId: assignment.surveyId, gender: { in: ['Mujer', 'F'] } }
                });
                progress = { men: menCount, women: womenCount };
            }

            return {
                id: u.id,
                username: u.username,
                name: u.name,
                assignment,
                progress
            }
        }))

        return {
            data,
            meta: {
                total,
                page: Number(query.page) || 1,
                lastPage: Math.ceil(total / limit)
            }
        }
    })
    // Get current user's assignment (for mobile surveyor app)
    .get('/me', async ({ authUser, set }: any) => {
        try {
            const assignment = await prisma.assignment.findFirst({
                where: { userId: authUser.id },
                include: {
                    survey: {
                        include: {
                            questions: {
                                orderBy: { id: 'asc' },
                                include: {
                                    options: { orderBy: { id: 'asc' } },
                                    subOptions: { orderBy: { id: 'asc' } }
                                }
                            }
                        }
                    }
                }
            })

            if (!assignment) {
                set.status = 404
                return { error: 'No tienes ninguna encuesta asignada actualmente.' }
            }

            const completedMen = await prisma.respondent.count({
                where: { surveyorId: authUser.id, surveyId: assignment.surveyId, gender: { in: ['Hombre', 'M'] } }
            });
            const completedWomen = await prisma.respondent.count({
                where: { surveyorId: authUser.id, surveyId: assignment.surveyId, gender: { in: ['Mujer', 'F'] } }
            });

            return {
                ...assignment,
                completedProgress: {
                    men: completedMen,
                    women: completedWomen
                }
            }
        } catch (error: any) {
            set.status = 500
            return { error: 'Error al obtener la asignación: ' + error.message }
        }
    })
    // Bulk assign surveyors to a survey
    .post('/bulk', async ({ body, set }) => {
        const { surveyId, userIds, womenCount, menCount } = body

        try {
            await prisma.$transaction(async (tx) => {
                // Delete existing assignments for these users
                await tx.assignment.deleteMany({
                    where: { userId: { in: userIds } }
                })

                // Create new assignments
                await tx.assignment.createMany({
                    data: userIds.map(uid => ({
                        surveyId,
                        userId: uid,
                        womenCount,
                        menCount
                    }))
                })
            })
            return { message: 'Asignaciones actualizadas correctamente' }
        } catch (error: any) {
            set.status = 500
            return { error: 'Error al crear asignaciones: ' + error.message }
        }
    }, {
        body: t.Object({
            surveyId: t.Numeric(),
            userIds: t.Array(t.Numeric()),
            womenCount: t.Numeric(),
            menCount: t.Numeric()
        })
    })
    // Remove a single assignment
    .delete('/:id', async ({ params, set }) => {
        try {
            await prisma.assignment.delete({ where: { id: parseInt(params.id) } })
            return { message: 'Asignación eliminada' }
        } catch (error: any) {
            set.status = 500
            return { error: 'Error al eliminar asignación' }
        }
    })
