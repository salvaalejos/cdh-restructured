import { Elysia, t } from 'elysia'
import prisma from '../db'
import { authMiddleware } from '../middleware/auth'
import { hashPassword } from '../utils/hash'
import { saveFile } from '../utils/upload'
export const userController = new Elysia({ prefix: '/users' })
    .use(authMiddleware)
    // GET /api/users/me
    .get('/me', async ({ authUser, set }: any) => {
        try {
            const userId = Number(authUser?.id);
            if (!userId || isNaN(userId)) {
                set.status = 401;
                return { error: 'Sesión inválida.' };
            }

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    username: true,
                    name: true,
                    roleId: true,
                    permissions: true,
                    frontId: true,
                    backId: true,
                    profilePic: true,
                    birthDate: true,
                    createdAt: true
                }
            })
            if (!user) {
                set.status = 404
                return { error: 'Usuario no encontrado' }
            }
            return user
        } catch (e) {
            console.error('Error en GET /me:', e);
            set.status = 500
            return { error: 'Error al cargar perfil' }
        }
    })
    // PUT /api/users/me
    .put('/me', async ({ authUser, body, set }: any) => {
        const { username, password, name, profilePic } = body as any
        
        const dataToUpdate: any = {}
        if (username) dataToUpdate.username = username
        if (name) dataToUpdate.name = name
        
        if (password && password.trim() !== '') {
            dataToUpdate.password = await hashPassword(password)
        }
        
        if (profilePic && (profilePic as File).size > 0) {
            dataToUpdate.profilePic = await saveFile(profilePic as File)
        }

        try {
            const userId = Number(authUser?.id);
            if (!userId || isNaN(userId)) {
                set.status = 401;
                return { error: 'Sesión inválida (Token sin ID). Por favor cierra sesión y vuelve a iniciar.' };
            }

            if (authUser?.roleId === 2) {
                set.status = 403;
                return { error: 'Los invitados temporales no pueden modificar su propia cuenta.' };
            }

            const user = await prisma.user.update({
                where: { id: userId },
                data: dataToUpdate,
                select: { id: true, username: true, name: true, profilePic: true }
            })
            return user
        } catch(e) {
            console.error(e)
            set.status = 400
            return { error: 'Error al actualizar perfil' }
        }
    }, {
        body: t.Object({
            username: t.Optional(t.String()),
            password: t.Optional(t.String()),
            name: t.Optional(t.String()),
            profilePic: t.Optional(t.Any())
        })
    })
    // GET /api/users
    .get('/', async ({ query }) => {
        const page = parseInt(query.page as string) || 1
        const limit = parseInt(query.limit as string) || 10
        const search = (query.search as string) || ''
        const roleId = query.roleId ? parseInt(query.roleId as string) : undefined

        const skip = (page - 1) * limit

        const whereClause: any = {}
        
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } }
            ]
        }
        
        if (roleId && !isNaN(roleId)) {
            whereClause.roleId = roleId
        }

        const [users, total] = await Promise.all([
            prisma.user.findMany({
                where: whereClause,
                select: {
                    id: true,
                    username: true,
                    name: true,
                    roleId: true,
                    permissions: true,
                    frontId: true,
                    backId: true,
                    birthDate: true,
                    createdAt: true,
                    updatedAt: true
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit
            }),
            prisma.user.count({ where: whereClause })
        ])

        return {
            data: users,
            meta: {
                total,
                page,
                lastPage: Math.ceil(total / limit) || 1
            }
        }
    })
    // POST /api/users (Multipart for file uploads)
    .post('/', async ({ authUser, body, set }: any) => {
        const { username, password, name, roleId, permissions, birthDate, frontId, backId } = body
        
        const numericRoleId = Number(roleId);
        if (authUser?.roleId === 2 && numericRoleId === 1) {
            set.status = 403;
            return { error: 'Los invitados temporales no pueden crear administradores principales.' };
        }
        
        const existing = await prisma.user.findUnique({ where: { username } })
        if (existing) {
            set.status = 400
            return { error: 'El usuario ya existe' }
        }

        const hashedPassword = await hashPassword(password)
        
        let frontPath = null
        let backPath = null
        
        if (frontId && (frontId as File).size > 0) {
            frontPath = await saveFile(frontId as File)
        }
        if (backId && (backId as File).size > 0) {
            backPath = await saveFile(backId as File)
        }

        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
                name,
                roleId: numericRoleId,
                permissions: numericRoleId === 2 && permissions ? (typeof permissions === 'string' ? JSON.parse(permissions) : permissions) : null,
                birthDate: birthDate ? new Date(birthDate) : null,
                frontId: frontPath,
                backId: backPath
            },
            select: { id: true, username: true, name: true, roleId: true, permissions: true }
        })
        
        return user
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String(),
            name: t.String(),
            roleId: t.Union([t.String(), t.Number()]),
            permissions: t.Optional(t.Any()),
            birthDate: t.Optional(t.String()),
            frontId: t.Optional(t.Any()),
            backId: t.Optional(t.Any())
        })
    })
    // PUT /api/users/:id
    .put('/:id', async ({ authUser, params, body, set }: any) => {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            set.status = 400
            return { error: 'ID inválido' }
        }
        
        if (authUser?.roleId === 2) {
            const targetUser = await prisma.user.findUnique({ where: { id } });
            if (targetUser && targetUser.roleId === 1) {
                set.status = 403;
                return { error: 'Los invitados temporales no pueden modificar a un administrador principal.' };
            }
        }
        
        const { username, password, name, roleId, permissions, birthDate, frontId, backId } = body as any
        
        const dataToUpdate: any = {}
        if (username) dataToUpdate.username = username
        if (name) dataToUpdate.name = name
        if (roleId) {
            const numericRoleId = Number(roleId);
            dataToUpdate.roleId = numericRoleId;
            if (numericRoleId === 2 && permissions) {
                dataToUpdate.permissions = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
            } else if (numericRoleId !== 2) {
                dataToUpdate.permissions = null;
            }
        } else if (permissions) {
            // Update permissions if roleId is not sent (assuming user is already role 2 or will be validated)
            dataToUpdate.permissions = typeof permissions === 'string' ? JSON.parse(permissions) : permissions;
        }
        
        if (birthDate) dataToUpdate.birthDate = new Date(birthDate)
        
        if (password && password.trim() !== '') {
            dataToUpdate.password = await hashPassword(password)
        }
        
        if (frontId && (frontId as File).size > 0) {
            dataToUpdate.frontId = await saveFile(frontId as File)
        }
        if (backId && (backId as File).size > 0) {
            dataToUpdate.backId = await saveFile(backId as File)
        }

        try {
            const user = await prisma.user.update({
                where: { id },
                data: dataToUpdate,
                select: { id: true, username: true, name: true, roleId: true, permissions: true }
            })
            return user
        } catch(e) {
            set.status = 400
            return { error: 'Error al actualizar usuario' }
        }
    }, {
        body: t.Object({
            username: t.Optional(t.String()),
            password: t.Optional(t.String()),
            name: t.Optional(t.String()),
            roleId: t.Optional(t.Union([t.String(), t.Number()])),
            permissions: t.Optional(t.Any()),
            birthDate: t.Optional(t.String()),
            frontId: t.Optional(t.Any()),
            backId: t.Optional(t.Any())
        })
    })
    // DELETE /api/users/:id
    .delete('/:id', async ({ authUser, params, set }: any) => {
        const id = parseInt(params.id)
        if (isNaN(id)) {
            set.status = 400
            return { error: 'ID inválido' }
        }
        
        if (authUser?.roleId === 2) {
            const targetUser = await prisma.user.findUnique({ where: { id } });
            if (targetUser && targetUser.roleId === 1) {
                set.status = 403;
                return { error: 'Los invitados temporales no pueden eliminar a un administrador principal.' };
            }
        }
        
        try {
            await prisma.user.delete({ where: { id } })
            return { success: true }
        } catch(e) {
            set.status = 400
            return { error: 'No se pudo eliminar el usuario' }
        }
    })
