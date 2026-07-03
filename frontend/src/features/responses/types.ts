import type { PaginatedResponse } from '../../users/types';

export interface Respondent {
    id: number;
    surveyorId: number;
    surveyId: number;
    age: number | null;
    gender: string | null;
    schooling: string | null;
    latitude: number | null;
    longitude: number | null;
    image: string | null;
    audio: string | null;
    surveyor?: {
        name: string;
        username: string;
    };
}

export interface Answer {
    id: number;
    respondentId: number;
    questionId: number;
    optionId: number | null;
    subOptionId: number | null;
    openText: string | null;
    question: {
        id: number;
        text: string;
        typeId: number;
    };
    option?: {
        id: number;
        text: string;
    };
    subOption?: {
        id: number;
        text: string;
    };
}

export interface RespondentDetails extends Respondent {
    survey: {
        title: string;
        description: string;
        location: string | null;
        questions: {
            id: number;
            text: string;
            typeId: number;
            options: { id: number; text: string }[];
            subOptions: { id: number; text: string }[];
        }[];
    };
    answers: Answer[];
}

export interface MapPin {
    id: number;
    latitude: number;
    longitude: number;
    surveyor?: {
        name: string;
    };
}

export interface ResponsesResponse extends PaginatedResponse<Respondent> {
    mapData: MapPin[];
}
