// lodash
import isFunction from "/common/modules/lib/lodash/isFunction.js";

import * as Logger from "/common/modules/Logger.js";

const elementByType = new Map();
const styleClassByType = new Map();
const hooks = new Map();

export const HOOK_TYPE = {
    SHOW: Symbol("hook type: show"),
    HIDE: Symbol("hook type: hide"),
    DISMISS_START: Symbol("hook type: dismissStart"),
    DISMISS_END: Symbol("hook type: dismissEnd"),
    ACTION_BUTTON: Symbol("hook type: actionButton")
};

const HOOK_TEMPLATE = Object.freeze({
    [HOOK_TYPE.SHOW]: null,
    [HOOK_TYPE.HIDE]: null,
    [HOOK_TYPE.DISMISS_START]: null,
    [HOOK_TYPE.DISMISS_END]: null,
    [HOOK_TYPE.ACTION_BUTTON]: null
},);

export const GLOBAL_HOOK_ID = Symbol("hook: global");

const hookXs = {
    "global": {
        "show": null,
        "hide": null,
        "dismissStart": null,
        "dismissEnd": null,
        "actionButton": null
    },
    [MESSAGE_LEVEL.ERROR]: {
        "show": null,
        "hide": null,
        "actionButton": null
    },
    [MESSAGE_LEVEL.WARN]: {
        "show": null,
        "hide": null,
        "actionButton": null
    },
    [MESSAGE_LEVEL.INFO]: {
        "show": null,
        "hide": null,
        "actionButton": null
    },
    [MESSAGE_LEVEL.SUCCESS]: {
        "show": null,
        "hide": null,
        "actionButton": null
    },
    [MESSAGE_LEVEL.LOADING]: {
        "show": null,
        "hide": null,
        "actionButton": null
    },
};

/**
 * Returns the message type (ID) of a custom message.
 *
 * @function
 * @private
 * @param  {HTMLElement} elMessage
 * @returns {string}
 * @throws {Error}
 */
function getCustomMessageType(elMessage) {
    // verify it is a real message box
    if (!elMessage.classList.contains("message-box")) {
        throw new Error(`message element ${elMessage} is no real message box`);
    }

    // use ID of element as message type
    return elMessage.id;
}

/**
 * Returns the message type based on the passed element.
 *
 * @function
 * @private
 * @param  {HTMLElement} elMessage
 * @returns {MESSAGE_LEVEL|HTMLElement}
 * @throws {Error}
 */
function getMessageTypeFromElement(elMessage) {
    let messagetype = elementByType.keys().find((messagetype) => {
        // skip, if element does not exist
        if (!elementByType.has(messagetype)) {
            return false;
        }

        return elementByType.get(messagetype).isEqualNode(elMessage);
    });

    if (messagetype === undefined) {
        // this throws if it is no real (custom) message
        messagetype = getCustomMessageType(elMessage);
    }

    return messagetype;
}

/**
 * Returns the HTMLElement based on the passed message type.
 *
 * It supports custom elements, i.e. when the element itself is already passed.
 * Because of that, it returns both the message type back as a string and the
 * HTMLElement.
 * As an addition it returns a boolean as the last variable, which is true
 * when the element is a custom message.
 * Note that it does not verify whether the DOM element actualyl exists.
 *
 * @function
 * @private
 * @param {MESSAGE_LEVEL|HTMLElement} messagetype
 * @returns {Array.<string, HTMLElement, boolean>}
 * @throws {Error}
 */
function getElementFromMessageType(messagetype) {
    let elMessage,
        isCustomMessage = false;

    if (messagetype instanceof HTMLElement) {
        // handle custom messages first
        elMessage = messagetype;

        messagetype = getCustomMessageType(elMessage);

        isCustomMessage = true;
    } else if (elementByType.has(messagetype)) {
        // verify string message types are valid
        elMessage = elementByType.get(messagetype);
    } else {
        throw new Error(`message type ${messagetype} is/belong to an unknown element`);
    }

    return [messagetype, elMessage, isCustomMessage];
}

