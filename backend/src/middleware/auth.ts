import { Elysia } from 'elysia'
import { jwt } from '@elysiajs/jwt'

export const authMiddleware = (app: Elysia) => app
    .use(jwt({ name: 'jwt', secret: process.env.JWT_SECRET || 'fallback-secret' }))
    .resolve(async ({ jwt, headers }: any) => {
        const authHeader = headers['authorization']
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { authUser: "NO_HEADER: " + JSON.stringify(headers) }
        }

        const token = authHeader.split(' ')[1]
        const profile = await jwt.verify(token)
        
        try {
            await Bun.write('debug-profile.json', JSON.stringify({ token, profile: profile || 'FALSO_O_NULO' }, null, 2));
        } catch(e) {}
        
        return { authUser: profile }
    })
    .onBeforeHandle(({ authUser, set }) => {
        if (!authUser) {
            set.status = 401
            return { error: 'Token inválido o no proporcionado' }
        }
    })
