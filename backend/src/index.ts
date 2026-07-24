import { Elysia } from 'elysia'
import { cors } from '@elysiajs/cors'
import { jwt } from '@elysiajs/jwt'
import { swagger } from '@elysiajs/swagger'
import { staticPlugin } from '@elysiajs/static'
import { authController } from './controllers/auth'
import { userController } from './controllers/users'
import { formsController } from './controllers/forms'
import { assignmentsController } from './controllers/assignments'
import { responsesController } from './controllers/responses'
import { dashboardController } from './controllers/dashboard'
import { logsController } from './controllers/logs'

const app = new Elysia()
    .use(cors())
    .get('/favicon.ico', () => new Response(null, { status: 204 }))
    .use(staticPlugin({
        assets: import.meta.dir + '/../uploads',
        prefix: '/uploads',
        alwaysStatic: false
    }))
    .use(swagger({
        documentation: {
            info: {
                title: 'CDH Migration API',
                version: '1.0.0'
            }
        }
    }))
    .use(jwt({
        name: 'jwt',
        secret: process.env.JWT_SECRET || 'fallback-secret'
    }))
    .group('/api', (app) => app
        .use(authController)
        .use(userController)
        .use(formsController)
        .use(assignmentsController)
        .use(responsesController)
        .use(dashboardController)
        .use(logsController)
    )
    .listen(3000)

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
)
