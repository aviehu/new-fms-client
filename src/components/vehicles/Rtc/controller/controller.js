import { getGamepadWithoutHook } from "./useGamepad.js";


const Controller = function(update) {

    var timer;

    timer = setInterval(() => {
        monitorController()
    }, 10)

    function clearMonitorTimer() {
        if(timer) {
            clearInterval(timer)
            timer = null
        }
    }

    function monitorController() {
        var gp = getGamepadWithoutHook();
        if(!gp) {
            update({axes: [0, 0, 0, 0, 0, 0, 0, 0], buttons: 0});
            return
        }
        var cleanButtons = gp.buttons.map(bt => bt.pressed ? 1 : 0);
        var buttons = 0
        for (var b in cleanButtons) {
            if (cleanButtons[b])
                buttons = buttons | (1 << b);
        }
        const axes = gp.axes
        update({axes, buttons});
    };

    const controller = {};

    controller.shutdown = function() {
        console.log("CONTROLLER SHUTDOWN")
        clearMonitorTimer();
    }
    return controller;
}

export default Controller;
