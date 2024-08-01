
export const DEFAULT_SOCKET_PORT = 9123;

export const SOCKET_STATES = { disconnected: "Disconnected", conncted: "Connected", error: "Error" }
function isValidUrl(url: string) {
    return url.includes('://');
}

export function Socket() {

    let socket: WebSocket | null = null
    let askedDisconnect = false;
    function getSocketUrl(url: string, port: number) {
        if (isValidUrl(url)) {
            return url;
        }
        return window.location.hostname === "localhost" ?
            "ws://" +  url + ":" + port :
            "wss://" + url ;
    }
    return {
        connect: function (url: string, port: number = DEFAULT_SOCKET_PORT, stateCallback: any, metaCallback: any) {
            const connectionString = getSocketUrl(url, port)
            console.log("connecting socket")
            socket = new WebSocket(connectionString)
            socket.onopen = function () {
                stateCallback(SOCKET_STATES.conncted)
            };
            socket.onclose = function () {
                console.log("onclose socket")
                socket = null;
                if (!askedDisconnect)
                    stateCallback(SOCKET_STATES.disconnected)
            };

            socket.onerror = function () {
                socket = null;
                console.log("onerror socket")
                stateCallback(SOCKET_STATES.error)
            };

            socket.onmessage = function (message) {
                metaCallback(JSON.parse(message.data))
            }
        },
        disconnect: function () {
            askedDisconnect = true;
            if (!socket) {
                return
            }
            socket.close();
        },
        send: function (data: any) {
            if (socket)
                socket.send(JSON.stringify(data));
        },
        isConnected: function () {
            return socket && socket.readyState === WebSocket.OPEN
        }
    }
};
