import { useState, useEffect } from "react";

const defaultSettings = {
    buttons: {},
    axes: {},
    translation: {
        input: null,
        output: 'Native Linux'
    },
    player: 1
}

function changeRange(oldMin, oldMax, newMin, newMax, oldValue) {
    const oldRange = oldMax - oldMin
    const newRange = newMax - newMin
    return (((oldValue - oldMin) * newRange) / oldRange) + newMin
}

function NativeLinuxToWeb(gamepad) {
    const originalButtons = gamepad.buttons
    const originalAxes = gamepad.axes
    const translatedButtons = [...originalButtons]
    const translatedAxes = [...originalAxes]
    translatedButtons[8] = originalButtons[6]
    translatedButtons[9] = originalButtons[7]
    translatedButtons[16] = originalButtons[8]
    translatedButtons[10] = originalButtons[9]
    translatedButtons[11] = originalButtons[10]
    translatedButtons[6] = { pressed: originalAxes[2] !== -1, value: originalAxes[2], touched: false }
    translatedAxes[2] = originalAxes[3]
    translatedAxes[3] = originalAxes[4]
    translatedButtons[7] = { pressed: originalAxes[5] !== -1, value:  originalAxes[5], touched: false }
    translatedButtons[14] = { pressed: originalAxes[6] === -1, value:  originalAxes[6] === -1 ? 1 : 0, touched: false }
    translatedButtons[15] = { pressed: originalAxes[6] === 1, value:  originalAxes[6] === 1 ? 1 : 0, touched: false }
    translatedButtons[12] = { pressed: originalAxes[7] === -1, value:  originalAxes[7] === -1 ? 1 : 0, touched: false }
    translatedButtons[13] = { pressed: originalAxes[7] === 1, value:  originalAxes[7] === 1 ? 1 : 0, touched: false }
    return {translatedButtons, translatedAxes}
}

function WebToNativeLinux(gamepad) {
    const originalButtons = gamepad.buttons
    const originalAxes = gamepad.axes
    const translatedButtons = originalButtons.slice(0, 10)
    const translatedAxes = [...originalAxes, 0, 0, 0, 0]
    translatedAxes[0] = changeRange(-1, 1, -32768, 32768, originalAxes[0])
    translatedAxes[1] = changeRange(-1, 1, -32768, 32768, originalAxes[1])
    translatedAxes[2] = changeRange(0, 1, -32768, 32768, originalButtons[6].value)
    translatedAxes[5] = changeRange(0, 1, -32768, 32768, originalButtons[7].value)
    translatedButtons[6] = originalButtons[8]
    translatedButtons[7] = originalButtons[9]
    translatedButtons[8] = originalButtons[16]
    translatedButtons[9] = originalButtons[10]
    translatedButtons[10] = originalButtons[11]
    translatedAxes[7] = (originalButtons[12].pressed ? -32768 : 0) + (originalButtons[13].pressed ? 32768 : 0)
    translatedAxes[6] = (originalButtons[14].pressed ? -32768 : 0) + (originalButtons[15].pressed ? 32768 : 0)
    translatedAxes[3] = changeRange(-1, 1, -32768, 32768, originalAxes[2])
    translatedAxes[4] = changeRange(-1, 1, -32768, 32768, originalAxes[3])
    return {translatedButtons, translatedAxes}
}

function NativeLinuxToLegacy(gamepad) {
    return WebToLegacy(NativeLinuxToWeb(gamepad))
}

function WebToLegacy(gamepad) {
    const translatedButtons = gamepad.buttons || gamepad.translatedButtons
    const axes = gamepad.axes || gamepad.translatedAxes
    const translatedAxes = [...(axes.map((axis) => {
        return 2 ** 15 * axis
    })), 0, 0, 0, 0]
    return {translatedButtons, translatedAxes}
}

function roundOutput(gamepad, output) {
    const {translatedButtons, translatedAxes} = gamepad
    if(output === 'Native Linux' || output === 'Legacy') {
        return {translatedButtons, translatedAxes: translatedAxes.map((axis) => Math.round(axis))}
    }
    return {translatedButtons, translatedAxes: translatedAxes.map((axis) => axis.toFixed(3))}
}

