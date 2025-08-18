const targetDomain = "roblox.com";

function isEditable(node) {
    // Check if node is inside an input, textarea, or contenteditable element
    let parent = node.parentNode;
    while (parent) {
        if (
            parent.nodeType === Node.ELEMENT_NODE &&
            (
                parent.tagName === "INPUT" ||
                parent.tagName === "TEXTAREA" ||
                parent.isContentEditable
            )
        ) {
            return true;
        }
        parent = parent.parentNode;
    }
    return false;
}

function isExcluded(node) {
    const excludedSelectors = [
        'div.avatar-name-container',
        '.username',
        '.profile-name',
        '[data-username]',
        '[data-profile-name]',
        '.avatar-name-container',
        '.keyword',
        '.navbar-search-input',
        '#navbar-search-input',
        'input#navbar-search-input.form-control.input-field.new-input-field',
        'div.game-card-name.game-name-title',
        'input.form-control.input-field.ng-pristine.ng-valid.ng-not-empty.ng-touched',
        'div.text-overflow.avatar-name.ng-binding.ng-scope',
        'div.input-group',
        'div.profile-header-details' // <-- Added here
    ];
    let parent = node.parentNode;
    while (parent) {
        if (parent.nodeType === Node.ELEMENT_NODE) {
            for (const selector of excludedSelectors) {
                if (parent.matches(selector)) {
                    return true;
                }
            }
            if (
                (parent.tagName === "INPUT" && parent.id === "navbar-search-input") ||
                (parent.tagName === "INPUT" && parent.getAttribute("ng-model") === "formData.keyword")
            ) {
                return true;
            }
        }
        parent = parent.parentNode;
    }
    return false;
}

function isWhitelisted(node) {
    // Direct matches
    if (node.matches('h1.friends-title')) return true;
    if (node.matches('a.rbx-tab-heading')) return true;
    if (node.matches('ul.profile-header-social-counts')) return true;

    // h2 inside specific containers
    if (
        node.matches('h2') &&
        (
            node.parentElement &&
            (
                node.parentElement.matches('div.container-header.people-list-header') ||
                node.parentElement.matches('div.friend-carousel-container') ||
                node.parentElement.matches('div.container-header')
            )
        )
    ) {
        // For div.container-header, only whitelist h2.friends-subtitle
        if (node.parentElement.matches('div.container-header') && !node.matches('h2.friends-subtitle')) {
            return false;
        }
        return true;
    }

    // span inside div.avatar-card-content
    if (
        node.matches('span.ng-binding.ng-scope') &&
        node.parentElement &&
        node.parentElement.matches('div.avatar-card-content')
    ) {
        return true;
    }

    return false;
}

function replaceInputPlaceholdersAndValues(root) {
    const inputs = root.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        // Skip excluded inputs
        if (isExcluded(input)) return;
        // Replace placeholder text
        if (input.placeholder) {
            input.placeholder = input.placeholder
                .replace(/\bConnections\b/g, "Friends")
                .replace(/\bConnection\b/g, "Friend");
        }
        // Replace value only if not focused
        if (document.activeElement !== input && input.value) {
            input.value = input.value
                .replace(/\bConnections\b/g, "Friends")
                .replace(/\bConnection\b/g, "Friend");
        }
    });
}

