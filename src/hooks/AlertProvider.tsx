import {createContext, ReactNode, useState} from "react";
import {Snackbar} from "@mui/material";

export const AlertContext = createContext<{
    setAlert: (alert: string) => void,
}>({
    setAlert: () => {},
});

export function AlertContextProvider({children}: {children: ReactNode}) {
    const [activeAlert, setActiveAlert] = useState<string | null>(null)
    const [activeTimeOut, setActiveTimeOut] = useState<NodeJS.Timeout | null>(null)
    function setAlert(alert: string): void {
        if(activeTimeOut) {
            clearTimeout(activeTimeOut)
            setActiveTimeOut(null)
        }
        setActiveAlert(alert)
        setActiveTimeOut(setTimeout(() => {
            setActiveAlert(null)
        }, 5000))
    }

    function handleClose() {
        if(activeTimeOut) {
            clearTimeout(activeTimeOut)
            setActiveTimeOut(null)
        }
        setActiveAlert(null)
    }

    return (
        <AlertContext.Provider value={{setAlert}}>
            <Snackbar
                open={!!activeAlert}
                autoHideDuration={5000}
                onClose={handleClose}
                message={activeAlert}
            />
            {children}
        </AlertContext.Provider>
    )
}
