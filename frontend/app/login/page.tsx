import AuthFormSkeleton from "@/componenets/AuthFormSkeleton";
import SearchParamsSuspense from "@/componenets/SearchParamsSuspense";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
      <SearchParamsSuspense fallback={<AuthFormSkeleton fields={2} />}>
        <LoginClient />
      </SearchParamsSuspense>
  );
}
