import {useParams} from "react-router-dom"
import {useEffect, useState} from "react"
import { Socket, SOCKET_STATES, DEFAULT_SOCKET_PORT } from './RtcSocket.ts'
import {useWebSocket} from "../../../hooks/useWebSocket.ts";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import JanusClient from './janusClient'
import NodeApi from './nodeApi'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import Controller from  './controller'
import {Button} from "@mui/material";

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



export default function WebRtc() {
    const {node_uuid, rtc_url, hostId, node_url, node_socket_url, description, control, mobile, picassoWsUrl} = useParams()
    const updateSocket = useWebSocket();
    const [serverReady, setServerReady] = useState(false);
    const [webRtcUrl, setwebRtcUrl] = useState<string | null>(null);
    const [nodeUrl, setNodeUrl] = useState<string | null>(null);
    const [streams, setStreams] = useState<any[]>([]);
    const [socketState, setSocketState] = useState(SOCKET_STATES.disconnected);
    const [joystickData, setjoystickData] = useState(null);
    const [nodeConnected, setNodeConnected] = useState<boolean>(false);
    const [metaData, setMetaData] = useState< MetaData | null>(null);
    const [inControl, setInControl] = useState(false);
    const [showGamePadDialog, setShowGamePadDialog] = useState(false);

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
        <div className="App">
            <div>
                <h2>{hostId + " :: " + description}</h2>
            </div>
            {
                !serverReady ?
                    (
                        <div>NO RTC AVAILABLE</div>
                    )
                    :
                    (
                        <div>
                            <div className="vCenterItems-webrtc">
                                {
                                    streams.map((stream) =>{
                                        return <Stream key={stream.id} stream={stream} url={webRtcUrl} node={nodeUrl} control={control ? inControl : control} picassoWsUrl={picassoWsUrl}/>
                                    })
                                }
                            </div>
                            <br></br>
                            {
                                streams.length === 0 || control === 'false' || !inControl ?
                                    // null :
                                    <div className="hCenterItems2-webrtc" style={{minHeight: "145px"}}>
                                        <b>Metrics</b>
                                        <div className="hCenterItems-webrtc">
                                            <div className="vCenterItems-webrtc">
                                                <div>Battery:</div>
                                                <div>{metaData ? metaData.battery : "N/A"}</div>
                                            </div>
                                            <div>
                                                <b>Motor temp:</b>
                                                <b>{metaData ? metaData.temperature : "N/A"}</b>
                                            </div>
                                            <div>
                                                <b>Speed:</b>
                                                <b>{metaData ? metaData.speed : "N/A"}</b>
                                            </div>
                                        </div>
                                    </div>
                                    :
                                    <div className="vCenterItems-webrtc">
                                        <div className="hCenterItems2-webrtc" style={{minHeight: "145px"}}>
                                            <b>Control</b>
                                            <div className="hCenterItems-webrtc">
                                                <div style={{color: joystickData ? "#37CE37" : "red"}}>{joystickData ? ((socket.isConnected() ? "Transmitting data" : "Joystick detected")) : "Joystick not detected"}</div>
                                                {
                                                    joystickData ?
                                                        <div className="hCenterItems-webrtc">
                                                            <div>
                                                                <b>{joystickData.axes.toString()}</b>
                                                            </div>
                                                            <div>
                                                                <b>{joystickData.buttons.toString(2)}</b>
                                                            </div>
                                                        </div>
                                                        :
                                                        null
                                                }
                                                <GamepadSettingsModal open={showGamePadDialog} onClose={() => setShowGamePadDialog(false)} />
                                                <Button variant="contained" size={"small"} onClick={() => setShowGamePadDialog(true)}>Gamepad Settings</Button>
                                            </div>
                                        </div>
                                        <div className="hCenterItems2-webrtc" style={{minHeight: "145px"}}>
                                            <b>Socket</b>
                                            <b style={{color: socket.isConnected() ? "#37CE37" : "red"}}>{socketState}</b>
                                            <b>Node</b>
                                            <b style={{color: nodeConnected ? "#37CE37" : "red"}}>{nodeConnected ? 'Online' : 'Offline'}</b>
                                        </div>
                                        <div className="hCenterItems2-webrtc" style={{minHeight: "145px"}}>
                                            <b>Metrics</b>
                                            <div className="vCenterItems-webrtc">
                                                <div className="hCenterItems-webrtc">
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Battery: </div>
                                                        <div>{metaData ? metaData.battery : "N/A"}</div>
                                                    </div>
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Motor temp: </div>
                                                        <div>{metaData ? metaData.temperature : "N/A"}</div>
                                                    </div>
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Speed: </div>
                                                        <div>{metaData ? metaData.speed : "N/A"}</div>
                                                    </div>
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Heading: </div>
                                                        <div>{metaData ? metaData.heading : "N/A"}</div>
                                                    </div>
                                                </div>
                                                <div className="hCenterItems-webrtc">
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Lights State : </div>
                                                        <div>{metaData ? metaData.lightsState : "N/A"}</div>
                                                    </div>
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Locking State: </div>
                                                        <div>{metaData ? metaData.lockingState : "N/A"}</div>
                                                    </div>
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Ebrake: </div>
                                                        <div>{metaData ? metaData.ebrake : "N/A"}</div>
                                                    </div>
                                                    <div className="vCenterItems-webrtc">
                                                        <div>Behaviour ID: </div>
                                                        <div>{metaData ? metaData.behaviourID : "N/A"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                            }
                        </div>
                    )
            }
        </div>
    );
}