import {createContext, ReactNode, useEffect, useState} from "react";
import {io, Socket} from 'socket.io-client';

export const WebsocketContext = createContext<Socket | null>(null)

export default function WebsocketProvider({children}: {children: ReactNode}) {
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        if(socket) {
            return
        }
        console.log('trying to connect')
        const uuid = 'fleet' + '-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        })
        const newSocket = io('http://localhost:8040', {auth: {uuid: uuid , token: 'AAA'}})
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
    }, [socket]);

    return <WebsocketContext.Provider value={socket}>
        {children}
    </WebsocketContext.Provider>
}