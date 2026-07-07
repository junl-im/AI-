// AI Shorts Studio v0.1.0 - minimal site guards
'use strict';

(function installSiteGuards(global) {
    function installExitGuard(getDirty) {
        global.addEventListener('beforeunload', event => {
            if (!getDirty || !getDirty()) return;
            event.preventDefault();
            event.returnValue = '';
        });
    }

    function blockDropNavigation() {
        ['dragover', 'drop'].forEach(type => {
            document.addEventListener(type, event => {
                const target = event.target;
                if (target && target.closest && target.closest('#dropZone')) return;
                event.preventDefault();
            });
        });
    }

    global.AIShortsSiteGuards = Object.freeze({ installExitGuard, blockDropNavigation });
})(window);
