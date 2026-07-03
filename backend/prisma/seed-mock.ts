import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/utils/hash'

const prisma = new PrismaClient()

// Helper functions for random data
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomChoice = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomLat = () => 23.6345 + (Math.random() - 0.5) * 10;
const randomLng = () => -102.5528 + (Math.random() - 0.5) * 10;
const genders = ['Hombre', 'Mujer'];
const schoolings = ['Ninguna', 'Primaria', 'Secundaria', 'Preparatoria', 'Licenciatura', 'Posgrado'];

async function main() {
    console.log('🌱 Iniciando la siembra de datos masiva...');

    // 1. Limpiar base de datos (excepto Admin) para evitar duplicados
    console.log('🧹 Limpiando base de datos (cuidado en producción)...');
    await prisma.answer.deleteMany();
    await prisma.respondent.deleteMany();
    await prisma.assignment.deleteMany();
    await prisma.option.deleteMany();
    await prisma.subOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.survey.deleteMany();
    await prisma.user.deleteMany({ where: { roleId: { not: 1 } } });

    // 2. Crear Encuestadores
    console.log('👥 Creando encuestadores...');
    const surveyorPassword = await hashPassword('123456');
    const surveyors = [];
    for (let i = 1; i <= 10; i++) {
        const surveyor = await prisma.user.create({
            data: {
                username: `encuestador_${i}`,
                password: surveyorPassword,
                name: `Encuestador de Campo ${i}`,
                roleId: 3,
            }
        });
        surveyors.push(surveyor);
    }

    // 3. Crear Encuestas, Preguntas, Opciones
    console.log('📝 Creando encuestas y estructura...');
    const surveysData = [
        { title: 'Estudio Socioeconómico CDH 2026', location: 'Nacional' },
        { title: 'Evaluación de Servicios Públicos', location: 'CDMX' },
        { title: 'Sondeo de Opinión Política', location: 'Jalisco' }
    ];

    const createdSurveys = [];

    for (const sData of surveysData) {
        const survey = await prisma.survey.create({
            data: {
                title: sData.title,
                description: 'Encuesta generada automáticamente para pruebas de carga y visualización.',
                location: sData.location,
                status: 1
            }
        });

        // Open Question
        await prisma.question.create({
            data: { surveyId: survey.id, text: '¿Cuál es tu opinión principal sobre este tema?', typeId: 1 }
        });

        // Single Choice
        const singleQ = await prisma.question.create({
            data: { surveyId: survey.id, text: '¿Rango de ingresos mensuales?', typeId: 2 }
        });
        await prisma.option.createMany({
            data: [
                { questionId: singleQ.id, text: 'Menos de $5,000' },
                { questionId: singleQ.id, text: '$5,000 a $15,000' },
                { questionId: singleQ.id, text: 'Más de $15,000' }
            ]
        });

        // Multiple Choice
        const multipleQ = await prisma.question.create({
            data: { surveyId: survey.id, text: '¿Qué servicios utilizas regularmente?', typeId: 3 }
        });
        await prisma.option.createMany({
            data: [
                { questionId: multipleQ.id, text: 'Agua Potable' },
                { questionId: multipleQ.id, text: 'Transporte Público' },
                { questionId: multipleQ.id, text: 'Alumbrado' },
                { questionId: multipleQ.id, text: 'Recolección de Basura' }
            ]
        });

        // Matrix Single
        const matrixQ = await prisma.question.create({
            data: { surveyId: survey.id, text: 'Califica los siguientes aspectos (1=Malo, 5=Excelente)', typeId: 4 }
        });
        await prisma.option.createMany({
            data: [
                { questionId: matrixQ.id, text: 'Seguridad' },
                { questionId: matrixQ.id, text: 'Limpieza' },
                { questionId: matrixQ.id, text: 'Infraestructura' }
            ]
        });
        await prisma.subOption.createMany({
            data: [
                { questionId: matrixQ.id, text: '1' },
                { questionId: matrixQ.id, text: '2' },
                { questionId: matrixQ.id, text: '3' },
                { questionId: matrixQ.id, text: '4' },
                { questionId: matrixQ.id, text: '5' }
            ]
        });

        createdSurveys.push(survey);
    }

    // Fetch full surveys to easily create answers later
    const fullSurveys = await prisma.survey.findMany({
        include: {
            questions: {
                include: { options: true, subOptions: true }
            }
        }
    });

    // 4. Crear Asignaciones
    console.log('📌 Asignando encuestas a los encuestadores...');
    for (const surveyor of surveyors) {
        const assignedSurvey = randomChoice(fullSurveys);
        await prisma.assignment.create({
            data: {
                userId: surveyor.id,
                surveyId: assignedSurvey.id,
                menCount: 20,
                womenCount: 20
            }
        });
    }

    // 5. Crear Encuestados (Respondents) y sus Respuestas
    console.log('📊 Generando CIENTOS de encuestados y sus respuestas (esto puede tardar unos segundos)...');
    
    // We will create around 300 respondents total
    const TOTAL_RESPONDENTS = 300;
    
    for (let i = 0; i < TOTAL_RESPONDENTS; i++) {
        const surveyor = randomChoice(surveyors);
        // Find surveyor's assignment to know which survey they are doing
        const assignment = await prisma.assignment.findFirst({ where: { userId: surveyor.id } });
        if (!assignment) continue;

        const survey = fullSurveys.find(s => s.id === assignment.surveyId)!;

        // Create Respondent
        const respondent = await prisma.respondent.create({
            data: {
                surveyorId: surveyor.id,
                surveyId: survey.id,
                age: randomInt(18, 75),
                gender: randomChoice(genders),
                schooling: randomChoice(schoolings),
                latitude: randomLat(),
                longitude: randomLng()
            }
        });

        // Create Answers
        for (const q of survey.questions) {
            if (q.typeId === 1) {
                // Open text
                await prisma.answer.create({
                    data: {
                        respondentId: respondent.id,
                        questionId: q.id,
                        openText: 'Esta es una respuesta generada automáticamente de prueba.'
                    }
                });
            } else if (q.typeId === 2) {
                // Single choice
                const opt = randomChoice(q.options);
                await prisma.answer.create({
                    data: {
                        respondentId: respondent.id,
                        questionId: q.id,
                        optionId: opt.id
                    }
                });
            } else if (q.typeId === 3) {
                // Multiple choice (pick 1 to 3 random options)
                const numPicks = randomInt(1, 3);
                const picked = q.options.sort(() => 0.5 - Math.random()).slice(0, numPicks);
                for (const opt of picked) {
                    await prisma.answer.create({
                        data: {
                            respondentId: respondent.id,
                            questionId: q.id,
                            optionId: opt.id
                        }
                    });
                }
            } else if (q.typeId === 4) {
                // Matrix single (one subOption per option)
                for (const opt of q.options) {
                    const sub = randomChoice(q.subOptions);
                    await prisma.answer.create({
                        data: {
                            respondentId: respondent.id,
                            questionId: q.id,
                            optionId: opt.id,
                            subOptionId: sub.id
                        }
                    });
                }
            }
        }

        if (i > 0 && i % 50 === 0) {
            console.log(`   ... ${i} encuestados generados.`);
        }
    }

    console.log('✅ Base de datos poblada exitosamente!');
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    });
