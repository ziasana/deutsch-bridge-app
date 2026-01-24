"use client";

import { useEffect, useState } from "react";
import { getNomenVerbs } from "@/services/nomenVerbService";
import { NomenVerb } from "@/types/nomenVerb";
import Loading from "@/componenets/Loading";
import {LearningProgressRequest} from "../../../../types/nomenVerb";
import {setLearningProgress} from "../../../../services/nomenVerbService";

export default function NomenVerbAccordionDemo() {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [openId, setOpenId] = useState<string | number | null>(null);
  const [page, setPage] = useState(1);

  const [nomenVerbs, setNomenVerbs] = useState<NomenVerb[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNomenVerbs()
      .then((response) => {
            setNomenVerbs(response.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const ITEMS_PER_PAGE = 10;

  // Extract all tag categories for dropdown
  const allTags = Array.from(
    new Set(
      nomenVerbs.flatMap((item) => item.tags.split(",").map((t) => t.trim()))
    )
  );

  // FILTERING
  const filteredData = nomenVerbs
    .filter((item) => item.word.toLowerCase().includes(search.toLowerCase()))
    .filter((item) =>
      levelFilter === "ALL" ? true : item.level === levelFilter
    )
    .filter((item) =>
      tagFilter === "ALL"
        ? true
        : item.tags
            .split(",")
            .map((t) => t.trim())
            .includes(tagFilter)
    );

  // PAGINATION
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? null : id);
  };
  const markAsLearned = (id: string, isLearned:boolean) => {
    const request:LearningProgressRequest ={
      nomenVerbId: id,
      learned: isLearned
    }
    setLoading(true);
    setLearningProgress(request)
        .then((response) => {
          // Optimistic update
          if(response.status==201)
          setNomenVerbs((prev) =>
              prev.map((nv) => {
                if (nv.id !== id) return nv;
                return {
                  ...nv,
                  learningProgresses: [
                    {
                      learned: isLearned,
                    },
                  ],
                };
              })
          );
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Nomen-Verb-Verbindungen
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">
            Browse and explore entries with filtering.
          </p>
        </header>

        {/* Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search */}
            <input
              type="text"
              placeholder="Suche..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />

            {/* Level Filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ALL">Alle Level</option>
              <option value="B1">B1</option>
              <option value="B2">B2</option>
              <option value="C1">C1</option>
              <option value="C2">C2</option>
            </select>

            {/* Tag Filter */}
            <select
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ALL">Alle Tags</option>
              {allTags.map((tag, idx) => (
                <option key={idx} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Accordion list */}
          <div className="max-h-[600px] overflow-y-auto space-y-2">
            {paginatedData.length > 0 ? (
              paginatedData.map((item) => {
                const isLearned = item.learningProgresses?.some(
                    (lp) => lp.learned == true
                );
                return(
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-700"
                >
                  <button
                    className="w-full text-left px-4 py-3 flex justify-between items-center font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                    onClick={() => toggleAccordion(item.id)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 dark:text-white">
                        {item.word}
                      </span>

                      {isLearned ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      ✓ Learned
                        </span>
                      ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300">
                        Not learned
                      </span>
                      )}
                    </div>

                    <span className="text-sm text-gray-500 dark:text-gray-300">
                      {item.level}
                    </span>
                  </button>

                  {openId === item.id && (
                    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 space-y-2">
                      <span>
                        {item.explanation.split("\n").map((line, index) => {
                          // Trim whitespace
                          const trimmedLine = line.trim();

                          // Check if the line is a title (Grammatik or Häufige Fehler)
                          const isTitle =
                            trimmedLine.startsWith("Grammatik:") ||
                            trimmedLine.startsWith("Häufige Fehler:") ||
                            trimmedLine.endsWith(":");

                          return (
                            <p key={index} className="pt-1">
                              {isTitle ? (
                                <strong>{trimmedLine}</strong>
                              ) : (
                                trimmedLine
                              )}
                            </p>
                          );
                        })}
                      </span>
                      <p className="pt-4">
                        <strong>Beispiele:</strong>
                      </p>
                      {item.example.split("\n").map((ex, idx) => (
                        <p key={idx}>- {ex}</p>
                      ))}

                      <p className="text-sm pt-3 text-gray-500 dark:text-gray-400">
                        <strong>Tags:</strong> {item.tags}
                      </p>

                      <button
                          onClick={() => markAsLearned(item.id, !isLearned)}
                          className="mt-4 px-3 py-1 text-sm rounded bg-blue-600 text-white hover:bg-blue-700"
                      >
                        {isLearned ? "Mark as not learned" : "Mark as learned"}
                      </button>

                    </div>
                  )}
                </div>
                )}
              )
            ) : (
              <p className="text-center text-gray-400">Keine Ergebnisse.</p>
            )}

          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
              >
                Zurück
              </button>

              <span className="text-gray-700 dark:text-gray-300">
                Seite {page} / {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700"
              >
                Weiter
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
