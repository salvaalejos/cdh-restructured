import ExcelJS from 'exceljs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function generateSurveyExcel(surveyId: number): Promise<Buffer> {
    const survey = await prisma.survey.findUnique({
        where: { id: surveyId },
        include: {
            questions: {
                include: { options: true, subOptions: true },
                orderBy: { id: 'asc' }
            }
        }
    });

    if (!survey) throw new Error('Encuesta no encontrada');

    const respondents = await prisma.respondent.findMany({
        where: { surveyId },
        include: {
            surveyor: { select: { name: true } },
            answers: true
        },
        orderBy: { id: 'asc' }
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Encuestas');

    const createSolidFill = (argb: string): ExcelJS.FillPattern => ({
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb }
    });
    
    const baseBorder: Partial<ExcelJS.Borders> = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    
    const baseAlign: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };

    const formatHeader = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: createSolidFill('FFCA6121'), border: baseBorder, alignment: baseAlign };
    const formatPreguntas = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: createSolidFill('FF254C72'), border: baseBorder, alignment: baseAlign };
    const formatSubopciones = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: createSolidFill('FF5D8A9F'), border: baseBorder, alignment: baseAlign };
    const formatTotal = { font: { bold: true, color: { argb: 'FFFFFFFF' } }, fill: createSolidFill('FF717175'), border: baseBorder, alignment: baseAlign };

    const applyStyle = (cell: ExcelJS.Cell, style: any) => {
        if (style.font) cell.font = style.font;
        if (style.fill) cell.fill = style.fill;
        if (style.alignment) cell.alignment = style.alignment;
        if (style.border) cell.border = style.border;
    };

    // Estructura Estática (Columnas 1 a 11)
    worksheet.mergeCells(1, 1, 3, 1); worksheet.getCell(1, 1).value = 'Encuestador'; applyStyle(worksheet.getCell(1, 1), formatPreguntas);
    worksheet.mergeCells(1, 2, 3, 2); worksheet.getCell(1, 2).value = 'Encuesta'; applyStyle(worksheet.getCell(1, 2), formatPreguntas);
    worksheet.mergeCells(1, 3, 3, 3); worksheet.getCell(1, 3).value = 'Edad'; applyStyle(worksheet.getCell(1, 3), formatPreguntas);
    
    worksheet.mergeCells(1, 4, 1, 9); worksheet.getCell(1, 4).value = 'Escolaridad'; applyStyle(worksheet.getCell(1, 4), formatPreguntas);
    worksheet.mergeCells(2, 4, 3, 4); worksheet.getCell(2, 4).value = 'Ninguna'; applyStyle(worksheet.getCell(2, 4), formatHeader);
    worksheet.mergeCells(2, 5, 3, 5); worksheet.getCell(2, 5).value = 'Primaria'; applyStyle(worksheet.getCell(2, 5), formatHeader);
    worksheet.mergeCells(2, 6, 3, 6); worksheet.getCell(2, 6).value = 'Secundaria'; applyStyle(worksheet.getCell(2, 6), formatHeader);
    worksheet.mergeCells(2, 7, 3, 7); worksheet.getCell(2, 7).value = 'Preparatoria'; applyStyle(worksheet.getCell(2, 7), formatHeader);
    worksheet.mergeCells(2, 8, 3, 8); worksheet.getCell(2, 8).value = 'Licenciatura'; applyStyle(worksheet.getCell(2, 8), formatHeader);
    worksheet.mergeCells(2, 9, 3, 9); worksheet.getCell(2, 9).value = 'Posgrado'; applyStyle(worksheet.getCell(2, 9), formatHeader);
    
    worksheet.mergeCells(1, 10, 1, 11); worksheet.getCell(1, 10).value = 'Ubicación'; applyStyle(worksheet.getCell(1, 10), formatPreguntas);
    worksheet.mergeCells(2, 10, 3, 10); worksheet.getCell(2, 10).value = 'Latitud'; applyStyle(worksheet.getCell(2, 10), formatHeader);
    worksheet.mergeCells(2, 11, 3, 11); worksheet.getCell(2, 11).value = 'Longitud'; applyStyle(worksheet.getCell(2, 11), formatHeader);
    
    worksheet.mergeCells(1, 12, 1, 13); worksheet.getCell(1, 12).value = 'Género'; applyStyle(worksheet.getCell(1, 12), formatPreguntas);
    worksheet.mergeCells(2, 12, 3, 12); worksheet.getCell(2, 12).value = 'Hombre'; applyStyle(worksheet.getCell(2, 12), formatHeader);
    worksheet.mergeCells(2, 13, 3, 13); worksheet.getCell(2, 13).value = 'Mujer'; applyStyle(worksheet.getCell(2, 13), formatHeader);

    // Iteración de Preguntas
    let currentCol = 14;
    const questionCols: any = {};

    for (const question of survey.questions) {
        if (question.typeId === 1) {
            questionCols[question.id] = { type: 1, col: currentCol };
            worksheet.mergeCells(1, currentCol, 3, currentCol);
            const cell = worksheet.getCell(1, currentCol);
            cell.value = question.text;
            applyStyle(cell, formatHeader);
            currentCol++;
        } else {
            const colStart = currentCol;
            if (question.subOptions && question.subOptions.length > 0) {
                const totalCols = question.options.length * question.subOptions.length;
                worksheet.mergeCells(1, currentCol, 1, currentCol + totalCols - 1);
                const titleCell = worksheet.getCell(1, currentCol);
                titleCell.value = question.text;
                applyStyle(titleCell, formatPreguntas);
                
                for (const option of question.options) {
                    worksheet.mergeCells(2, currentCol, 2, currentCol + question.subOptions.length - 1);
                    const optCell = worksheet.getCell(2, currentCol);
                    optCell.value = option.text;
                    applyStyle(optCell, formatHeader);
                    
                    for (const sub of question.subOptions) {
                        const subCell = worksheet.getCell(3, currentCol);
                        subCell.value = sub.text;
                        applyStyle(subCell, formatSubopciones);
                        currentCol++;
                    }
                }
            } else {
                const totalCols = question.options.length;
                worksheet.mergeCells(1, currentCol, 1, currentCol + totalCols - 1);
                const titleCell = worksheet.getCell(1, currentCol);
                titleCell.value = question.text;
                applyStyle(titleCell, formatPreguntas);
                
                for (const option of question.options) {
                    const optCell = worksheet.getCell(2, currentCol);
                    optCell.value = option.text;
                    applyStyle(optCell, formatHeader);
                    
                    const blankCell = worksheet.getCell(3, currentCol);
                    blankCell.value = '';
                    applyStyle(blankCell, formatHeader);
                    
                    currentCol++;
                }
            }
            questionCols[question.id] = { 
                type: question.typeId, 
                colStart, 
                colEnd: currentCol - 1, 
                options: question.options, 
                subOptions: question.subOptions 
            };
        }
    }

    // Fix border bugs in merged cells by iterating all created header cells
    for (let r = 1; r <= 3; r++) {
        for (let c = 1; c < currentCol; c++) {
            const cell = worksheet.getCell(r, c);
            if (!cell.border) cell.border = baseBorder;
        }
    }

    // Datos
    let currentRow = 4;
    for (const respondent of respondents) {
        const r = worksheet.getRow(currentRow);
        r.getCell(1).value = respondent.surveyor?.name || 'Desconocido';
        r.getCell(2).value = survey.title;
        r.getCell(3).value = respondent.age || '';
        
        const esc = (respondent.schooling || '').toLowerCase();
        r.getCell(4).value = esc.includes('ninguna') ? 1 : 0;
        r.getCell(5).value = esc.includes('primaria') ? 1 : 0;
        r.getCell(6).value = esc.includes('secundaria') ? 1 : 0;
        r.getCell(7).value = esc.includes('preparatoria') ? 1 : 0;
        r.getCell(8).value = esc.includes('licenciatura') ? 1 : 0;
        r.getCell(9).value = esc.includes('posgrado') ? 1 : 0;
        
        r.getCell(10).value = respondent.latitude || '';
        r.getCell(11).value = respondent.longitude || '';
        
        const gen = (respondent.gender || '').toLowerCase();
        r.getCell(12).value = gen === 'hombre' ? 1 : 0;
        r.getCell(13).value = gen === 'mujer' ? 1 : 0;

        for (const q of survey.questions) {
            const qData = questionCols[q.id];
            if (qData.type === 1) {
                const ans = respondent.answers.find(a => a.questionId === q.id);
                r.getCell(qData.col).value = ans?.openText || '';
            } else {
                const ansArr = respondent.answers.filter(a => a.questionId === q.id);
                if (qData.subOptions && qData.subOptions.length > 0) {
                    for (let oIdx = 0; oIdx < qData.options.length; oIdx++) {
                        const opt = qData.options[oIdx];
                        for (let sIdx = 0; sIdx < qData.subOptions.length; sIdx++) {
                            const sub = qData.subOptions[sIdx];
                            const col = qData.colStart + (oIdx * qData.subOptions.length) + sIdx;
                            const isSelected = ansArr.some(a => a.optionId === opt.id && a.subOptionId === sub.id);
                            r.getCell(col).value = isSelected ? 1 : 0;
                        }
                    }
                } else {
                    for (let oIdx = 0; oIdx < qData.options.length; oIdx++) {
                        const opt = qData.options[oIdx];
                        const col = qData.colStart + oIdx;
                        const isSelected = ansArr.some(a => a.optionId === opt.id);
                        r.getCell(col).value = isSelected ? 1 : 0;
                    }
                }
            }
        }
        
        // Add borders to data row
        for(let c = 1; c < currentCol; c++) {
            r.getCell(c).border = baseBorder;
        }
        
        currentRow++;
    }

    // Totales y Porcentajes
    const totalRowIdx = currentRow;
    const percentRowIdx = currentRow + 1;

    const tRow = worksheet.getRow(totalRowIdx);
    const pRow = worksheet.getRow(percentRowIdx);

    tRow.getCell(1).value = 'TOTALES'; applyStyle(tRow.getCell(1), formatTotal);
    tRow.getCell(2).value = respondents.length; applyStyle(tRow.getCell(2), formatTotal);
    pRow.getCell(1).value = 'PORCENTAJE'; applyStyle(pRow.getCell(1), formatTotal);
    pRow.getCell(2).value = '100%'; applyStyle(pRow.getCell(2), formatTotal);

    // Si no hay respondentes, no hay qué sumar
    if (respondents.length > 0) {
        const firstDataRow = 4;
        const lastDataRow = totalRowIdx - 1;
        
        const setFormulas = (cStart: number, cEnd: number) => {
            for (let c = cStart; c <= cEnd; c++) {
                const letter = worksheet.getColumn(c).letter;
                
                const tCell = tRow.getCell(c);
                tCell.value = { formula: `SUM(${letter}${firstDataRow}:${letter}${lastDataRow})`, date1904: false };
                applyStyle(tCell, formatTotal);

                const pCell = pRow.getCell(c);
                pCell.value = { formula: `${letter}${totalRowIdx}/COUNT(${letter}${firstDataRow}:${letter}${lastDataRow})`, date1904: false };
                pCell.numFmt = '0.00%';
                pCell.border = baseBorder;
                pCell.alignment = baseAlign;
            }
        };

        setFormulas(4, 9); // Escolaridad
        setFormulas(12, 13); // Género

        for (const q of survey.questions) {
            if (q.typeId === 1) continue;
            const qData = questionCols[q.id];
            setFormulas(qData.colStart, qData.colEnd);
        }
    }

    // Column widths approximation
    worksheet.getColumn(1).width = 25; // Encuestador
    worksheet.getColumn(2).width = 30; // Encuesta
    worksheet.getColumn(3).width = 10; // Edad
    
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as Buffer;
}
