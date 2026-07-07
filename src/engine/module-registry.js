// AI Shorts Studio v0.9.3 - modular engine registry
'use strict';

(function exposeModuleRegistry(global) {
    function now() {
        return global.performance && global.performance.now ? global.performance.now() : Date.now();
    }

    function cloneLite(value) {
        if (!value || typeof value !== 'object') return value;
        try { return JSON.parse(JSON.stringify(value)); } catch (error) { return value; }
    }

    function createRegistry(namespace) {
        const modules = [];
        const events = [];

        function normalizeModule(module) {
            if (!module || typeof module !== 'object') throw new Error('등록할 엔진 모듈이 없습니다.');
            if (!module.id) throw new Error('엔진 모듈 id가 필요합니다.');
            return Object.freeze(Object.assign({
                version: '0.9.3',
                stage: 'utility',
                priority: 100,
                enabled: true,
                capabilities: [],
                hooks: {}
            }, module));
        }

        function register(module) {
            const normalized = normalizeModule(module);
            const exists = modules.findIndex(item => item.id === normalized.id);
            if (exists >= 0) modules.splice(exists, 1, normalized);
            else modules.push(normalized);
            modules.sort((a, b) => Number(a.priority || 100) - Number(b.priority || 100) || String(a.id).localeCompare(String(b.id)));
            events.unshift({ type: 'register', id: normalized.id, stage: normalized.stage, at: new Date().toISOString() });
            return normalized;
        }

        function list(stage) {
            return modules.filter(module => module.enabled !== false && (!stage || module.stage === stage));
        }

        function snapshot() {
            return {
                namespace: namespace || 'ai-shorts-engine',
                count: modules.length,
                modules: modules.map(module => ({
                    id: module.id,
                    version: module.version,
                    stage: module.stage,
                    priority: module.priority,
                    capabilities: cloneLite(module.capabilities || [])
                })),
                events: events.slice(0, 12)
            };
        }

        async function runHook(hookName, context, initialValue) {
            let value = initialValue;
            const started = now();
            for (const module of list()) {
                const hook = module.hooks && module.hooks[hookName];
                if (typeof hook !== 'function') continue;
                const before = now();
                try {
                    const next = await hook({ context, value, registry: api, module });
                    if (typeof next !== 'undefined') value = next;
                    events.unshift({ type: 'hook', hook: hookName, id: module.id, ms: Math.round(now() - before), at: new Date().toISOString() });
                } catch (error) {
                    events.unshift({ type: 'hook-error', hook: hookName, id: module.id, message: error.message, at: new Date().toISOString() });
                    if (context && typeof context.onWarning === 'function') context.onWarning(`엔진 모듈 ${module.id} 처리 실패: ${error.message}`);
                }
            }
            if (context && context.engineTimings) context.engineTimings[hookName] = Math.round(now() - started);
            return value;
        }

        const api = Object.freeze({ register, list, snapshot, runHook });
        return api;
    }

    global.AIShortsModuleRegistry = Object.freeze({ createRegistry });
})(window);
