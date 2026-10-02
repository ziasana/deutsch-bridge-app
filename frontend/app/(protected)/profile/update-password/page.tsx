import { redirect } from "next/navigation";

/** Updating the password is a dialog in the user menu now; old links and bookmarks land on the profile. */
export default function UpdatePasswordRedirect() {
    redirect("/profile");
}
