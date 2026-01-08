import api from "./api";
import { NomenVerb } from "@/types/nomenVerb"

export const getNomenVerbs = async () => {
    return  await api.get<NomenVerb[]>("/nomen-verb");
}
