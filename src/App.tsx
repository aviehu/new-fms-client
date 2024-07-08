import {ApiContextProvider} from "./hooks/ApiContextProvider.tsx";
import { CssBaseline } from "@mui/material";
import {
    createBrowserRouter,
    RouterProvider,
} from "react-router-dom";
import VehiclesPage from "./components/vehicles/VehiclesPage.tsx";
import CustomAppBar from "./components/CustomAppBar.tsx";
import WebsocketProvider from "./hooks/WebsocketProvider.tsx";
import { useAuth0 } from '@auth0/auth0-react';
import LoginPage from "./components/LoginPage.tsx";
import LoadingPage from "./components/LoadingPage.tsx";
import {AlertContextProvider} from "./hooks/AlertProvider.tsx";
import SettingsPage from "./components/settings/SettingsPage.tsx";
import WebRtcPage from "./components/vehicles/Rtc/WebRtcPage.tsx";
import NotFoundPage from "./components/NotFoundPage.tsx";

function App() {

    const {isAuthenticated, isLoading} = useAuth0()

    if(isLoading) {
        return <LoadingPage />
    }

    if(!isAuthenticated) {
        return <LoginPage/>
    }

    const router = createBrowserRouter([
        {
            path: "/",
            element: <CustomAppBar><VehiclesPage/></CustomAppBar>,
        },
        {
            path: "/settings",
            element: <CustomAppBar><SettingsPage/></CustomAppBar>,
        },
        {
            path: "/stream/:rtc_url/:hostId/:node_url/:node_socket_url/:description/:control/:mobile/:picassoWsUrl/:node_uuid",
            element: <WebRtcPage/>,
        },
        {
            path: '*',
            element: <NotFoundPage/>
        }
    ]);

    return (
        <AlertContextProvider>
            <WebsocketProvider>
                <ApiContextProvider>
                    <CssBaseline/>
                    <RouterProvider router={router} />
                </ApiContextProvider>
            </WebsocketProvider>
        </AlertContextProvider>
    )
}

export default App
