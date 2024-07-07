import {useContext} from "react";
import {ApiContext} from "./ApiContextProvider.tsx";

export function useApi(){
    return useContext(ApiContext);
}