/**
 * Runs a hook set by some module.
 *
 * It automatically also runs the global hook, but you can still specify a
 * 'global' to ruin it manually.
 *
 * @function
 * @private
 * @param  {MESSAGE_LEVEL|global} messagetype
 * @param  {HOOK_TYPE} hooktype the type you want to call
 * @param  {Object} param the parameter to pass to the function
 * @returns {void}
 */
function runHook(messagetype, hooktype, param) {
    // when not global itself -> to prevent infinite loop
    if (hooktype !== GLOBAL_HOOK_ID) {
        // recursively run myself for global hook first
        runHook(messagetype, GLOBAL_HOOK_ID, param);
    }

    const hook = hooks.get(messagetype).hooktype;
    if (hook !== null && hook !== undefined) {
        hook(param);
    }
}

/**
 * Dismisses (i.e. hides with animation) a message when the dismiss button is clicked.
 *
 * It automatically detects whether it is run as a trigger (click event) or
 * as the "finish event" ("transitionend") after the hiding is animated and
 * hides the message.
 *
 * @function
 * @private
 * @param  {Object} event
 * @returns {void}
 */
function dismissMessage(event) {
    // if button is just clicked triggere hiding
    if (event.type === "click") {
        const elDismissIcon = event.target;
        const elMessage = elDismissIcon.parentElement;
        const messagetype = getMessageTypeFromElement(elMessage);

        // ignore event, if it is not the correct one from the message box
        if (!elMessage.classList.contains("message-box")) {
            return;
        }

        // trigger hiding
        elMessage.classList.add("fade-hide");

        // add handler to hide message completly after transition
        elMessage.addEventListener("transitionend", dismissMessage);

        runHook(messagetype, "dismissStart", {
            elMessage,
            event
        });

        Logger.logInfo("message is dismissed", event);
    } else if (event.type === "transitionend") {
        const elMessage = event.target;
        const messagetype = getMessageTypeFromElement(elMessage);

        // hide message (and icon)
        hideMessage(elMessage);

        runHook(messagetype, "dismissEnd", {
            elMessage,
            event
        });

        // remove set handler
        elMessage.removeEventListener("transitionend", dismissMessage);
    }
}

/**
 * The action button event handler, when clicked.
 *
 * @function
 * @private
 * @param  {Object} event
 * @returns {void}
 */
function actionButtonClicked(event) {
    const elActionButtonLink = event.currentTarget;
    const elMessage = elActionButtonLink.parentNode;

    const messagetype = getMessageTypeFromElement(elMessage);

    Logger.logInfo("action button clicked for ", messagetype, event);

    runHook(messagetype, "actionButton", {
        elMessage,
        messagetype,
        event
    });
}

/**
 * Returns the design this message resembles.
 *
 * Please DO NOT use this with the built-in message elements.
 *
 * @function
 * @param  {HTMLElement} elMessage
 * @param  {MESSAGE_LEVEL} newDesignType
 * @returns {void}
 * @deprecated Use cloneMessage HTML instead.
 */
export function setMessageDesign(elMessage, newDesignType) {
    const newDesign = elementByType.get(newDesignType);
    const elActionButton = elMessage.getElementsByClassName("message-action-button")[0];

    // set new design
    elMessage.classList.add(newDesign);
    elActionButton.classList.add(newDesign);

    // unset old design
    elementByType.keys().forEach((oldDesign) => {
        if (oldDesign === newDesign) {
            return;
        }

        elMessage.classList.remove(oldDesign);
        elActionButton.classList.remove(oldDesign);
    });
}

