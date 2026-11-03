import { ReadingArticleSkeleton } from "@/componenets/reading/ReadingSkeletons";

/** Shown by Next while a reading route's code arrives (list, article, review) instead of a full-screen loader. */
export default function ReadingLoading() {
    return <ReadingArticleSkeleton />;
}
