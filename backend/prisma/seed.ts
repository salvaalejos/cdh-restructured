import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/hash'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create an Admin user (userType / role = 1)
    const adminPassword = await hashPassword('admin123')
    
    const admin = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            password: adminPassword,
            name: 'Administrador Principal',
            roleId: 1, 
        },
    })

    // Create a Surveyor (encuestador, role = 3)
    const surveyorPassword = await hashPassword('encuestador123')
    
    const surveyor = await prisma.user.upsert({
        where: { username: 'encuestador_01' },
        update: {},
        create: {
            username: 'encuestador_01',
            password: surveyorPassword,
            name: 'Juan Perez (Encuestador)',
            roleId: 3, 
        },
    })

    console.log('Seed completed successfully.')
    console.log('Admin:', admin.username)
    console.log('Surveyor:', surveyor.username)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
