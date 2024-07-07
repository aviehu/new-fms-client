import {useContext} from "react";
import {WebsocketContext} from './WebsocketProvider.tsx'

export function useWebSocket(){
    return useContext(WebsocketContext);
}