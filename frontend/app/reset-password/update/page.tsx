import SearchParamsSuspense from "@/componenets/SearchParamsSuspense";
import UpdateClient from "./UpdateClient";

export default function Page() {
    return (
        <SearchParamsSuspense fallback={<div>Loading update...</div>}>
            <UpdateClient />
        </SearchParamsSuspense>
    );
}
