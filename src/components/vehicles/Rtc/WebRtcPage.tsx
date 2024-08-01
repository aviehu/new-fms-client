import { useSearchParams} from "react-router-dom"
import {useEffect, useState} from "react"
import { Socket, SOCKET_STATES, DEFAULT_SOCKET_PORT } from './controller/RtcSocket.ts'
import {useWebSocket} from "../../../hooks/useWebSocket.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import JanusClient from './janus/janusClient'
import NodeApi from './nodeApi'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Controller from  './controller/controller'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Stream from './WebRtcStream.jsx'
import './WebRtc.css';


type MetaData = {
    battery: number,
    temperature: number,
    speed: number,
    heading: string,
    lightsState: string,
    lockingState: string,
    ebrake: string,
    behaviourID: string
}

const socket = Socket()

function isValidUrl(url: string | undefined) {
    if (!url) {
        return false
    }
    return url.includes('://')
}

const isLocal = window.location.hostname === "localhost"
const protocol = isLocal ? "http://" : "https://"



export default function WebRtcPage() {
    const [searchParams] = useSearchParams()
    const node_uuid = searchParams.get("node_uuid")
    const rtc_url = searchParams.get("rtc_https_url") || ''
    const hostId = searchParams.get("vin")
    const node_url = searchParams.get("node_https_url") || ''
    const node_socket_url = searchParams.get("node_wss_url")
    const control = searchParams.get("control") === 'true'
    const picassoWsUrl = searchParams.get("picassoWsUrl")
    const updateSocket = useWebSocket();
    const [serverReady, setServerReady] = useState(false);
    const [webRtcUrl, setwebRtcUrl] = useState<string | null>(null);
    const [nodeUrl, setNodeUrl] = useState<string | null>(null);
    const [streams, setStreams] = useState<any[]>([]);
    const [socketState, setSocketState] = useState(SOCKET_STATES.disconnected);
    const [joystickData, setjoystickData] = useState<any>(null);
    const [nodeConnected, setNodeConnected] = useState<boolean>(false);
    const [metaData, setMetaData] = useState< MetaData | null>(null);
    const [inControl, setInControl] = useState(false);

    function getRtcUrl() {
        if (isValidUrl(rtc_url)) {
            return rtc_url;
        }
        return protocol + rtc_url + "/"
    }
    function getNodeUrl() {
        if (isValidUrl(node_url)) {
            return node_url;
        }
        return protocol + node_url + ""
    }

    useEffect(() => {
        if(rtc_url) {
            let janus: any
            let controller: any

            // eslint-disable-next-line no-inner-declarations
            async function initJanus() {
                const rtcurl = getRtcUrl();
                const nodeurl = getNodeUrl();
                setwebRtcUrl(rtcurl || null);
                setNodeUrl(nodeurl || null);
                janus = new JanusClient(rtcurl)
                janus.subscribe("connected", () => {
                    setServerReady(true);
                });
                janus.subscribe("error", () => {
                    setServerReady(false);
                });
                janus.subscribe("attached", () => {
                    janus.updateStreamsList()
                });
                janus.subscribe("streams", (streams: any) => {
                    setStreams(streams)
                });
                janus.startClient();
                updateSocket?.on('controlState', controlListener)
                const api = NodeApi(nodeurl || '');
                if (control) {
                    api.closeNode();
                    setTimeout(()=> connectSocket(node_socket_url || '', DEFAULT_SOCKET_PORT), 2500)
                    controller = Controller(setjoystickData);
                    return
                }
                setTimeout(() => {
                    api.idrOnNextFrame()
                }, 2000)
            }
            initJanus()
            return () => {
                janus ? janus.closeClient() : null;
                disconnectSocket();
                controller ? controller.shutdown() : null;
                updateSocket ? updateSocket.removeListener('controlState') : null
            }
        }
    }, []);

    useEffect(() => {
        if (!node_url) {
            return;
        }
        const nodeurl = getNodeUrl();
        const api = NodeApi(nodeurl || '');
        async function pingNode() {
            try {
                const pingResult = await api.pingNode();
                if (pingResult.status !== 200) {
                    throw new Error();
                }
                setNodeConnected(true)
            } catch {
                setNodeConnected(false)
            }
        }
        const intervalRef = setInterval(pingNode, 1000);
        return () => clearInterval(intervalRef);
    }, [node_url])

    const controlListener = function(data: {uuid: string, controlState: string}) {
        if (node_uuid && data.uuid === node_uuid && data.controlState === "Monitor") {
            setInControl(false)
        }
    }

    useEffect(() => {
        if (socket.isConnected())
            socket.send({ type: "control", state: joystickData });
    }, [joystickData]);

    function updateSocketState(state: string) {
        console.log(state)
        setSocketState(state);
        if(state === SOCKET_STATES.conncted) {
            setInControl(true)
            console.log('client moved to in control')
            return
        }
        if(inControl) {
            console.log('client moved to monitor')
        }
        setInControl(false)
    }

    function connectSocket(url: string, port: number) {
        socket.connect(url, port, updateSocketState, setMetaData);
    }

    function disconnectSocket() {
        socket && socket.isConnected() ? socket.disconnect() : null;
    }

    return (
        <div >
            {
                !serverReady ?
                    (
                        <div>NO RTC AVAILABLE</div>
                    ) :
                    (
                        <div className="vCenterItems-webrtc">
                            {
                                streams.length > 0 ?
                                    <Stream
                                        hostId={hostId}
                                        metaData={metaData}
                                        joystickData={joystickData}
                                        key={streams[0].id}
                                        stream={streams[0]}
                                        url={webRtcUrl}
                                        node={nodeUrl}
                                        control={control ? inControl : control}
                                        picassoWsUrl={picassoWsUrl}
                                        socketState={socketState}
                                        nodeConnected={nodeConnected}
                                    /> : null
                            }
                        </div>
                    )
            }
        </div>
    );
}