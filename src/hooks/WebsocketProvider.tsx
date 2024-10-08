import {createContext, ReactNode, useEffect, useState} from "react";
import {io, Socket} from 'socket.io-client';
import {useAuth0} from "@auth0/auth0-react";

export const WebsocketContext = createContext<Socket | null>(null)

export default function WebsocketProvider({children}: {children: ReactNode}) {
    const [socket, setSocket] = useState<Socket | null>(null)
    const {getAccessTokenSilently} = useAuth0()
    useEffect(() => {
        if(socket) {
            return
        }
        async function connectToSocket() {
            const token = await getAccessTokenSilently()
            console.log('trying to connect')
            const uuid = 'fleet' + '-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            })
            const newSocket = io(import.meta.env.VITE_DLC_SOCKET_URL, {auth: {uuid: uuid , token: token}})
            setSocket(newSocket);

            newSocket.on("connect", () => {
                console.log("wsocket listener connected")
            });

            newSocket.on("disconnect", (reason: string) => {
                console.log("wsocket listener disconnected!");
                if (reason === "io server disconnect") {
                    // the disconnection was initiated by the server, you need to reconnect manually
                    console.log("reconnecting...");
                    newSocket.connect();
                }
            });
        }
        connectToSocket()
    }, [socket]);

    return <WebsocketContext.Provider value={socket}>
        {children}
    </WebsocketContext.Provider>
}