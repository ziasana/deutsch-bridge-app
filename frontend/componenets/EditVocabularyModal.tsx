"use client";
import { useEffect } from "react";
import { updateVocabulary } from "@/services/vocabularyService";
import {UpdateVocabularyType, VocabularyType} from "@/types/vocabulary";
import {toast} from "react-toastify";
import {useForm} from "react-hook-form";
import {AddVocabularyFormData, AddVocabularySchema} from "@/schema/AddVocabularySchema";
import {zodResolver} from "@hookform/resolvers/zod";
import {useFormErrorToast} from "@/hook/useFormErrorToast";
import {useI18n} from "@/componenets/I18nProvider";
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
  const { t } = useI18n();
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
        toast.success(t.vocabulary.editModal.saved)
        onSave(response.data.data); // Parent receives updated record
      })
        .catch((err) => {
              console.error(err)
              toast.error(err?.response?.data?.message ?? t.vocabulary.editModal.updateFailed)
            }
        );
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-xl font-bold mb-4">{t.vocabulary.editModal.title}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">{t.vocabulary.editModal.word} <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
              {...register("word")}
              placeholder={t.vocabulary.editModal.word}
            />
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">{t.vocabulary.editModal.meaning} <input
              className="w-full mt-1 p-2 border rounded dark:bg-gray-700 dark:text-white"
              {...register("meaning")}
              placeholder={t.vocabulary.editModal.meaning}
            />
            </label>
          </div>
          <div>
            <label className="text-sm font-medium">{t.vocabulary.editModal.example} <textarea
                className="w-full mt-1 p-2 border rounded h-25 dark:bg-gray-700"
                {...register("example")}
                placeholder={t.vocabulary.editModal.example}
            /></label>

          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            {t.vocabulary.editModal.cancel}
          </button>

          <button
            type={"submit"}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {t.vocabulary.editModal.save}
          </button>
        </div>
        </form>
      </div>
    </div>
  );
}