function translate(gamepad) {
    const gamepadSettings = getGamepadSettings();
    if(gamepadSettings.translation.input === 'Native Linux') {
        if(gamepadSettings.translation.output === 'Web'){
            return NativeLinuxToWeb(gamepad)
        }
        if(gamepadSettings.translation.output === 'Legacy'){
            return NativeLinuxToLegacy(gamepad)
        }
        return {translatedButtons: gamepad.buttons, translatedAxes: gamepad.axes}
    }
    if(gamepadSettings.translation.output === 'Native Linux') {
        return WebToNativeLinux(gamepad)
    }
    if(gamepadSettings.translation.output === 'Legacy') {
        return  WebToLegacy(gamepad)
    }
    return {translatedButtons: gamepad.buttons, translatedAxes: gamepad.axes}
}

function getGamepadSettingsFromStorage() {
    try {
        return JSON.parse(localStorage.getItem('gamepadSettings'));
    } catch {
        return null
    }
}
function revertSetting() {
    localStorage.removeItem('gamepadSettings');
}

function getGamepadSettings() {
    const gamepadSettings = getGamepadSettingsFromStorage();
    if (!gamepadSettings) {
        localStorage.setItem('gamepadSettings', JSON.stringify(defaultSettings));
        return defaultSettings;
    }
    if(!gamepadSettings.translation){
        gamepadSettings.translation = defaultSettings.translation
        localStorage.setItem('gamepadSettings', JSON.stringify(gamepadSettings));
    }
    return gamepadSettings;
}

function overrideButton(input, output) {
    const currentGamepadSettings = getGamepadSettings();
    const currentOverride = currentGamepadSettings.buttons[output] !== undefined ? currentGamepadSettings.buttons[output] : output;
    const currentInputOverrideKey = Object.keys(currentGamepadSettings.buttons).find((key) => currentGamepadSettings.buttons[key] === input);
    const currentInputOverride = currentInputOverrideKey ? currentInputOverrideKey : input;
    currentGamepadSettings.buttons[output] = input;
    currentGamepadSettings.buttons[currentInputOverride] = currentOverride;
    localStorage.setItem('gamepadSettings', JSON.stringify(currentGamepadSettings));
}

function setTranslation(output, input) {
    const currentGamepadSettings = getGamepadSettings();
    const selectedInput = input ? input : currentGamepadSettings.translation.input
    currentGamepadSettings.translation = {output, input: selectedInput}
    localStorage.setItem('gamepadSettings', JSON.stringify(currentGamepadSettings));
}

export function getGamepadWithoutHook() {
    const playerIndex = navigator.getGamepads().findIndex((gp) => !!gp)
    const gamepad = navigator.getGamepads()[playerIndex];
    const currentGamepadSettings = getGamepadSettings();
    currentGamepadSettings.player = playerIndex + 1
    localStorage.setItem('gamepadSettings', JSON.stringify(currentGamepadSettings));
    if (!gamepad) {
        return null;
    }
    const inputLayout = gamepad.axes.length === 4 ? 'Web' : 'Native Linux'
    setTranslation(currentGamepadSettings.translation.output, inputLayout)
    const {translatedAxes, translatedButtons} = roundOutput(translate(gamepad), currentGamepadSettings.translation.output)
    const buttons = translatedButtons.map((button, index) => {
        const override = currentGamepadSettings.buttons[index];
        if (override === undefined) {
            return button;
        }
        const overrideButton = translatedButtons[override];
        return {
            override,
            pressed: overrideButton.pressed,
            value: overrideButton.pressed,
            touched: overrideButton.pressed,
        };
    });
    const axes = translatedAxes.map((axis, index) => {
        const override = currentGamepadSettings.axes[index];
        if (override === undefined) {
            return axis;
        }
        return {
            ...translatedAxes[override],
            override,
        };
    });
    return {
        buttons,
        axes,
        originalGamepad: gamepad,
        overrideButton,
        revertSetting,
        setTranslation,
        translation: () => getGamepadSettings().translation,
        player: () => getGamepadSettings().player
    };
}

export default function useGamepad(interval) {
    const [, setTriggerRender] = useState();
    useEffect(() => {
        if (!interval) {
            return;
        }
        const intervalRef = setInterval(() => setTriggerRender(Date.now()));
        return () => clearInterval(intervalRef);
    }, [interval]);
    return getGamepadWithoutHook()
}