function replaceTextNodes(root) {
    // Find all whitelisted nodes
    const whitelistSelectors = [
        'h1.friends-title',
        'a.rbx-tab-heading',
        'ul.profile-header-social-counts',
        'div.container-header.people-list-header h2',
        'div.friend-carousel-container h2',
        'div.container-header h2.friends-subtitle',
        'div.avatar-card-content span.ng-binding.ng-scope'
    ];
    const whitelistedNodes = root.querySelectorAll(whitelistSelectors.join(', '));
    whitelistedNodes.forEach(node => {
        // Special handling for ul.profile-header-social-counts
        if (node.matches('ul.profile-header-social-counts')) {
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.nodeValue = child.nodeValue
                        .replace(/\bConnections\b/g, "Friends")
                        .replace(/\bConnection\b/g, "Friend")
                        .replace(/Connect/g, "Friends");
                }
            });
            return;
        }
        // Special handling for h1.friends-title: only replace the last word
        if (node.matches('h1.friends-title')) {
            let words = node.textContent.trim().split(/\s+/);
            let lastWord = words[words.length - 1];
            if (lastWord === "Connections") {
                words[words.length - 1] = "Friends";
                node.textContent = words.join(" ");
            } else if (lastWord === "Connection") {
                words[words.length - 1] = "Friend";
                node.textContent = words.join(" ");
            }
            // If last word doesn't match, do not change textContent
            return;
        }

        // Special handling for h2.friends-subtitle: only replace text node fragments
        if (node.matches('h2.friends-subtitle')) {
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.nodeValue = child.nodeValue
                        .replace(/\bConnections\b/g, "Friends")
                        .replace(/\bConnection\b/g, "Friend")
                        .replace(/Connect/g, "Friends");
                } else if (child.nodeType === Node.ELEMENT_NODE && child.title) {
                    child.title = child.title
                        .replace(/\bConnections\b/g, "Friends")
                        .replace(/\bConnection\b/g, "Friend")
                        .replace(/Connect/g, "Friends");
                }
            });
            return;
        }
        // Preserve child elements when doing replacements so numeric spans aren't removed
        if (node.childNodes.length === 1 && node.childNodes[0].nodeType === Node.TEXT_NODE) {
            node.childNodes[0].nodeValue = node.childNodes[0].nodeValue
                .replace(/\bConnections\b/g, "Friends")
                .replace(/\bConnection\b/g, "Friend")
                .replace(/Connect/g, "Friends");
        } else {
            node.childNodes.forEach(child => {
                if (child.nodeType === Node.TEXT_NODE) {
                    child.nodeValue = child.nodeValue
                        .replace(/\bConnections\b/g, "Friends")
                        .replace(/\bConnection\b/g, "Friend")
                        .replace(/Connect/g, "Friends");
                } else if (child.nodeType === Node.ELEMENT_NODE) {
                    if (child.title) {
                        child.title = child.title
                            .replace(/\bConnections\b/g, "Friends")
                            .replace(/\bConnection\b/g, "Friend")
                            .replace(/Connect/g, "Friends");
                    }
                    // also replace direct text children inside element children
                    child.childNodes.forEach(grand => {
                        if (grand.nodeType === Node.TEXT_NODE) {
                            grand.nodeValue = grand.nodeValue
                                .replace(/\bConnections\b/g, "Friends")
                                .replace(/\bConnection\b/g, "Friend")
                                .replace(/Connect/g, "Friends");
                        }
                    });
                }
            });
        }
        if (node.title) {
            node.title = node.title
                .replace(/\bConnections\b/g, "Friends")
                .replace(/\bConnection\b/g, "Friend")
                .replace(/Connect/g, "Friends");
        }
    });

    // Targeted replacement for span.font-header-2.dynamic-ellipsis-item
    const specialSpans = root.querySelectorAll('span.font-header-2.dynamic-ellipsis-item');
    specialSpans.forEach(span => {
        if (span.textContent.includes("Connect")) {
            span.textContent = span.textContent.replace(/Connect/g, "Friends");
        }
        if (span.title && span.title.includes("Connect")) {
            span.title = span.title.replace(/Connect/g, "Friends");
        }
    });

    // Targeted replacement for span.profile-header-social-count-label inside div.profile-header-details
    const profileHeaderDetails = root.querySelectorAll('div.profile-header-details');
    profileHeaderDetails.forEach(detailDiv => {
        const labels = detailDiv.querySelectorAll('span.profile-header-social-count-label');
        labels.forEach(label => {
            if (label.textContent.includes("Connections")) {
                label.textContent = label.textContent.replace(/\bConnections\b/g, "Friends").replace(/\bConnection\b/g, "Friend");
            }
            if (label.title && label.title.includes("Connections")) {
                label.title = label.title.replace(/\bConnections\b/g, "Friends").replace(/\bConnection\b/g, "Friend");
            }
        });
    });

    const textNodes = document.evaluate(
        ".//text()",
        root,
        null,
        XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
        null
    );
    for (let i = 0; i < textNodes.snapshotLength; i++) {
        const node = textNodes.snapshotItem(i);
        if (
            node.nodeType === Node.TEXT_NODE &&
            !isEditable(node) &&
            !isExcluded(node)
        ) {
            node.nodeValue = node.nodeValue.replace(/\bConnections\b/g, "Friends").replace(/\bConnection\b/g, "Friend");
        }
    }
    // Also replace placeholders and values in inputs/textareas
    if (root instanceof Element || root === document) {
        replaceInputPlaceholdersAndValues(root);
    }
}

if (window.location.hostname.endsWith(targetDomain)) {
    // Initial replace
    replaceTextNodes(document);

    // Observe changes
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    replaceTextNodes(node);
                }
            }
        }
        // Do NOT call replaceTextNodes(document) here!
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}