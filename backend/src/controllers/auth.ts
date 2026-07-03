import { Elysia, t } from 'elysia'
import prisma from '../db'
import { verifyPassword, hashPassword } from '../utils/hash'

export const authController = new Elysia({ prefix: '/auth' })
    .post('/login', async ({ body, jwt, set }) => {
        const { username, password } = body
        
        const user = await prisma.user.findUnique({
            where: { username }
        })
        
        if (!user || !(await verifyPassword(password, user.password))) {
            set.status = 401
            return { error: 'Invalid username or password' }
        }

        // Transparently upgrade legacy Werkzeug hashes to modern Argon2id
        if (user.password.startsWith('pbkdf2:sha256')) {
            const newHash = await hashPassword(password);
            await prisma.user.update({
                where: { id: user.id },
                data: { password: newHash }
            });
        }
        
        const token = await jwt.sign({ 
            id: user.id, 
            roleId: user.roleId,
            username: user.username 
        })
        
        return {
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                roleId: user.roleId,
                profilePic: user.profilePic
            }
        }
    }, {
        body: t.Object({
            username: t.String(),
            password: t.String()
        })
    })
