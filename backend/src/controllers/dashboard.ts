import { Elysia } from 'elysia'
import prisma from '../db'
import { authMiddleware } from '../middleware/auth'

export const dashboardController = new Elysia({ prefix: '/dashboard' })
    .use(authMiddleware)
    // GET /api/dashboard/stats
    .get('/stats', async ({ authUser, set }: any) => {
        try {
            if (authUser.roleId !== 1 && authUser.roleId !== 2) {
                set.status = 403;
                return { error: 'Acceso denegado. Solo administradores pueden ver estas estadísticas.' };
            }

            const [totalSurveys, totalSurveyors, totalRespondents] = await Promise.all([
                prisma.survey.count(),
                prisma.user.count({ where: { roleId: 3 } }),
                prisma.respondent.count()
            ]);

            const recentSurveysRaw = await prisma.survey.findMany({
                take: 4,
                orderBy: { createdAt: 'desc' },
                include: {
                    assignments: true,
                    _count: {
                        select: { respondents: true }
                    }
                }
            });

            const recentSurveys = recentSurveysRaw.map(survey => {
                const target = survey.assignments.reduce((sum, a) => sum + a.womenCount + a.menCount, 0);
                const completed = survey._count.respondents;
                return {
                    id: survey.id,
                    title: survey.title,
                    status: survey.status,
                    target,
                    completed
                };
            });

            return {
                overview: {
                    totalSurveys,
                    totalSurveyors,
                    totalRespondents
                },
                recentSurveys
            };

        } catch (error: any) {
            console.error('Error fetching dashboard stats:', error);
            set.status = 500;
            return { error: 'Error interno del servidor al obtener estadísticas.' };
        }
    });
