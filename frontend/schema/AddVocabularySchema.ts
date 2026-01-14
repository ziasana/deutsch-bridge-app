import {z} from 'zod';
export const AddVocabularySchema = z.object({
    word: z
        .string()
        .min(2, 'Word must be at least 2 characters'),
    example: z
        .string(),
    meaning: z
        .string('Meaning is required')
});

export type AddVocabularyFormData = z.infer<typeof AddVocabularySchema>;
