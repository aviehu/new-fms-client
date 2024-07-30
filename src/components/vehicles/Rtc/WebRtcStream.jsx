import React, { useState, useEffect, useRef } from 'react';
import Client from "./janusClient"
import NodeApi from "./nodeApi"
import { Chip, Fab, Stack, Tooltip, Typography} from "@mui/material";
import './WebRtc.css';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import WidthFullIcon from '@mui/icons-material/WidthFull';
import WidthNormalIcon from '@mui/icons-material/WidthNormal';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import {SOCKET_STATES} from "./RtcSocket.ts";

const fullPageStyle = {
    left: 0,
    position: 'absolute',
    top: 0,
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
}

const Stream = ({ stream, url, node, control, picassoWsUrl, hostId, nodeConnected, socketState}) => {

    const api = NodeApi(node)

    const [age, setAge] = useState(stream.video_age_ms || stream.media && stream.media[0] ? stream.media[0].age_ms : 9999)
    const [latency] = useState(9999)
    const [loss, setLoss] = useState(null)
    const [picassoWs, setPicassoWs] = useState(null)
    const [debug, setDebug] = useState(false)
    const videoRef = useRef();
    const overlayRef = useRef();
    const containerRef = useRef();
    const [canvasShapes] = useState({ current: [] });
    const [resolution] = useState({});
    const [showButtons, setShowButtons] = useState(true)
    function isStreamLive(age){
        return age < 100
    }

    function updateDebug(){
        setDebug(!debug)
    }



    useEffect(() => {
        let hideButtonsTimeout = null
        function monitorMouse() {
            setShowButtons(true)
            clearTimeout(hideButtonsTimeout)
            hideButtonsTimeout = setTimeout(() => {
                setShowButtons(false)
            }, 3000)
        }
        monitorMouse()
        addEventListener("mousemove", monitorMouse);
        var janus = new Client(url)
        janus.subscribe("slow_link", (info) => {
            setLoss(info)
        });
        janus.subscribe("attached", () => {
            janus.startStream(stream)
            setInterval(() => janus.getStreamInfo(stream.id), 2000)
        });
        janus.subscribe("stream_info", (info) => {
            setAge(info.video_age_ms || info.media[0].age_ms)
            // if (isStreamLive(info.video_age_ms))
            //     echoForLatency()
        });
        janus.startClient()
        return () => {
            if(janus) {
                janus.closeClient()
            }
            removeEventListener("mousemove", monitorMouse)
            clearTimeout(hideButtonsTimeout)
        }
    }, []);

    function resizeCanvas () {
        if(!videoRef.current || !overlayRef.current) {
            return
        }
        const ratio = videoRef.current.videoHeight / videoRef.current.videoWidth
        if (ratio <= window.innerHeight / window.innerWidth) {
            overlayRef.current.style.width = `${window.innerWidth}px`
            overlayRef.current.style.height = `${window.innerWidth * ratio}px`
            containerRef.current.style.width = `${window.innerWidth}px`
            containerRef.current.style.height = `${window.innerWidth * ratio}px`
        } else {
            overlayRef.current.style.width = `${window.innerHeight /  ratio}px`
            overlayRef.current.style.height = `${window.innerHeight}px`
            containerRef.current.style.width = `${window.innerHeight /  ratio}px`
            containerRef.current.style.height = `${window.innerHeight}px`
        }
        overlayRef.current.width = videoRef.current.videoWidth
        overlayRef.current.height = videoRef.current.videoHeight
        containerRef.current.width = videoRef.current.videoWidth
        containerRef.current.height = videoRef.current.videoHeight
    }

    function metaDataLoaded() {
        const canvas = overlayRef.current;
        if (document.fullscreenElement === null) {
            canvas.style.height = null;
            drawOverlay();
            return;
        }

        const {offsetWidth, videoWidth, videoHeight} = videoRef.current;

        const actualHeight = offsetWidth / (videoWidth / videoHeight);
        canvas.style.height = `${actualHeight}px`;
        canvas.style.top = `calc(50vh - ${actualHeight}px / 2)`;
        drawOverlay();
    }

    useEffect(() => {
        if (videoRef.current)
            new ResizeObserver(metaDataLoaded).observe(videoRef.current);
    }, [videoRef]);

    useEffect(() => {
        if (!picassoWsUrl) {
            return ;
        }
        setTimeout(() => {
            const newPicassoWs = new WebSocket(picassoWsUrl);
            newPicassoWs.onopen = function (event) {
                console.log('picassoWs on connect', event)
            };
            newPicassoWs.onclose = function (event) {
                console.log('picassoWs on close', event)
            };
            newPicassoWs.onerror = function (event, error) {
                console.log('picassoWs on error', event, error)
            };
            newPicassoWs.onmessage = function (message) {
                const current = canvasShapes.current || [];
                const next = [...current];
                const data = JSON.parse(message.data);
                const { add, remove } = data

                if(add){
                    add.shapes.forEach((shape) => {
                        const foundIndex = next.findIndex((shapeItem) => shapeItem.id === shape.id);
                        if (foundIndex === -1) {
                            next.push(shape)
                        } else {
                            if(next[foundIndex].interval) {
                                clearInterval(next[foundIndex].interval)
                            }
                            next[foundIndex] = shape;
                        }
                    })
                    if (add.displayResolution) {
                        resolution.width = add.displayResolution.width;
                        resolution.height = add.displayResolution.height;
                    }
                }

                if(remove) {
                    remove.forEach((id) => {
                        const foundIndex = next.findIndex((shapeItem) => shapeItem.id === id);
                        if(next[foundIndex].blinkingDurationMS && next[foundIndex].interval) {
                            clearInterval(next[foundIndex].interval)
                        }
                        next.splice(foundIndex, 1);
                    })
                }
                canvasShapes.current = next;
                drawOverlay();
                return false;
            }
            setPicassoWs(newPicassoWs);
            drawOverlay();
        }, 2500);

        return () => {
            if (picassoWs) {
                picassoWs.close();
            }
            // clearInterval(timeout);
        }
    }, [picassoWsUrl])

    document.addEventListener("fullscreenchange", () => {
        if (document.fullscreenElement === null) {
            // overlayRef.current.style.height = null;
            overlayRef.current.style.top = null;
            drawOverlay();
        }
    })

    function getColor({red, green, blue, alpha}) {
        return `rgba(${255 * red}, ${255 * green}, ${255 * blue}, ${alpha})`
    }

    function drawLine(context, points, color, lineWidth) {
        context.beginPath();
        const [p1, ...otherPoints] = points;

        context.moveTo(p1.x, p1.y);
        otherPoints.forEach(({x, y}) => context.lineTo(x, y));
        context.strokeStyle = getColor(color);
        context.lineWidth = lineWidth;
        context.stroke();
    }
    function drawCircle(context, point, color, { radius }) {
        context.beginPath();

        context.arc(point.x, point.y, radius, 0, 2 * Math.PI);
        context.strokeStyle = getColor(color);
        context.fillStyle = getColor(color);
        context.fill();
        context.stroke();
    }
    function drawText(context, {x, y}, color, {size, text}) {
        context.font = `${size * 20}px Arial`;
        context.fillStyle = getColor(color);
        context.fillText(text, x, y);
    }

    function drawCurve(context, points, color, lineWidth, { controlPoints }) {
        const [startPoint, endPoint] = points;
        const [controlPoint1, controlPoint2] = controlPoints;
        context.moveTo(startPoint.x, startPoint.y);
        context.bezierCurveTo(controlPoint1.x, controlPoint1.y, controlPoint2.x, controlPoint2.y, endPoint.x, endPoint.y);
        context.lineWidth = lineWidth;
        context.strokeStyle = getColor(color);
        context.stroke();
    }

    function drawRect(context, points, color, lineWidth, contourOnly) {
        const [startPoint, endPoint] = points;
        if (contourOnly) {
            context.rect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
            context.lineWidth = lineWidth;
            context.strokeStyle = getColor(color);
            context.stroke();
        } else {
            context.filStyle = getColor(color);
            context.fillRect(startPoint.x, startPoint.y, endPoint.x - startPoint.x, endPoint.y - startPoint.y);
        }
    }
    function drawPolygon(context, points, color, lineWidth, contourOnly) {
        context.strokeStyle = getColor(color);
        context.filStyle = getColor(color);
        context.lineWidth = lineWidth;
        const [firstPoint, ...restPoints] = points;
        context.beginPath();
        context.moveTo(firstPoint.x, firstPoint.y);
        restPoints.forEach(({ x, y }) => {
            context.lineTo(x,y);
        });
        context.closePath();
        if (contourOnly) {
            context.stroke();
        } else {
            context.fill();
        }
    }

    function drawShape(currentShape, ctx) {
        const { elementType, points, color, lineWidth, additionalInfo = {} } = currentShape;
        switch (elementType) {
            case "line":
                drawLine(ctx, points, color, lineWidth)
                break;
            case "text":
                drawText(ctx, points[0], color, additionalInfo)
                break;
            case 'circle':
                drawCircle(ctx, points[0], color, additionalInfo)
                break;
            case 'curve':
                drawCurve(ctx, points, color, lineWidth, additionalInfo)
                break;
            case 'rect':
                drawRect(ctx, points, color, lineWidth, additionalInfo.contourOnly);
                break;
            case 'polygon':
                drawPolygon(ctx, points, color, lineWidth, additionalInfo.contourOnly);
                break;
            default:
                console.log('currentShape not recognized', currentShape);
                break;
        }
    }
    function drawOverlay() {
        const canvas = overlayRef.current;
        if (!canvas)
            return;
        resizeCanvas();
        const ctx = canvas.getContext("2d");
        console.log('resolution', resolution);
        canvas.width = resolution.width || videoRef.current.videoWidth;
        canvas.height = resolution.height || videoRef.current.videoHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const shapes = canvasShapes.current;
        shapes.forEach((currentShape) => {
            if(currentShape.blinkingDurationMS && currentShape.blinkingDurationMS !== '0') {
                if(!currentShape.interval) {
                    currentShape.blink = true
                    currentShape.interval = setInterval(() => {
                        currentShape.blink = !currentShape.blink
                        if(currentShape.blink) {
                            console.log('blinking', currentShape)
                            drawShape(currentShape)
                        } else {
                            drawOverlay()
                        }
                    }, currentShape.blinkingDurationMS)
                }
                if(!currentShape.blink) {
                    return
                }
            }
            drawShape(currentShape, ctx)
        });
    }

    useEffect(() => {
        function multiResize() {
            resizeCanvas()
            setTimeout(resizeCanvas, 50)
            setTimeout(resizeCanvas, 150)
        }
        window.addEventListener('resize', multiResize, true);
        multiResize()
        return () => {
            removeEventListener('resize', multiResize)
        }
    }, [videoRef, overlayRef]);

    useEffect(() => {
        drawOverlay();
    }, [overlayRef]);

    return (<div>
            <video ref={videoRef}
                   style={{left: 0, position: 'absolute', top: 0, width: '100%', height: '100%'}}
                   key={stream.id} id={"remotevideo" + stream.id} autoPlay muted></video>
            <div style={fullPageStyle}>
                <canvas ref={overlayRef}/>
            </div>
            <div style={fullPageStyle}>
                <div ref={containerRef} style={{position: 'relative'}}>
                    <img className="video-label-top-left"
                         src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    <img className="video-label-top-right"
                         src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    <img className="video-label-bottom-left"
                         src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    <img className="video-label-bottom-right"
                         src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    {
                        !control || !showButtons ?
                            <Stack style={{position: 'absolute', left: 35, top: 35}} spacing={4} direction={'column'}>
                                <Chip style={{backgroundColor: "#e0e2e0"}} size={'small'} label={`'Monitoring - ${hostId}`}/>
                            </Stack>
                            :
                            <div>
                                <Stack direction={'row'} style={{position: 'absolute', left: 35, right: 35, top: 35}} justifyContent={'space-evenly'}>
                                    <Stack direction={'row'} spacing={4}>
                                        <Stack spacing={1}>
                                            <Chip style={{backgroundColor: "#e0e2e0"}} size={'small'} label={'Node API'}/>
                                            <Chip size={'small'} color={nodeConnected ? 'success' : 'error'} label={nodeConnected ? 'Online' : 'Offline'}/>
                                        </Stack>
                                        <Stack spacing={1}>
                                            <Chip style={{backgroundColor: "#e0e2e0"}} size={'small'} label={'Node Socket'}/>
                                            <Chip size={'small'} color={socketState === SOCKET_STATES.conncted ? 'success' : 'error'} label={socketState}/>
                                        </Stack>
                                    </Stack>
                                </Stack>
                                <Stack style={{position: 'absolute', left: 35, bottom: 35}} spacing={4} direction={'row'}>
                                    <Tooltip placement={'top'} title={'Resume'}>
                                        <Fab size="small" onClick={api.resumeVideo}  >
                                            <PlayArrowIcon/>
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip placement={'top'} title={'Pause'}>
                                        <Fab size="small" onClick={api.pauseVideo}>
                                            <PauseIcon/>
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip placement={'top'} title={'IDR'}>
                                        <Fab size="small" onClick={api.forceIdr}>
                                            <AutoFixHighIcon/>
                                        </Fab>
                                    </Tooltip>
                                </Stack>
                                <Stack style={{position: 'absolute', right: 35, top: 35}} spacing={4} direction={'column'}>
                                    <Tooltip title={'Overlay 1'}>
                                        <Fab size="small" onClick={api.overlayOne}>
                                            1
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Overlay 2'}>
                                        <Fab size="small" onClick={api.overlayTwo}>
                                            2
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Overlay 3'}>
                                        <Fab size="small" onClick={api.overlayThree}>
                                            3
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Overlay 4'}>
                                        <Fab size="small" onClick={api.overlayFour}>
                                            4
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Overlay 5'}>
                                        <Fab size="small" onClick={api.overlayFive}>
                                            5
                                        </Fab>
                                    </Tooltip>
                                </Stack>
                                <Stack style={{position: 'absolute', left: 35, top: 35}} spacing={4} direction={'column'}>
                                    <Chip style={{backgroundColor: "#e0e2e0"}} size={'small'} label={`In Control - ${hostId}`}/>
                                    <Tooltip title={'Cycle Left'}>
                                        <Fab size="small" onClick={api.cycleLayoutLeft}>
                                            <ArrowBackIcon/>
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Cycle Right'}>
                                        <Fab size="small" onClick={api.cycleLayoutRight}>
                                            <ArrowForwardIcon/>
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Max BW 1000'}>
                                        <Fab size="small" onClick={() => api.setBandwidth(1000)}>
                                            <WidthNormalIcon/>
                                        </Fab>
                                    </Tooltip>
                                    <Tooltip title={'Max BW 2500'}>
                                        <Fab size="small" onClick={() => api.setBandwidth(2500)}>
                                            <WidthFullIcon/>
                                        </Fab>
                                    </Tooltip>
                                </Stack>
                                <Stack style={{position: 'absolute', right: 35, bottom: 35}} spacing={4} direction={'row'}>
                                    <Stack spacing={2}>
                                        <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Saturation'}></Chip>
                                        <Stack spacing={2} direction={'row'}>
                                            <Tooltip placement={'top'} title={'Saturation Up'}>
                                                <Fab size="small" onClick={api.increaseSaturation}>
                                                    <ArrowUpwardIcon/>
                                                </Fab>
                                            </Tooltip>
                                            <Tooltip placement={'top'} title={'Saturation Down'}>
                                                <Fab size="small" onClick={api.decreaseSaturation}>
                                                    <ArrowDownwardIcon/>
                                                </Fab>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                    <Stack spacing={2}>
                                        <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Contrast'}></Chip>
                                        <Stack spacing={2} direction={'row'}>
                                            <Tooltip placement={'top'} title={'Contrast Up'}>
                                                <Fab size="small" onClick={api.increaseContrast}>
                                                    <ArrowUpwardIcon/>
                                                </Fab>
                                            </Tooltip>
                                            <Tooltip placement={'top'} title={'Contrast Down'}>
                                                <Fab size="small" onClick={api.decreaseContrast}>
                                                    <ArrowDownwardIcon/>
                                                </Fab>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                    <Stack spacing={2}>
                                        <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Brightness'}></Chip>
                                        <Stack spacing={2} direction={'row'}>
                                            <Tooltip placement={'top'} title={'Brightness Up'}>
                                                <Fab size="small" onClick={api.increaseBrightness}>
                                                    <ArrowUpwardIcon/>
                                                </Fab>
                                            </Tooltip>
                                            <Tooltip placement={'top'} title={'Brightness Down'}>
                                                <Fab size="small" onClick={api.decreaseBrightness}>
                                                    <ArrowDownwardIcon/>
                                                </Fab>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                    <Stack spacing={2}>
                                        <Chip size={'small'} style={{backgroundColor: "#e0e2e0"}} label={'Latency'}></Chip>
                                        <Stack direction={'row'} spacing={2}>
                                            <Tooltip placement={'top'} title={'Latency Low'}>
                                                <Fab size="small" onClick={api.resumeVideo} style={{textTransform: 'none'}}>
                                                    Low
                                                </Fab>
                                            </Tooltip>
                                            <Tooltip placement={'top'} title={'Latency High'}>
                                                <Fab size="small" onClick={api.pauseVideo} style={{textTransform: 'none'}}>
                                                    High
                                                </Fab>
                                            </Tooltip>
                                        </Stack>
                                    </Stack>
                                </Stack>
                            </div>
                    }
                </div>
            </div>
            <div>
                <div className="vCenterItems-webrtc">
                    {isStreamLive(age) ? <b style={{color: "#37CE37"}} onClick={updateDebug}>WebRTC ONLINE</b> :
                        <b style={{color: "red"}}>OFFLINE</b>}
                    {isStreamLive(age) ?
                        <b style={{color: "#37CE37", marginLeft: "5px"}}>| RTC rtt latency: ~{latency} ms</b> : null}
                    {isStreamLive(age) && loss && debug ?
                        <b style={{color: "#37CE37", marginLeft: "5px"}}>| {loss.uplink ? "Uplink" : "Downlink"} loss:
                            ~{loss.lost} pk</b> : null}
                </div>
            </div>
        </div>
    )
}


export default Stream
