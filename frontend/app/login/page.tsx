import SearchParamsSuspense from "@/componenets/SearchParamsSuspense";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
      <SearchParamsSuspense fallback={<div>Loading login...</div>}>
        <LoginClient />
      </SearchParamsSuspense>
  );
}