/**
 * Shows a message to the user.
 *
 * Pass as many strings/output as you want. They will be localized
 * automatically, before presented to the user.
 *
 * If you pass a HTMLElement as the first parameter, you can use your own
 * custom node for the message.
 * Attention: This is a "low-level function" and does thus not run the show hook!
 *
 * @function
 * @param {MESSAGE_LEVEL|HTMLElement} messagetype
 * @param {string} message optional, string to show or to translate if omitted no new text is shown
 * @param {boolean} isDismissable optional, set to true, if user should be able to dismiss the message
 * @param {Object} actionButton optional to show an action button
 * @param {string} actionButton.text
 * @param {string|function} actionButton.action URL to site to open on link OR function to execute
 * @param {...*} args optional parameters for translation
 * @returns {void}
 */
export function showMessage(...args) {
    if (arguments.length < 0) {
        Logger.logError("MessageHandler.showMessage has been called without parameters");
        return;
    }

    // also log message to console
    if (args[0] instanceof HTMLElement) {
        Logger.logInfo(...args);
    } else {
        Logger.log(...args);
    }

    // get first element
    const [messagetype, elMessage, isCustomMessage] = getElementFromMessageType(args.shift());

    if (isCustomMessage) {
        // automatically register/setup hook object when new message is passed
        if (hooks[messagetype] === undefined) {
            hooks[messagetype] = {
                "show": null,
                "hide": null,
                "actionButton": null
            };
        }
    }

    // and stuff inside we need later
    const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];
    const elActionButton = elMessage.getElementsByClassName("message-action-button")[0];
    let elActionButtonLink = null;
    if (elActionButton) {
        elActionButtonLink = elActionButton.parentNode;
    }

    // a custom element also needs the custom listeners to be set
    if (messagetype instanceof HTMLElement) {
        elDismissIcon.addEventListener("click", dismissMessage);
        elActionButtonLink.addEventListener("click", actionButtonClicked);
    }

    if (!elMessage) {
        Logger.logError("The message could not be shown, because the DOM element is missing.", messagetype, args);
        return;
    }

    /* check value type/usage of first argument */
    let mainMessage = null;
    let isDismissable = false; // not dismissable by default
    let actionButton = null; // no action button by default

    if (typeof args[0] === "string") {
        mainMessage = args.shift();
    }
    if (typeof args[0] === "boolean") {
        isDismissable = args.shift();
    }
    if (args[0] !== undefined && args[0].text !== undefined && args[0].action !== undefined) {
        actionButton = args.shift();
    }

    // localize string or fallback to first string ignoring all others
    if (mainMessage !== null) {
        // add message to beginning of array
        args.unshift(mainMessage);

        const localizedString = browser.i18n.getMessage.apply(null, args) || mainMessage || browser.i18n.getMessage("errorShowingMessage");
        elMessage.getElementsByClassName("message-text")[0].textContent = localizedString;
    }

    if (isDismissable === true && elDismissIcon) {
        // add an icon which dismisses the message if clicked
        elDismissIcon.classList.remove("invisible");
    } else if (elDismissIcon) {
        elDismissIcon.classList.add("invisible");
    }

    // show action button, if needed
    if (actionButton !== null && elActionButton && elActionButtonLink) {
        if (isFunction(actionButton.action)) {
            // save option to be called later
            hooks[messagetype].actionButton = actionButton.action;

            // potentiall remove previous set thing
            elActionButtonLink.removeAttribute("href");
        } else {
            elActionButtonLink.setAttribute("href", actionButton.action);

            // unset potential previously set handler
            hooks[messagetype].actionButton = null;
        }

        elActionButton.textContent = browser.i18n.getMessage(actionButton.text) || actionButton.text;
        elActionButton.classList.remove("invisible");
    } else if (elActionButton) {
        elActionButton.classList.add("invisible");
    }

    elMessage.classList.remove("invisible");
    elMessage.classList.remove("fade-hide");

    // TODO: adjust arguments
    // export function showSuccess(...args) {
    //    runHook(MESSAGE_LEVEL.SUCCESS, "show", args);

    runHook(messagetype, HOOK_TYPE.SHOW);
}

