import SearchParamsSuspense from "@/componenets/SearchParamsSuspense";
import SignupClient from "./SignupClient";

export default function Page() {
    return (
        <SearchParamsSuspense fallback={<div>Loading signup...</div>}>
            <SignupClient />
        </SearchParamsSuspense>
    );
}
