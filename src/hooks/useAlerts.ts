import {useContext} from "react";
import {AlertContext} from "./AlertProvider.tsx";

export function useAlerts(){
    return useContext(AlertContext);
}