/**
 * Hides the message type(s), you specify.
 *
 * If you pass no messagetype or "null", it hides all messages. (except custom ones)
 * If a HTMLElement is passed, it automatically hides the target of the event.
 * Attention: This is a "low-level function" and does thus not run the hide hook!
 *
 * @function
 * @param  {MESSAGE_LEVEL|null|HTMLElement} messagetype
 * @returns {void}
 */
export function hideMessage(messagetype) {
    // hide all messages if type is not specified
    if (messagetype === null || messagetype === undefined) {
        // hide all of them
        elementByType.forEach((currentType) => {
            // recursive call myself to hide element
            hideMessage(currentType);
        });

        return;
    }

    const [, elMessage] = getElementFromMessageType(messagetype);

    // hide single message
    const elDismissIcon = elMessage.getElementsByClassName("icon-dismiss")[0];

    elMessage.classList.add("invisible");
    if (elDismissIcon) {
        elDismissIcon.classList.add("invisible");
    }

    Logger.logInfo("message is hidden", elMessage);

    runHook(messagetype, HOOK_TYPE.HIDE);

    return;
}

/**
 * Clones a message HTMLElement you specify.
 *
 * It sorts the message directly after the message you clone.
 * The message is hidden by default – regardless of the state of the origin
 * message (type).
 *
 * CURRENTLY UNUSED; UNTESTED!!
 *
 * @function
 * @param  {MESSAGE_LEVEL|HTMLElement} messagetype
 * @param  {string} newId New ID to use for that element
 * @returns {HTMLElement}
 */
export function cloneMessage(messagetype, newId) {
    let elMessage = null;

    [messagetype, elMessage] = getElementFromMessageType(messagetype);

    // clone message
    const closedElMessage = elMessage.cloneNode(elMessage);
    closedElMessage.id = newId;

    // hide the message to reset it if needed
    hideMessage(closedElMessage);

    // attach to DOM
    elMessage.insertAdjacentElement("afterend", closedElMessage);

    return closedElMessage;
}

/**
 * Changes a message hook for a specific message type.
 *
 * You can use the messagetype GLOBAL_HOOK_ID to set a global hook for all
 * message types.
 *
 * @function
 * @param {MESSAGE_LEVEL|GLOBAL_HOOK_ID} messagetype
 * @param {HOOK_TYPE} hooktype the type you want to call
 * @param {function|null} hookFunction
 * @returns {void}
 */
export function setHook(messagetype, hooktype, hookFunction) {
    const hook = hooks.get(messagetype);
    // hook.set(hooktype, hookFunction);
    hooktype[hooktype] = hookFunction;
    hooks.set(messagetype, hook);
}

/**
 * Registers a new message type.
 *
 * It requires a HTML element and class to be passed.
 *
 * @function
 * @param  {MESSAGE_LEVEL|string} messagetype
 * @param {HTMLElement} elElement
 * @param {string} cssClass
 * @returns {void}
 */
export function registerMessageType(messagetype, elElement, cssClass) {
    elementByType.add(messagetype, elElement);
    styleClassByType.add(messagetype, cssClass);
    hooks.add(messagetype, HOOK_TEMPLATE);

    /* add event listeners */
    const dismissIcons = elElement.getElementsByClassName("icon-dismiss");

    for (const elDismissIcon of dismissIcons) {
        // hide message when dismiss button is clicked
        elDismissIcon.addEventListener("click", dismissMessage);
    }

    const actionButtons = elElement.getElementsByClassName("message-action-button");

    for (const elActionButton of actionButtons) {
        const elActionButtonLink = elActionButton.parentElement;
        elActionButtonLink.addEventListener("click", actionButtonClicked);
    }

}

/**
 * Initialises the module.
 *
 * @function
 * @returns {void}
 */
export function init() {
    hooks.add(GLOBAL_HOOK_ID, HOOK_TEMPLATE);
}

// init module automatically
init();

Logger.logInfo("MessagRegister module loaded.");
