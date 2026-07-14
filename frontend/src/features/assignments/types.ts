
export interface Assignment {
    id: number;
    surveyId: number;
    userId: number;
    womenCount: number;
    menCount: number;
    survey?: { title: string };
}

export interface SurveyorProgress {
    men: number;
    women: number;
}

export interface SurveyorWithAssignment {
    id: number;
    username: string;
    name: string;
    assignment: Assignment | null;
    progress: SurveyorProgress;
}
