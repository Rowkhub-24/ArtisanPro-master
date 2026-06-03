export interface Quiz {
    id: number;
    id_formation: number;
    question: string;
    reponses: string[]; // array of answer choices
    // NOTE: bonne_reponse is NOT exposed to the frontend (security)
}

export interface QuizResult {
    score: number; // 0 or 100
    correct: boolean;
    bonne_reponse: number; // index of correct answer (revealed after submission)
}

export interface Formation {
    id: number;
    titre: string;
    description: string | null;
    url_contenu: string | null;
    pivot?: {
        date_achevement: string | null;
        score_quiz: number | null;
        tentatives: number;
    };
    quiz?: Quiz[];
}

export interface Parcours {
    id: number;
    titre: string;
    description: string | null;
    points_bonus: number;
    formations: Formation[];
    pivot?: {
        date_completion: string | null;
        points_attribues: number;
    };
}
