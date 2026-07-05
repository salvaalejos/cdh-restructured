import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useCreateSurvey, useUpdateSurvey, useSurveyDetails } from '../api/formHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, ArrowLeft, Image as ImageIcon, GripVertical, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { useRef } from 'react';

interface SubOptionDraft {
    text: string;
}

interface OptionDraft {
    text: string;
    image: string | null;
    imageUploadKey: string | null;
}

interface QuestionDraft {
    id: string; // Required for Drag and Drop
    text: string;
    typeId: number;
    options: OptionDraft[];
    subOptions: SubOptionDraft[];
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export default function FormBuilderPage() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    
    const isEditMode = !!id;
    const surveyId = isEditMode ? parseInt(id as string) : undefined;
    const duplicateData = location.state?.duplicateData;

    const { mutate: createSurvey, isPending: isCreating } = useCreateSurvey();
    const { mutate: updateSurvey, isPending: isUpdating } = useUpdateSurvey(surveyId);
    const { data: surveyDetails, isLoading } = useSurveyDetails(surveyId);

    const isPending = isCreating || isUpdating;

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [surveyLocation, setSurveyLocation] = useState('');
    const [status, setStatus] = useState('1');
    const [questions, setQuestions] = useState<QuestionDraft[]>([]);
    const [likertNumInput, setLikertNumInput] = useState<{index: number, max: string, isSubOption: boolean} | null>(null);
    const imageFilesRef = useRef<Record<string, File>>({});

    useEffect(() => {
        const initData = isEditMode ? surveyDetails : duplicateData;
        if (initData) {
            setTitle(isEditMode ? initData.title : `Copia de ${initData.title}`);
            setDescription(initData.description || '');
            setSurveyLocation(initData.location || '');
            setStatus(initData.status?.toString() || '1');
            
            if (initData.questions) {
                setQuestions(initData.questions.map((q: any) => ({
                    id: generateId(),
                    text: q.text,
                    typeId: q.typeId,
                    options: q.options ? q.options.map((o: any) => ({ text: o.text, image: o.image || null, imageUploadKey: null })) : [],
                    subOptions: q.subOptions ? q.subOptions.map((so: any) => ({ text: so.text })) : []
                })));
            }
        }
    }, [surveyDetails, duplicateData, isEditMode]);

    const addQuestion = () => {
        setQuestions([
            ...questions, 
            { id: generateId(), text: '', typeId: 2, options: [{ text: '', image: null }], subOptions: [] }
        ]);
    };

