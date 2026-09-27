/*
 * Adds a "Copy" button to every example code block.
 *
 * The button is wrapped together with the <pre> in a .code-wrap element,
 * because .prettyprint scrolls horizontally - a button placed inside it
 * would scroll away with the content.
 *
 * Load with: <script src="scripts/copycode.js" defer></script>
 */
(function () {
    'use strict';

    var SVG_OPEN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"' +
        ' stroke-width="1.5" stroke-linecap="round"' +
        ' stroke-linejoin="round" aria-hidden="true" focusable="false"';

    // two stacked sheets
    var ICON_COPY = SVG_OPEN + ' class="copy-icon-copy">' +
        '<rect x="9" y="9" width="11" height="11" rx="2"></rect>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>' +
        '</svg>';

    // check mark
    var ICON_DONE = SVG_OPEN + ' class="copy-icon-done">' +
        '<path d="M20 6 9 17l-5-5"></path>' +
        '</svg>';

    var LABEL_COPY = 'Copy code to clipboard';
    var LABEL_DONE = 'Copied';
    var LABEL_FAILED = 'Copying failed - please use Ctrl+C';

    function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        }
        // Fallback for file:// and plain http://
        return new Promise(function (resolve, reject) {
            var ta = document.createElement('textarea');
            ta.value = text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            document.body.appendChild(ta);
            ta.select();
            try {
                if (document.execCommand('copy')) {
                    resolve();
                } else {
                    reject();
                }
            } catch (e) {
                reject(e);
            }
            document.body.removeChild(ta);
        });
    }

    function addButton(pre) {
        // Whole source files get no button - they are far too long to copy
        if (pre.classList.contains('source')) {
            return;
        }

        var code = pre.querySelector('code');
        if (!code) {
            return;
        }

        var wrap = document.createElement('div');
        wrap.className = 'code-wrap';
        pre.parentNode.insertBefore(wrap, pre);
        wrap.appendChild(pre);

        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'copy-button';
        btn.title = LABEL_COPY;
        btn.setAttribute('aria-label', LABEL_COPY);
        // Two icons, sheets and a check mark; the CSS shows one at a time
        btn.innerHTML = ICON_COPY + ICON_DONE;

        btn.addEventListener('click', function () {
            // textContent skips the syntax spans prettify inserts, so the
            // clipboard gets the plain source including line breaks
            copyText(code.textContent).then(function () {
                btn.classList.remove('is-failed');
                btn.classList.add('is-done');
                btn.title = LABEL_DONE;
                btn.setAttribute('aria-label', LABEL_DONE);
            }, function () {
                btn.classList.remove('is-done');
                btn.classList.add('is-failed');
                btn.title = LABEL_FAILED;
                btn.setAttribute('aria-label', LABEL_FAILED);
            });

            window.setTimeout(function () {
                btn.classList.remove('is-done', 'is-failed');
                btn.title = LABEL_COPY;
                btn.setAttribute('aria-label', LABEL_COPY);
            }, 1600);
        });

        wrap.appendChild(btn);
    }

    Array.prototype.forEach.call(
        document.querySelectorAll('pre.prettyprint'),
        addButton
    );
})();