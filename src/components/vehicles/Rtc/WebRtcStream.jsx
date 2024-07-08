import React, { useState, useEffect, useRef } from 'react';
import Client from "./janusClient"
import NodeApi from "./nodeApi"
import {Button} from "@mui/material";
import './WebRtc.css';


const Stream = ({ stream, url, node, control, picassoWsUrl }) => {

    const api = NodeApi(node)

    const [age, setAge] = useState(stream.video_age_ms || stream.media[0].age_ms)
    const [latency] = useState(9999)
    const [loss, setLoss] = useState(null)
    const [picassoWs, setPicassoWs] = useState(null)
    const [debug, setDebug] = useState(false)
    const videoRef = useRef();
    const overlayRef = useRef();
    const containerRef = useRef();
    const [canvasShapes] = useState({ current: [] });
    const [resolution] = useState({});
    function isStreamLive(age){
        return age < 100
    }

    function updateDebug(){
        setDebug(!debug)
    }

    useEffect(() => {
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
        return () => janus ? janus.closeClient() : null
    }, []);



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

    function videoDoubleClick() {
        containerRef.current.requestFullscreen().then(metaDataLoaded);
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
        drawOverlay();
    }, [overlayRef]);

    return (
        <div>
            <div className="video-container--outer" ref={containerRef}>
                <div className="video-container--inner">
                    <video className="video" onLoadedMetadata={metaDataLoaded} loop onDoubleClick={videoDoubleClick} key={stream.id} ref={videoRef} id={"remotevideo" + stream.id} playsInline autoPlay muted height="432"/>
                    <canvas ref={overlayRef} className="video-overlay" />
                    <img className="video-label-top-left" src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    <img className="video-label-top-right" src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    <img className="video-label-bottom-left" src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                    <img className="video-label-bottom-right" src={control ? '/public/control_corner.png' : '/public/monitoring_corner.png'}/>
                </div>
            </div>
            <div className="vCenterItems-webrtc">
                {isStreamLive(age) ? <b style={{color: "#37CE37"}} onClick={updateDebug}>WebRTC ONLINE</b> : <b style={{color: "red"}}>OFFLINE</b>}
                {isStreamLive(age) ? <b style={{color: "#37CE37", marginLeft: "5px"}}>| RTC rtt latency: ~{latency} ms</b> : null}
                {isStreamLive(age) && loss && debug ? <b style={{color: "#37CE37", marginLeft: "5px"}}>| {loss.uplink ? "Uplink" : "Downlink"} loss: ~{loss.lost} pk</b> : null}
            </div>
            {
                ! control ?
                    null :
                    <div>
                        <div className="vCenterItems-webrtc">
                            <div className="hCenterItems-webrtc">
                                <b>Video</b>
                                <div className="vCenterItems-webrtc">
                                    <Button className="controlButton" variant="secondary" onClick={api.resumeVideo}>resume</Button>
                                    <Button className="controlButton" variant="secondary" onClick={api.pauseVideo}>pause</Button>
                                    <Button className="controlButton" variant="secondary" onClick={api.forceIdr}>IDR</Button>
                                </div>
                            </div>
                            <div className="hCenterItems-webrtc">
                                <b>Layouts</b>
                                <div className="vCenterItems-webrtc">
                                    <Button className="controlButton" variant="secondary" onClick={api.cycleLayoutLeft}>cycle left</Button>
                                    <Button className="controlButton" variant="secondary" onClick={api.cycleLayoutRight}>cycle right</Button>
                                </div>
                            </div>
                            <div className="hCenterItems-webrtc">
                                <b>Bandwidth</b>
                                <div className="vCenterItems-webrtc">
                                    <Button className="controlButton" variant="secondary" onClick={() => api.setBandwidth(1000)}>max bw 1000</Button>
                                    <Button className="controlButton" variant="secondary" onClick={() => api.setBandwidth(2500)}>max bw 2500</Button>
                                </div>
                            </div>
                        </div>
                        <div className="vCenterItems-webrtc">
                            <div className="hCenterItems-webrtc">
                                <b>Post Processing</b>
                                <div className="vCenterItems-webrtc">
                                    <div className="hCenterItems-webrtc">
                                        <Button className="controlButton" variant="secondary" onClick={api.increaseSaturation}>saturation up</Button>
                                        <Button className="controlButton" variant="secondary" onClick={api.decreaseSaturation}>saturation down</Button>
                                    </div>
                                    <div className="hCenterItems-webrtc">
                                        <Button className="controlButton" variant="secondary" onClick={api.increaseContrast}>contrast up</Button>
                                        <Button className="controlButton" variant="secondary" onClick={api.decreaseContrast}>contrast down</Button>
                                    </div>
                                    <div className="hCenterItems-webrtc">
                                        <Button className="controlButton" variant="secondary" onClick={api.increaseBrightness}>brightness up</Button>
                                        <Button className="controlButton" variant="secondary" onClick={api.decreaseBrightness}>brightness down</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="vCenterItems-webrtc">
                            <div className="hCenterItems-webrtc">
                                <b>Overlay</b>
                                <div className="vCenterItems-webrtc">
                                    <Button className="controlButton" variant="secondary" onClick={() => api.overlayOne()}>1</Button>
                                    <Button className="controlButton" variant="secondary" onClick={() => api.overlayTwo()}>2</Button>
                                    <Button className="controlButton" variant="secondary" onClick={() => api.overlayThree()}>3</Button>
                                    <Button className="controlButton" variant="secondary" onClick={() => api.overlayFour()}>4</Button>
                                    <Button className="controlButton" variant="secondary" onClick={() => api.overlayFive()}>5</Button>
                                </div>
                            </div>
                            <div className="hCenterItems-webrtc">
                                <b>Latency</b>
                                <div className="vCenterItems-webrtc">
                                    <Button className="controlButton" variant="secondary" onClick={api.setLowLatencyMode}>low</Button>
                                    <Button className="controlButton" variant="secondary" onClick={api.setHighLatencyMode}>high</Button>
                                </div>
                            </div>
                        </div>
                    </div>
            }
        </div>
    );
};

export default Stream;
