"use client";
import {addVocabulary, generateAiExample} from "@/services/vocabularyService";
import {AddVocabularyType, GenerateAiWordType} from "@/types/vocabulary";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {AddVocabularyFormData, AddVocabularySchema} from "@/schema/AddVocabularySchema";
import {useFormErrorToast} from "@/hook/useFormErrorToast";
import {useState} from "react";

interface VocabularyProps {
    isOpen: boolean; // Modal open/close state
    onClose: () => void; // Closes the modal
    onSave: (saved: string) => void;
}

export default function AddVocabularyModal({
                                               isOpen,
                                               onClose,
                                               onSave,
                                           }: Readonly<VocabularyProps>) {
    const defaultValues = {
        word: "",
        example: "",
        meaning: ""
    }
    const [loading, setLoading] = useState(false);
    const {
        register,
        watch,
        setValue,
        handleSubmit,
        reset,
        formState: {errors, isSubmitted},
    } = useForm<AddVocabularyFormData>({
        resolver: zodResolver(AddVocabularySchema),
        defaultValues: defaultValues,
        mode: "onSubmit", // validate on submit
    });
    useFormErrorToast(errors, isSubmitted);

    if (!isOpen) return null;

    const onSubmit = async (data: AddVocabularyFormData) => {
        //Save to DB here
        const addData: AddVocabularyType = {
            word: data.word,
            example: data.example,
            meaning: data.meaning
        }
        addVocabulary(addData)
            .then(() => {
                onSave("saved"); // Parent receives updated record
                toast.success("Vocabulary saved!")
                reset(defaultValues);
                onClose();
            })
            .catch((err) => {
                    console.error(err)
                    toast.error(err?.response.data.message)
                }
            );
    };
    const handleGenerateAiExample = () => {
        if (watch("word") == "") {
            toast.warning("Word is required");
            return;
        }
        setLoading(true);
        const requestData: GenerateAiWordType = {
            word: watch("word")
        }
        generateAiExample(requestData)
            .then((response) => {
                toast.success(response?.data.word);
                setValue("example", response?.data.word)
            })
            .catch((err) => {
                    console.error(err)
                    toast.error(err?.response.data.message)
                }
            ).finally(() => setLoading(false));
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
                <h2 className="text-xl font-bold mb-4">Add New Vocabulary</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Word <input
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
                                {...register("word")}
                                placeholder="Word"
                            />
                            </label>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Meaning <input
                                className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
                                {...register("meaning")}
                                placeholder="Meaning"
                            />
                            </label>
                        </div>
                        <div>
                            <div className="mb-1 flex items-center justify-between">
                                <label className="text-sm font-medium">
                                    Example <button
                                    type="button"
                                    onClick={handleGenerateAiExample}
                                    className="flex items-center gap-1 cursor-pointer text-sm font-medium text-blue-500 hover:text-blue-600"
                                >
                                    <span>✨</span>
                                    <span> {loading ? "Generating..." : "Generate"}</span>
                                </button>
                                </label>
                            </div>

                            <textarea
                                className="w-full rounded border h-25 p-2 dark:bg-gray-700"
                                {...register("example")}
                                placeholder="Example"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
