import React, { useState, useEffect, useRef } from 'react';
import Client from "./janus/janusClient.js"
import NodeApi from "./nodeApi"
import { Chip, Stack} from "@mui/material";
import './WebRtc.css';
import UiControls from "./UiControls";
import LoadingPage from "../../LoadingPage";

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
    const [videoShowing, setVideoShowing] = useState(false)
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
            }, 2500)
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
        if(!videoRef.current) {
            return
        }
        const sizeInterval = setInterval(() => {
            if(videoRef.current.videoWidth > 0) {
                setVideoShowing(true)
                clearInterval(sizeInterval)
            }
        }, 250)
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
                       key={stream.id} id={"remotevideo" + stream.id} autoPlay muted/>
                <div style={fullPageStyle}>
                    <canvas ref={overlayRef}/>
                </div>
                <div style={fullPageStyle}>
                    <div ref={containerRef} style={{position: 'relative'}}>
                        {
                            videoShowing ?
                                <div>
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
                                            <Stack style={{position: 'absolute', left: 35, top: 35}} spacing={4}
                                                   direction={'column'}>
                                                <Chip style={{backgroundColor: "#e0e2e0"}}
                                                      label={`${control ? 'In Control' : 'Monitoring'} - ${hostId}`}/>
                                            </Stack>
                                            :
                                            <UiControls hostId={hostId} api={api} nodeConnected={nodeConnected}
                                                        socketState={socketState}/>
                                    }
                                </div> : <LoadingPage />
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
