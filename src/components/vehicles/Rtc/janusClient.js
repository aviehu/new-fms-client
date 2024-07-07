// import { Janus } from 'janus-gateway';
import Janus from './janus';

var initilized = false;

if (!initilized) {
    Janus.init({
        debug: false, callback: () => {
            console.log("Janus initilized")
            initilized = true;
        }
    });
}

const EventEmitter = function() {
    const emitter = {}
    emitter._events = {};
    emitter.dispatch = (event, data) => {
        if (!emitter._events[event]) return;
        emitter._events[event].forEach(callback => callback(data))
    };
    emitter.subscribe = (event, callback) => {
        if (!emitter._events[event]) emitter._events[event] = [];
        emitter._events[event].push(callback);
    };
    emitter.unsubscribe = (event) => {
        if (!emitter._events[event]) return;
        delete emitter._events[event];
    }
    emitter.clearSubs = () => {
        emitter._events = {};
    }
    return emitter;
}

function Client(url) {

    const client = {}
    client.selectedStreamId = null;
    client.server = url;
    client.janus = null;
    client.streaming = null;
    client.started = false;
    client.streams = [];
    client.stream = {stream: null, info: null};
    client.emitter = EventEmitter();
    client.subscribe = client.emitter.subscribe;

    client.startClient = async function startClient(){
        this.started = true;
        this.janus = new Janus({
            server: this.server,
            success: () => {
                console.log("Client connected");
                this.attachToStreamingPlugin(this.janus);
                this.emitter.dispatch("connected")
            },
            error: (error) => {
                console.log(error);
                console.log("janus error");
                this.emitter.dispatch("error")
            },
            destroyed: () => {
                console.log("destroyed");
            }
        });
    };

    client.closeClient = function(){
        this.emitter.clearSubs()
        this.janus.destroy()
    }

    client.attachToStreamingPlugin = function(janus){
        // Attach to streaming plugin
        console.log("Attach to streaming plugin");
        janus.attach({
            plugin: "janus.plugin.streaming",
            success: (pluginHandle) => {
                this.streaming = pluginHandle;
                console.debug("Plugin attached! (" + this.streaming.getPlugin() + ", id=" + this.streaming.getId() + ")");
                this.emitter.dispatch("attached", this.streaming)
            },
            error: (error) => {
                console.log("  -- Error attaching plugin... " + error);
                console.error("Error attaching plugin... " + error);
            },
            onmessage: (msg, jsep) => {
                console.debug(" ::: Got a message :::");
                console.debug(JSON.stringify(msg));
                this.processMessage(msg);
                this.handleSDP(jsep);
            },
            slowLink: (uplink, lost) => {
                this.emitter.dispatch("slow_link", {uplink: uplink, lost: lost})

            },
            mediaState: function(medium, on) {
                console.log("Janus " + (on ? "started" : "stopped") + " receiving our " + medium);
            },
            webrtcState: function(on) {
                console.log("Janus says our WebRTC PeerConnection is " + (on ? "up" : "down") + " now");
            },
            onremotestream: (stream) => {
                Janus.debug(" ::: Got a remote stream :::", stream);
                var videoTracks = stream.getVideoTracks();
                if (videoTracks.length > 0)
                    this.stream.stream = stream;
                // this.handleStream(stream);
            },
            oncleanup: () => {
                console.log(" ::: Got a cleanup notification :::");
            }
        });
    };

    client.updateStreamsList = function() {
        var body = { "request": "list" };
        this.streaming.send({
            "message": body, success: (result) => {
                if (result === null || result === undefined) {
                    console.error("no streams available");
                    return;
                }
                if (result["list"] !== undefined && result["list"] !== null) {
                    var list = result["list"];
                    console.debug("Got a list of available streams:");
                    this.streams = result["list"]
                    this.emitter.dispatch("streams", this.streams)
                    // this.startStream(theFirstStream);
                } else {
                    console.error("no streams available - list is null");
                    return;
                }
            }
        });
    }

    client.getStreamInfo = function(stream) {
        if(!stream)
            return;
        // Send a request for more info on the mountpoint we subscribed to
        var body = { request: "info", id: parseInt(stream) || stream };
        this.streaming.send({ message: body, success: (result) => {
                this.emitter.dispatch("stream_info", result.info)
                this.stream.info = result;
            }});
    }

    client.startStream = function(selectedStream) {
        var selectedStreamId = selectedStream["id"];
        console.debug("Selected video id #" + selectedStreamId);
        if (selectedStreamId === undefined || selectedStreamId === null) {
            console.log("No selected stream");
            return;
        }
        var body = { "request": "watch", id: parseInt(selectedStreamId) };
        console.debug(`Asking to watch ${selectedStreamId}`);
        this.selectedStreamId = selectedStreamId
        this.streaming.send({ "message": body });
        this.getStreamInfo(selectedStreamId)
    }

    client.handleStream = function (stream) {
        // Show the stream and hide the spinner when we get a playing event
        console.debug("attaching remote media stream");
        Janus.attachMediaStream(document.getElementById('remotevideo' + this.selectedStreamId), stream)
    }

    client.processMessage = function (msg) {
        var result = msg["result"];
        if (result && result["status"]) {
            var status = result["status"];
            switch (status) {
                case 'starting':
                    console.debug("starting - please wait...");
                    break;
                case 'preparing':
                    console.debug("preparing");
                    break;
                case 'started':
                    console.log("started");
                    if (this.stream.stream)
                        this.handleStream(this.stream.stream)
                    break;
                case 'stopped':
                    console.log("stopped");
                    break;
            }
        } else {
            console.log("no status available");
        }
    }

    client.handleSDP = function (jsep) {
        if (jsep !== undefined && jsep !== null) {
            console.debug("Handling jsep message");
            console.debug(":: jsep ::");
            console.debug(jsep);
            this.streaming.createAnswer({
                jsep: jsep,
                media: { audioSend: false, videoSend: false },
                success: (jsep) => {
                    console.debug("Got SDP! Requesting start");
                    console.debug(jsep);
                    var body = { "request": "start" };
                    this.streaming.send({ "message": body, "jsep": jsep });
                },
                error: (error) => {
                    console.log("WebRTC error:");
                    console.log(error);
                    console.error("WebRTC error... " + JSON.stringify(error));
                }
            });
        }
    }

    client.echoTwoWay = async function () {
        try {
            const start = Date.now()
            console.log(url)
            const res  = await fetch(`${url}`)
            if(res.status != 200) {
                console.log(`Error response from rest api ${response}`)
                return -1
            }
            return Date.now() - start;
        }
        catch(e) {
            return -1
        }
    }

    return client
}

export default Client;
