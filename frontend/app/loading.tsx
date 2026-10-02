import Loading from "@/componenets/Loading";

/** Root fallback so public pages (landing, login, signup) never show a blank screen while loading. */
export default function RootLoading() {
    return <Loading />;
}
