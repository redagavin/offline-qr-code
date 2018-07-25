import {MESSAGE_LEVEL} from "/common/modules/MessageLevel.js";

import * as Logger from "/common/modules/Logger.js";
import * as MessageRegister from "./MessageRegister.js";

const PREDEFINED_TYPES = Object.freeze({
    [MESSAGE_LEVEL.ERROR]: {
        ELEMENT: document.getElementById("messageError"),
        CSS: "error"
    },
    [MESSAGE_LEVEL.WARN]: {
        ELEMENT: document.getElementById("messageWarning"),
        CSS: "warning"
    },
    [MESSAGE_LEVEL.INFO]: {
        ELEMENT: document.getElementById("messageInfo"),
        CSS: "info"
    },
    [MESSAGE_LEVEL.SUCCESS]: {
        ELEMENT: document.getElementById("messageSuccess"),
        CSS: "success"
    },
    [MESSAGE_LEVEL.LOADING]: {
        ELEMENT: document.getElementById("messageLoading"),
        CSS: "info"
    }
});

/**
 * Hide error message.
 *
 * @function
 * @returns {void}
 */
export function hideWarning() {
    MessageRegister.hideMessage(MESSAGE_LEVEL.WARN);
}

/**
 * Hide info message.
 *
 * @function
 * @returns {void}
 */
export function hideInfo() {
    MessageRegister.hideMessage(MESSAGE_LEVEL.INFO);
}

/**
 * Hide loading message.
 *
 * @function
 * @returns {void}
 */
export function hideLoading() {
    MessageRegister.hideMessage(MESSAGE_LEVEL.LOADING);
}

/**
 * Hide success message.
 *
 * @function
 * @returns {void}
 */
export function hideSuccess() {
    MessageRegister.hideMessage(MESSAGE_LEVEL.SUCCESS);
}

/**
 * Show a critical error.
 *
 * Note this should only be used to show *short* error messages, which are
 * meaningfull to the user, as the space is limited. So it is mostly only
 * useful to use only one param: a string.
 * Also pay attention to the fact, that it currently can only show one error
 * once.
 *
 * @function
 * @param {string} message optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
 * @param {Object} actionButton optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showError(...args) {
    args.unshift(MESSAGE_LEVEL.ERROR);
    MessageRegister.showMessage(...args);
}

/**
 * Show an warning message.
 *
 * @function
 * @param {string} message optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
 * @param {Object} actionButton optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showWarning(...args) {
    args.unshift(MESSAGE_LEVEL.WARN);
    MessageRegister.showMessage(...args);
}

/**
 * Show an info message.
 *
 * @function
 * @param {string} message optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
 * @param {Object} actionButton optional to show an action button
 * @param {string} actionButton.text
 * @param {string} actionButton.link URL to site to open on link
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showInfo(...args) {
    args.unshift(MESSAGE_LEVEL.INFO);
    MessageRegister.showMessage(...args);
}

/**
 * Shows a loading message.
 *
 * @function
 * @param {string} message optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
 * @param {Object} actionButton optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showLoading(...args) {
    args.unshift(MESSAGE_LEVEL.LOADDING);
    MessageRegister.showMessage(...args);
}

/**
 * Show a success message.
 *
 * @function
 * @param {string} message optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
 * @param {Object} actionButton optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showSuccess(...args) {
    args.unshift(MESSAGE_LEVEL.SUCCESS);
    MessageRegister.showMessage(...args);
}

/**
 * Let's other functions set a hook to be called when a message type is
 * shown or hidden.
 *
 * Set parameters to null or undefined (i.e. do not set) in order to disable
 * the hook.
 * The errorShown function gets one parameter: The arguments passed to the
 * function, as an array.
 *
 * @function
 * @param  {MESSAGE_LEVEL|HtmlElement} messagetype use string "global" for a global hook
 * @param {function|null} hookShown
 * @param {function|null} hookHidden
 * @returns {void}
 */
export function setHook(messagetype, hookShown, hookHidden) {
    MessageRegister.setHook(messagetype, MessageRegister.HOOK_TYPE.SHOW, hookShown);
    MessageRegister.setHook(messagetype, MessageRegister.HOOK_TYPE.HIDE, hookHidden);
}

/**
 * Called when a message is dismissed.
 *
 + When called, the function does not know, which message is hidden, but you
 * can determinante it by yourself.
 * The called hook gets an object with two parameters:
 * - {HTMLElement} elMessage – the message element, which was hidden
 * - {event} event – the original click even on the dismiss button
 *
 * @function
 * @param {function|null} startHook
 * @param {function|null} endHook
 * @returns {void}
 */
export function setDismissHooks(startHook, endHook) {
    MessageRegister.setHook(MessageRegister.GLOBAL_HOOK_ID, MessageRegister.HOOK_TYPE.DISMISS_START, startHook);
    MessageRegister.setHook(MessageRegister.GLOBAL_HOOK_ID, MessageRegister.HOOK_TYPE.DISMISS_END, endHook);
}

/**
 * Initialises the module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    /* add templates */
    for (const [messageType, messagerData] of Object.keys(PREDEFINED_TYPES)) {
        const {ELEMENT: elMessage, CSS: cssClass} = messagerData;

        MessageRegister.registerMessageType(messageType, elMessage, cssClass);
    }
}

// init module automatically
init();

Logger.logInfo("MessageHandler module loaded.");
