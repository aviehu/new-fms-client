
const SPECIAL_BASE = 1000 * 1000 * 1000


const NodeApi = function(url: string) {

    const originalUrl = url;
    const responseHandler = (response: {status: number}) => {
        if(response.status != 200)
            console.log(`Error response from rest api ${response}`)
    };



    return {
        overlayOne: function() {
            fetch(`${url}/keycode/49/d`)
                .then(responseHandler)
        },

        overlayTwo: function() {
            fetch(`${url}/keycode/50/d`)
                .then(responseHandler)
        },

        overlayThree: function() {
            fetch(`${url}/keycode/51/d`)
                .then(responseHandler)
        },

        overlayFour: function() {
            fetch(`${url}/keycode/52/d`)
                .then(responseHandler)
        },

        overlayFive: function() {
            fetch(`${url}/keycode/53/d`)
                .then(responseHandler)
        },

        pauseVideo: function() {
            fetch(`${url}/keycode/88/d`)
                .then(responseHandler)
        },

        resumeVideo: function() {
            fetch(`${url}/keycode/90/d`)
                .then(responseHandler)
        },

        forceIdr: function() {
            fetch(`${url}/keycode/70/d`)
                .then(responseHandler)
        },

        idrOnNextFrame: function () {
            fetch(`${url}/setRTPMuxerIDROnNextFrame`)
                .then(responseHandler)
        },

        increaseSaturation: function() {
            fetch(`${url}/keycode/${parseInt(`${SPECIAL_BASE + parseInt("0x006C")}`)}/d`)
                .then(responseHandler)
        },

        decreaseSaturation: function() {
            fetch(`${url}/keycode/127/d`)
                .then(responseHandler)
        },

        fourCam: function () {
            fetch(`${url}/keycode/122/d`)
                .then(responseHandler)
        },

        switchCamera: function (cam: 'front' | 'right' | 'rear' | 'left') {
            const selector = {
                'front': 119,
                'right': 100,
                'rear': 115,
                'left': 97
            }
            fetch(`${url}/keycode/${selector[cam]}/d`)
                .then(responseHandler)
        },

        increaseContrast: function() {
            fetch(`${url}/keycode/${parseInt(`${SPECIAL_BASE + parseInt("0x006A")}`)}/d`)
                .then(responseHandler)
        },

        decreaseContrast: function() {
            fetch(`${url}/keycode/${parseInt(`${SPECIAL_BASE + parseInt("0x006B")}`)}/d`)
                .then(responseHandler)
        },

        increaseBrightness: function() {
            fetch(`${url}/keycode/${parseInt(`${SPECIAL_BASE + parseInt("0x0068")}`)}/d`)
                .then(responseHandler)
        },

        decreaseBrightness: function() {
            fetch(`${url}/keycode/${parseInt(`${SPECIAL_BASE + parseInt("0x0069")}`)}/d`)
                .then(responseHandler)
        },

        cycleLayoutRight: function() {
            fetch(`${url}/keycode/62/d`)
                .then(responseHandler)
        },

        cycleLayoutLeft: function() {
            fetch(`${url}/keycode/60/d`)
                .then(responseHandler)
        },

        setBandwidth: function(band: string | number) {
            fetch(`${url}/setBandwidth/${band}`)
                .then(responseHandler)
        },

        setLowLatencyMode: function() {
            fetch(`${url}}/setPlanner/0`)
                .then(responseHandler)
            fetch(`${url}/setVideoReorderBufferSize/0`)
                .then(responseHandler)
        },

        setHighLatencyMode: function() {
            fetch(`${url}/setPlanner/3`)
                .then(responseHandler)
            fetch(`${url}/setVideoReorderBufferSize/2`)
                .then(responseHandler)
        },

        closeNode: function() {
            fetch(`${url}/keycode/113/d`)
                .catch(() => null);
        },

        pingNode: function() {
            return fetch(`${url}/ping`);
        },

        echoOneWay: async function() {
            const res  = await fetch(`http://${url}:8090`)
            const expires = res.headers.get("Expires")
            if(!expires) {
                return
            }
            return Date.now() - parseInt(expires)
        },

        echoTwoWay: async function(){
            try {
                const start = Date.now()
                const res  = await fetch(`${originalUrl}/echo/`)
                if(res.status != 200) {
                    console.log(`Error response from rest api ${res}`)
                    return -1
                }
                return Date.now() - start;
            }
            catch(e) {
                return -1
            }
        }
    }
}

export default NodeApi;
