"use client";
import { useEffect } from "react";
import { updateVocabulary } from "@/services/vocabularyService";
import {UpdateVocabularyType, VocabularyType} from "@/types/vocabulary";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {AddVocabularyFormData, AddVocabularySchema} from "@/schema/AddVocabularySchema";
import {zodResolver} from "@hookform/resolvers/zod";
import {useFormErrorToast} from "@/hook/useFormErrorToast";
interface VocabularyProps {
  isOpen: boolean; // Modal open/close state
  onClose: () => void; // Closes the modal
  word: VocabularyType | null;
  onSave: (updated: VocabularyType) => void;
}
export default function EditVocabularyModal({
  isOpen,
  onClose,
  word,
  onSave,
}: Readonly<VocabularyProps>) {
  const defaultValues = {
    word: "",
    example: "",
    meaning: ""
  }

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitted },
  } = useForm<AddVocabularyFormData>({
    resolver: zodResolver(AddVocabularySchema),
    defaultValues: defaultValues,
    mode: "onSubmit", // validate on submit
  });

  useFormErrorToast(errors, isSubmitted);

  // Load selected word into inputs
  useEffect(() => {
    if (!word) return;

    reset({
      word: word.word ?? "",
      example: word.example ?? "",
      meaning: word.vocabularyContents?.[0]?.meaning ?? ""
    });
  }, [word, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: AddVocabularyFormData) => {
    //save to db
    const updateData: UpdateVocabularyType = {
      id: word?.id,
      word: data.word,
      example: data.example,
      meaning: data.meaning
    }

    updateVocabulary(updateData)
      .then((response) => {
        toast.success("Vocabulary edited!")
        onSave(response.data.data); // Parent receives updated record
      })
        .catch((err) => {
              console.error(err)
              toast.error(err?.response.data.message)
            }
        );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">Edit Vocabulary</h2>
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
            <label className="text-sm font-medium">Example <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
              {...register("example")}
              placeholder="Example"
            />
            </label>
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
            type={"submit"}
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
