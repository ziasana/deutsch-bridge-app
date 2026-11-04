import AuthFormSkeleton from "@/componenets/AuthFormSkeleton";
import SearchParamsSuspense from "@/componenets/SearchParamsSuspense";
import SignupClient from "./SignupClient";

export default function Page() {
    return (
        <SearchParamsSuspense fallback={<AuthFormSkeleton fields={5} />}>
            <SignupClient />
        </SearchParamsSuspense>
    );
}
