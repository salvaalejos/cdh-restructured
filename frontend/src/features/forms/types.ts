export interface SubOption {
    id?: number;
    questionId?: number;
    text: string;
}

export interface Option {
    id?: number;
    questionId?: number;
    text: string;
    image?: string | null;
}

export interface Question {
    id?: number;
    surveyId?: number;
    text: string;
    typeId: number; // 1=open, 2=single, 3=multiple, 4=matrix_single, 5=matrix_multiple
    options?: Option[];
    subOptions?: SubOption[];
}

export interface Survey {
    id: number;
    title: string;
    description: string;
    createdAt: string;
    location?: string | null;
    status: number;
    questions?: Question[];
    _count?: {
        questions: number;
        respondents: number;
    };
}
