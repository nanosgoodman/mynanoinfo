/*  MyNanoInfo – copy helper v3
    Adds one copy-button next to any nano_ address OR 64-char block hash.
    Works for static and dynamically-inserted content.
--------------------------------------------------------------------*/
(function ($) {

    /* recognise addresses and hashes */
    const RX_ADDR = /^nano_[a-z0-9]{60,}$/i;
    const RX_HASH = /^[a-f0-9]{64}$/i;

    /* returns “address”, “hash”, or empty string */
    function typeOf(text) {
        if (RX_ADDR.test(text)) return 'address';
        if (RX_HASH.test(text)) return 'hash';
        return '';
    }

    /* build button HTML on the fly because tooltip differs */
    function buttonHtml(t) {
        const title = t === 'hash' ? 'Copy hash' : 'Copy address';
        return `<button class="copy-btn" title="${title}" aria-label="Copy to clipboard">
                    <i class="fa fa-copy" aria-hidden="true"></i>
                </button>`;
    }

    /* toast */
    function toast(msg) {
        let $t = $('#copyToast');
        if (!$t.length) $t = $('<div id="copyToast"></div>').appendTo('body');
        $t.text(msg).css('opacity', 1);
        setTimeout(() => $t.css('opacity', 0), 1700);
    }

    /* clipboard */
    function copy(text) {
        (navigator.clipboard
            ? navigator.clipboard.writeText(text)
            : Promise.resolve().then(() => {
                const $tmp = $('<textarea>').val(text).appendTo('body').select();
                document.execCommand('copy'); $tmp.remove();
            })
        ).then(() => toast('Copied'));
    }

    /* attach one button after $target; t  {address,hash} */
    function attach($target, txtType, value) {
        if ($target.data('copy-attached')) return;

        $(buttonHtml(txtType))
            .insertAfter($target)
            .on('click', e => { e.preventDefault(); copy(value); });

        $target.data('copy-attached', 1);
    }

    /* core scanner (works for element OR text node) */
    function scan(node) {

        /* text-node directly */
        if (node.nodeType === 3) {
            const txt = node.nodeValue.trim();
            const kind = typeOf(txt); if (!kind) return;

            const $parentA = $(node).closest('a');
            if ($parentA.length) {
                attach($parentA, kind, txt);
            } else {
                const $span = $('<span>').text(txt);
                $(node).replaceWith($span);
                attach($span, kind, txt);
            }
            return;
        }

        const $node = $(node);

        /* element itself might be an <a> */
        if (node.tagName === 'A') {
            const t = typeOf($node.text().trim());
            if (t) attach($node, t, $node.text().trim());
        }

        /* descendant text-nodes */
        $node.contents().filter(function () {
            return this.nodeType === 3 && typeOf(this.nodeValue.trim());
        }).each(function () { scan(this); });

        /* descendant <a> elements */
        $node.find('a').each(function () {
            const t = typeOf($(this).text().trim());
            if (t) attach($(this), t, $(this).text().trim());
        });
    }

    /* observer catches new nodes and text changes */
    const obs = new MutationObserver(list => {
        list.forEach(m => {
            m.addedNodes.forEach(n => scan(n));
            if (m.type === 'characterData') scan(m.target);
        });
    });

    /* init */
    $(function () {
        scan(document.body);
        obs.observe(document.body, {
            childList: true,
            characterData: true,
            subtree: true
        });
    });

})(jQuery);