    const updateQuestion = (qIndex: number, field: string, value: any) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex] = { ...next[qIndex], [field]: value };
            return next;
        });
    };

    const removeQuestion = (qIndex: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== qIndex));
    };

    const addOption = (qIndex: number) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex] = { ...next[qIndex], options: [...next[qIndex].options, { text: '', image: null, imageUploadKey: null }] };
            return next;
        });
    };

    const updateOption = (qIndex: number, oIndex: number, field: keyof OptionDraft, value: string | null) => {
        setQuestions(prev => {
            const next = [...prev];
            const nextOptions = [...next[qIndex].options];
            nextOptions[oIndex] = { ...nextOptions[oIndex], [field]: value };
            next[qIndex] = { ...next[qIndex], options: nextOptions };
            return next;
        });
    };

    const removeOption = (qIndex: number, oIndex: number) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex] = { ...next[qIndex], options: next[qIndex].options.filter((_, i) => i !== oIndex) };
            return next;
        });
    };

    const addSubOption = (qIndex: number) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex] = { ...next[qIndex], subOptions: [...next[qIndex].subOptions, { text: '' }] };
            return next;
        });
    };

    const updateSubOption = (qIndex: number, sIndex: number, value: string) => {
        setQuestions(prev => {
            const next = [...prev];
            const nextSubOptions = [...next[qIndex].subOptions];
            nextSubOptions[sIndex] = { ...nextSubOptions[sIndex], text: value };
            next[qIndex] = { ...next[qIndex], subOptions: nextSubOptions };
            return next;
        });
    };

    const removeSubOption = (qIndex: number, sIndex: number) => {
        setQuestions(prev => {
            const next = [...prev];
            next[qIndex] = { ...next[qIndex], subOptions: next[qIndex].subOptions.filter((_, i) => i !== sIndex) };
            return next;
        });
    };

    const quickAddOptions = (qIndex: number, type: 'yesno' | 'likert-text' | 'likert-num', maxNum: number = 5) => {
        setQuestions(prev => {
            const next = [...prev];
            let newOptions: OptionDraft[] = [];
            if (type === 'yesno') {
                newOptions = [{ text: 'Sí', image: null, imageUploadKey: null }, { text: 'No', image: null, imageUploadKey: null }];
            } else if (type === 'likert-text') {
                newOptions = [
                    { text: 'Muy mal', image: null, imageUploadKey: null },
                    { text: 'Mal', image: null, imageUploadKey: null },
                    { text: 'Regular', image: null, imageUploadKey: null },
                    { text: 'Bien', image: null, imageUploadKey: null },
                    { text: 'Muy bien', image: null, imageUploadKey: null }
                ];
            } else if (type === 'likert-num') {
                newOptions = Array.from({length: maxNum + 1}, (_, i) => ({ text: String(i), image: null, imageUploadKey: null }));
            }
            // Replace completely or append? Let's append if there are existing valid options, otherwise replace.
            const hasExisting = next[qIndex].options.some(o => o.text.trim() !== '' || !!o.image);
            if (hasExisting) {
                next[qIndex] = { ...next[qIndex], options: [...next[qIndex].options, ...newOptions] };
            } else {
                next[qIndex] = { ...next[qIndex], options: newOptions };
            }
            return next;
        });
    };

    const quickAddSubOptions = (qIndex: number, type: 'likert-text' | 'likert-num', maxNum: number = 5) => {
        setQuestions(prev => {
            const next = [...prev];
            let newSubOptions: SubOptionDraft[] = [];
            if (type === 'likert-text') {
                newSubOptions = [
                    { text: 'Muy mal' }, { text: 'Mal' }, { text: 'Regular' }, { text: 'Bien' }, { text: 'Muy bien' }
                ];
            } else if (type === 'likert-num') {
                newSubOptions = Array.from({length: maxNum + 1}, (_, i) => ({ text: String(i) }));
            }
            const hasExisting = next[qIndex].subOptions.some(o => o.text.trim() !== '');
            if (hasExisting) {
                next[qIndex] = { ...next[qIndex], subOptions: [...next[qIndex].subOptions, ...newSubOptions] };
            } else {
                next[qIndex] = { ...next[qIndex], subOptions: newSubOptions };
            }
            return next;
        });
    };

    const handleImageUpload = (qIndex: number, oIndex: number, file: File) => {
        if (file.size > 3 * 1024 * 1024) {
            toast.error('La imagen excede el límite de 3MB. Por favor elige una más pequeña o comprímela.');
            return;
        }

        const uploadKey = `image_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        imageFilesRef.current[uploadKey] = file;

        const previewUrl = URL.createObjectURL(file);
        setQuestions(prev => {
            const next = [...prev];
            const nextOptions = [...next[qIndex].options];
            nextOptions[oIndex] = { ...nextOptions[oIndex], image: previewUrl, imageUploadKey: uploadKey };
            next[qIndex] = { ...next[qIndex], options: nextOptions };
            return next;
        });
    };

    const removeImage = (qIndex: number, oIndex: number) => {
        const opt = questions[qIndex].options[oIndex];
        if (opt.imageUploadKey) {
            delete imageFilesRef.current[opt.imageUploadKey];
        }
        if (opt.image && opt.image.startsWith('blob:')) {
            URL.revokeObjectURL(opt.image);
        }
        setQuestions(prev => {
            const next = [...prev];
            const nextOptions = [...next[qIndex].options];
            nextOptions[oIndex] = { ...nextOptions[oIndex], image: null, imageUploadKey: null };
            next[qIndex] = { ...next[qIndex], options: nextOptions };
            return next;
        });
    };

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        setQuestions(prev => {
            const items = Array.from(prev);
            const [reorderedItem] = items.splice(result.source.index, 1);
            items.splice(result.destination!.index, 0, reorderedItem);
            return items;
        });
    };

    const handleSubmit = () => {
        if (!title.trim()) return toast.error('El título de la encuesta es obligatorio.');
        if (questions.length === 0) return toast.error('Debes agregar al menos una pregunta.');
        
        const hasEmptyQuestion = questions.some(q => !q.text || q.text.trim() === '');
        if (hasEmptyQuestion) return toast.error('Una o más preguntas tienen el texto vacío. Por favor complétalas.');

        const hasMissingOptions = questions.some(q => 
            [2, 3, 4, 5].includes(q.typeId) && q.options.filter(o => o.text.trim() !== '' || !!o.image).length === 0
        );
        if (hasMissingOptions) return toast.error('Una o más preguntas de opción múltiple o matriz no tienen opciones válidas.');
        
        const hasMissingSubOptions = questions.some(q => 
            [4, 5].includes(q.typeId) && q.subOptions.filter(so => so.text.trim() !== '').length === 0
        );
        if (hasMissingSubOptions) return toast.error('Una o más preguntas de tipo matriz no tienen filas (subopciones) válidas.');

        const questionsPayload = questions.map(q => ({
            text: q.text,
            typeId: q.typeId,
            options: [2, 3, 4, 5].includes(q.typeId)
                ? q.options.filter(o => o.text.trim() !== '' || !!o.image).map(o => ({
                    text: o.text,
                    image: o.imageUploadKey ? o.imageUploadKey : (o.image && !o.image.startsWith('blob:') ? o.image : null)
                }))
                : [],
            subOptions: [4, 5].includes(q.typeId) ? q.subOptions.filter(so => so.text.trim() !== '') : []
        }));

        // Build FormData with survey JSON + image files
        const formData = new FormData();
        formData.append('survey', JSON.stringify({
            title,
            description,
            location: surveyLocation,
            status: parseInt(status),
            questions: questionsPayload
        }));

        for (const [key, file] of Object.entries(imageFilesRef.current)) {
            formData.append(key, file);
        }

        const onSuccess = () => {
            toast.success(isEditMode ? 'Encuesta actualizada exitosamente' : 'Encuesta creada exitosamente');
            navigate('/admin/forms');
        };
        const onError = (err: any) => {
            toast.error(err.response?.data?.error || 'Error al guardar la encuesta');
        };

        if (isEditMode) {
            updateSurvey(formData, { onSuccess, onError });
        } else {
            createSurvey(formData, { onSuccess, onError });
        }
    };

    if (isEditMode && isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="animate-pulse text-muted-foreground">Cargando encuesta...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate('/admin/forms')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isEditMode ? 'Editar Encuesta' : duplicateData ? 'Duplicar Encuesta' : 'Crear Nueva Encuesta'}
                    </h1>
                    <p className="text-muted-foreground text-sm">Construye un cuestionario dinámico.</p>
                </div>
            </div>

            {/* General Info */}
            <div className="bg-card border border-border p-6 rounded-md shadow-sm space-y-4">
                <div className="space-y-2">
                    <Label className="text-lg">Título de la Encuesta <span className="text-destructive">*</span></Label>
                    <Input placeholder="Ej. Estudio Demográfico 2026" value={title} onChange={e => setTitle(e.target.value)} className="text-lg py-6" />
                </div>
                <div className="space-y-2">
                    <Label>Descripción</Label>
                    <Textarea placeholder="Instrucciones o contexto para el encuestador..." value={description} onChange={e => setDescription(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Ubicación Referencial (Opcional)</Label>
                        <Input placeholder="Ej. Zona Centro, Estado de México" value={surveyLocation} onChange={e => setSurveyLocation(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Estado Inicial</Label>
                        <select 
                            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                        >
                            <option value="1">Activo</option>
                            <option value="0">Desactivado</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Questions Builder with Drag and Drop */}
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="questions-list">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                            {questions.map((q, qIndex) => (
                                <Draggable key={q.id} draggableId={q.id} index={qIndex}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            className={`bg-card border p-6 rounded-md shadow-sm space-y-4 relative group ${snapshot.isDragging ? 'border-primary ring-2 ring-primary ring-opacity-50' : 'border-border'}`}
                                        >
                                            <div className="absolute top-4 left-2 cursor-grab opacity-50 hover:opacity-100" {...provided.dragHandleProps}>
                                                <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            </div>
                                            
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="absolute top-4 right-4 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeQuestion(qIndex)}
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </Button>
                                            
                                            <div className="flex flex-col sm:flex-row gap-4 pl-6">
                                                <div className="flex-1 space-y-2">
                                                    <Label>Pregunta {qIndex + 1}</Label>
                                                    <Input placeholder="Escribe tu pregunta aquí..." value={q.text} onChange={e => updateQuestion(qIndex, 'text', e.target.value)} />
                                                </div>
                                                <div className="w-full sm:w-64 space-y-2">
                                                    <Label>Tipo de Respuesta</Label>
                                                    <select 
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                                                        value={q.typeId}
                                                        onChange={e => updateQuestion(qIndex, 'typeId', parseInt(e.target.value))}
                                                    >
                                                        <option value="1">Abierta (Texto)</option>
                                                        <option value="2">Opción Única</option>
                                                        <option value="3">Opción Múltiple</option>
                                                        <option value="4">Matriz (Única)</option>
                                                        <option value="5">Matriz (Múltiple)</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Options Editor */}
                                            {[2, 3, 4, 5].includes(q.typeId) && (
                                                <div className="pl-6 sm:pl-10 border-l-2 border-accent/20 space-y-3 mt-4">
                                                    <Label className="text-muted-foreground">Opciones de Respuesta (Filas)</Label>
                                                    {q.options.map((opt, oIndex) => (
                                                        <div key={oIndex} className="flex items-center gap-2">
                                                            <Input 
                                                                placeholder={`Opción ${oIndex + 1}`} 
                                                                value={opt.text} 
                                                                onChange={e => updateOption(qIndex, oIndex, 'text', e.target.value)} 
                                                                className="flex-1"
                                                            />
                                                            
                                                            {/* Image Preview / Upload */}
                                                            {opt.image ? (
                                                                <div className="relative w-10 h-10 border rounded overflow-hidden">
                                                                    <img src={opt.image} alt="Opción" className="w-full h-full object-cover" />
                                                                    <button 
                                                                        type="button"
                                                                        className="absolute top-0 right-0 bg-destructive/80 text-white rounded-bl-sm p-0.5 hover:bg-destructive"
                                                                        onClick={() => removeImage(qIndex, oIndex)}
                                                                        title="Quitar imagen"
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="relative">
                                                                    <Input 
                                                                        type="file" 
                                                                        accept="image/*" 
                                                                        className="absolute inset-0 opacity-0 cursor-pointer w-10 h-10 z-10" 
                                                                        title="Añadir imagen (Max 3MB)"
                                                                        onChange={e => {
                                                                            const file = e.target.files?.[0];
                                                                            if (file) handleImageUpload(qIndex, oIndex, file);
                                                                            e.target.value = ''; // reset
                                                                        }}
                                                                    />
                                                                    <Button variant="outline" size="icon" className="text-muted-foreground" type="button">
                                                                        <ImageIcon className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            )}

                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeOption(qIndex, oIndex)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                                        <Button variant="outline" size="sm" onClick={() => addOption(qIndex)} className="text-foreground hover:bg-accent/10 hover:text-accent font-medium">
                                                            <Plus className="h-4 w-4 mr-2" /> Añadir Opción
                                                        </Button>
                                                        <span className="text-xs text-muted-foreground ml-2">Atajos:</span>
                                                        <Button variant="secondary" size="sm" onClick={() => quickAddOptions(qIndex, 'yesno')} className="text-xs h-8">
                                                            Sí / No
                                                        </Button>
                                                        <Button variant="secondary" size="sm" onClick={() => quickAddOptions(qIndex, 'likert-text')} className="text-xs h-8">
                                                            Likert (Texto)
                                                        </Button>
                                                        {likertNumInput?.index === qIndex && !likertNumInput.isSubOption ? (
                                                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border border-border">
                                                                <span className="text-xs text-muted-foreground ml-1">0 a:</span>
                                                                <Input 
                                                                    type="number" 
                                                                    className="w-16 h-6 text-xs bg-background" 
                                                                    value={likertNumInput.max} 
                                                                    onChange={e => setLikertNumInput({...likertNumInput, max: e.target.value})} 
                                                                    min="1" max="100" 
                                                                />
                                                                <Button 
                                                                    variant="default" 
                                                                    size="sm" 
                                                                    className="h-6 px-2 text-xs"
                                                                    onClick={() => {
                                                                        quickAddOptions(qIndex, 'likert-num', parseInt(likertNumInput.max) || 5);
                                                                        setLikertNumInput(null);
                                                                    }}
                                                                >
                                                                    Crear
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-xs text-muted-foreground" onClick={() => setLikertNumInput(null)}><X className="h-3 w-3" /></Button>
                                                            </div>
                                                        ) : (
                                                            <Button variant="secondary" size="sm" onClick={() => setLikertNumInput({index: qIndex, max: '5', isSubOption: false})} className="text-xs h-8">
                                                                Likert (0-N)
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Matrix SubOptions Editor */}
                                            {[4, 5].includes(q.typeId) && (
                                                <div className="pl-6 sm:pl-10 border-l-2 border-primary/20 space-y-3 mt-4">
                                                    <Label className="text-muted-foreground">SubOpciones (Columnas de la Matriz)</Label>
                                                    {q.subOptions.map((sub, sIndex) => (
                                                        <div key={sIndex} className="flex items-center gap-2">
                                                            <Input 
                                                                placeholder={`Fila ${sIndex + 1}`} 
                                                                value={sub.text} 
                                                                onChange={e => updateSubOption(qIndex, sIndex, e.target.value)} 
                                                                className="flex-1"
                                                            />
                                                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeSubOption(qIndex, sIndex)}>
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                    <div className="flex flex-wrap items-center gap-2 pt-2">
                                                        <Button variant="outline" size="sm" onClick={() => addSubOption(qIndex)} className="text-foreground hover:bg-primary/10 hover:text-primary font-medium">
                                                            <Plus className="h-4 w-4 mr-2" /> Añadir Columna
                                                        </Button>
                                                        <span className="text-xs text-muted-foreground ml-2">Atajos:</span>
                                                        <Button variant="secondary" size="sm" onClick={() => quickAddSubOptions(qIndex, 'likert-text')} className="text-xs h-8">
                                                            Likert (Texto)
                                                        </Button>
                                                        {likertNumInput?.index === qIndex && likertNumInput.isSubOption ? (
                                                            <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-md border border-border">
                                                                <span className="text-xs text-muted-foreground ml-1">0 a:</span>
                                                                <Input 
                                                                    type="number" 
                                                                    className="w-16 h-6 text-xs bg-background" 
                                                                    value={likertNumInput.max} 
                                                                    onChange={e => setLikertNumInput({...likertNumInput, max: e.target.value})} 
                                                                    min="1" max="100" 
                                                                />
                                                                <Button 
                                                                    variant="default" 
                                                                    size="sm" 
                                                                    className="h-6 px-2 text-xs"
                                                                    onClick={() => {
                                                                        quickAddSubOptions(qIndex, 'likert-num', parseInt(likertNumInput.max) || 5);
                                                                        setLikertNumInput(null);
                                                                    }}
                                                                >
                                                                    Crear
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-xs text-muted-foreground" onClick={() => setLikertNumInput(null)}><X className="h-3 w-3" /></Button>
                                                            </div>
                                                        ) : (
                                                            <Button variant="secondary" size="sm" onClick={() => setLikertNumInput({index: qIndex, max: '5', isSubOption: true})} className="text-xs h-8">
                                                                Likert (0-N)
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <Button variant="outline" className="w-full border-dashed border-2 py-8 text-muted-foreground hover:text-foreground hover:border-foreground transition-colors" onClick={addQuestion}>
                <Plus className="h-6 w-6 mr-2" />
                Agregar Pregunta
            </Button>

            <div className="flex justify-end pt-6">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8" onClick={handleSubmit} disabled={isPending}>
                    {isPending ? 'Guardando...' : 'Guardar y Publicar Encuesta'}
                </Button>
            </div>
        </div>
    );
}
