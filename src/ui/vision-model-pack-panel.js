// AI Shorts Studio v1.6.13 - compact model performance diagnostics and safe rollback controls
'use strict';

(function installVisionModelPackPanel(global) {
    const doc = global.document;
    const manager = global.AIShortsVisionModelPacks;
    if (!doc || !manager) return;

    const els = {};
    let busy = false;

    function byId(id) { return doc.getElementById(id); }

    function toast(message, kind) {
        const feedback = global.AIShortsFeedbackUX;
        if (feedback && typeof feedback.toast === 'function') feedback.toast(message, kind || 'action');
    }

    function setBusy(next, label) {
        busy = Boolean(next);
        ['visionPackSelect', 'visionPackBackend', 'visionPackInstallBtn', 'visionPackActivateBtn', 'visionPackVerifyBtn', 'visionPackRemoveBtn', 'visionPackDeactivateBtn', 'visionPackBenchmarkBtn', 'visionPackRollbackBtn'].forEach(id => {
            const control = els[id];
            if (control) control.disabled = busy || control.dataset.noPack === 'true';
        });
        if (els.visionPackProgress) {
            els.visionPackProgress.hidden = !busy;
            if (!busy) els.visionPackProgress.value = 0;
        }
        if (busy && label && els.visionPackDetail) els.visionPackDetail.textContent = label;
    }

    function updateProgress(value, text) {
        if (els.visionPackProgress) {
            els.visionPackProgress.hidden = false;
            els.visionPackProgress.value = Math.max(0, Math.min(100, Number(value) || 0));
        }
        if (text && els.visionPackDetail) els.visionPackDetail.textContent = text;
    }

    function selectedPackId() {
        return String(els.visionPackSelect && els.visionPackSelect.value || '');
    }

    function render() {
        const snapshot = manager.snapshot();
        const packs = Array.from(snapshot.packs || []);
        const selected = selectedPackId() || snapshot.selected.packId || packs[0] && packs[0].id || '';
        if (els.visionPackSelect) {
            const signature = packs.map(pack => `${pack.id}:${pack.verification}:${pack.totalBytes}`).join('|');
            if (els.visionPackSelect.dataset.signature !== signature) {
                els.visionPackSelect.textContent = '';
                const empty = doc.createElement('option');
                empty.value = '';
                empty.textContent = packs.length ? '모델 팩 선택' : '설치된 모델 팩 없음';
                els.visionPackSelect.appendChild(empty);
                packs.forEach(pack => {
                    const option = doc.createElement('option');
                    option.value = pack.id;
                    option.textContent = `${pack.label}${pack.runtimeVersion ? ` ${pack.runtimeVersion}` : ''} · ${pack.sizeLabel}`;
                    els.visionPackSelect.appendChild(option);
                });
                els.visionPackSelect.dataset.signature = signature;
            }
            els.visionPackSelect.value = packs.some(pack => pack.id === selected) ? selected : '';
        }
        const pack = packs.find(item => item.id === selected) || null;
        const active = snapshot.runtime.active && snapshot.runtime.packId === selected;
        const ready = Boolean(pack);
        const capabilities = snapshot.capabilities || {};
        const performance = pack && snapshot.performance && snapshot.performance[pack.id] || { latest: [], recommendation: { backend: 'auto', reason: '측정 전', confidence: 'low' } };
        const recommendation = performance.recommendation || { backend: 'auto', reason: '측정 전', confidence: 'low' };
        const rollback = snapshot.rollback && snapshot.rollback.packId ? snapshot.packs.find(item => item.id === snapshot.rollback.packId) : null;
        if (els.visionPackBackend) {
            els.visionPackBackend.value = snapshot.selected.packId === selected ? snapshot.selected.backend : 'auto';
            els.visionPackBackend.disabled = busy || !ready;
            els.visionPackBackend.dataset.noPack = ready ? 'false' : 'true';
        }
        [els.visionPackActivateBtn, els.visionPackVerifyBtn, els.visionPackRemoveBtn, els.visionPackBenchmarkBtn].forEach(control => {
            if (!control) return;
            control.dataset.noPack = ready ? 'false' : 'true';
            control.disabled = busy || !ready;
        });
        if (els.visionPackDeactivateBtn) {
            els.visionPackDeactivateBtn.hidden = !active;
            els.visionPackDeactivateBtn.disabled = busy || !active;
            els.visionPackDeactivateBtn.dataset.noPack = active ? 'false' : 'true';
        }
        if (els.visionPackActivateBtn) {
            els.visionPackActivateBtn.hidden = active;
            els.visionPackActivateBtn.textContent = '얼굴 추적 사용';
        }
        if (els.visionPackRollbackBtn) {
            els.visionPackRollbackBtn.hidden = !rollback;
            els.visionPackRollbackBtn.disabled = busy || !rollback;
            els.visionPackRollbackBtn.dataset.noPack = rollback ? 'false' : 'true';
            els.visionPackRollbackBtn.textContent = rollback ? `이전 모델로 복구` : '이전 모델 없음';
        }
        if (els.visionPackRecommendation) {
            const label = recommendation.backend === 'gpu' ? 'GPU 권장' : recommendation.backend === 'cpu' ? 'WASM CPU 권장' : '성능 측정 필요';
            els.visionPackRecommendation.textContent = label;
            els.visionPackRecommendation.dataset.backend = recommendation.backend || 'auto';
        }
        if (els.visionPackBenchmarkDetail) {
            const latest = Array.from(performance.latest || []);
            if (latest.length) {
                const summary = latest.map(item => item.status === 'passed'
                    ? `${item.backend === 'gpu' ? 'GPU' : 'CPU'} ${item.medianMs.toFixed(1)}ms · ${item.fps.toFixed(1)}fps`
                    : `${item.backend === 'gpu' ? 'GPU' : 'CPU'} 실패`).join(' / ');
                els.visionPackBenchmarkDetail.textContent = `${summary} · ${recommendation.reason}`;
            } else els.visionPackBenchmarkDetail.textContent = '이 장치에서 CPU·GPU 얼굴 감지 속도를 측정해 실행 방식을 추천합니다.';
        }
        if (els.visionPackStatus) {
            els.visionPackStatus.textContent = active
                ? `브라우저 얼굴 추적 사용 중 · ${snapshot.runtime.backend === 'gpu' ? 'GPU' : 'WASM'}`
                : pack && pack.verification === 'failed'
                    ? '모델 팩 손상 감지'
                    : pack
                        ? '설치 완료 · 사용 전 무결성 확인'
                        : '미설치 · 모션 추적 사용';
        }
        if (!busy && els.visionPackDetail) {
            if (snapshot.runtime.lastRecovery) els.visionPackDetail.textContent = `이전 모델로 안전 복구됨 · ${snapshot.runtime.lastRecovery.backend === 'gpu' ? 'GPU' : 'WASM CPU'}`;
            else if (snapshot.runtime.lastError) els.visionPackDetail.textContent = snapshot.runtime.lastError;
            else if (active) els.visionPackDetail.textContent = `${pack ? pack.sizeLabel : ''} · 로컬 파일만 사용 · 외부 전송 없음`;
            else if (pack) els.visionPackDetail.textContent = `${pack.fileCount}개 파일 · SHA-256 ${pack.verification === 'verified' ? '확인됨' : '재검사 필요'} · 모델 ${pack.modelDigest}`;
            else if (!capabilities.cacheStorage || !capabilities.sha256 || !capabilities.webAssembly) els.visionPackDetail.textContent = '이 브라우저에서는 모델 팩 저장 또는 실행을 지원하지 않습니다.';
            else els.visionPackDetail.textContent = '공식 MediaPipe Tasks Vision 런타임과 얼굴 모델이 담긴 폴더를 선택하세요.';
        }
        if (els.visionModelPackPanel) {
            els.visionModelPackPanel.dataset.state = active ? 'active' : pack && pack.verification === 'failed' ? 'error' : ready ? 'installed' : 'empty';
        }
    }

    async function installFiles(files) {
        if (!files || !files.length || busy) return;
        setBusy(true, '모델 팩 파일을 확인하고 있습니다.');
        try {
            const pack = await manager.installFromFiles(files, {
                label: 'MediaPipe 얼굴 감지',
                onProgress: updateProgress
            });
            if (els.visionPackSelect) els.visionPackSelect.value = pack.id;
            toast('브라우저 얼굴 감지 모델 팩을 설치했습니다.', 'success');
        } catch (error) {
            toast(error && error.message || '모델 팩을 설치하지 못했습니다.', 'error');
            if (els.visionPackDetail) els.visionPackDetail.textContent = error && error.message || '설치 실패';
        } finally {
            if (els.visionPackFolderInput) els.visionPackFolderInput.value = '';
            setBusy(false);
            render();
        }
    }

    async function verifySelected() {
        const id = selectedPackId();
        if (!id || busy) return;
        setBusy(true, '모델 팩 무결성을 확인하고 있습니다.');
        try {
            const result = await manager.verifyPack(id, { onProgress: updateProgress });
            if (!result.ok) throw new Error('저장된 모델 파일이 손상되었습니다. 모델 팩을 다시 설치해 주세요.');
            toast('모델 팩 SHA-256 무결성을 확인했습니다.', 'success');
        } catch (error) {
            toast(error && error.message || '무결성 검사에 실패했습니다.', 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function activateSelected() {
        const id = selectedPackId();
        if (!id || busy) return;
        setBusy(true, '브라우저 얼굴 감지기를 시작하고 있습니다.');
        try {
            const backend = els.visionPackBackend && els.visionPackBackend.value || 'auto';
            const runtime = await manager.activatePack(id, { backend, onProgress: updateProgress });
            if (runtime.recovered) toast('새 모델을 시작하지 못해 이전 모델로 안전 복구했습니다.', 'action');
            else toast(`브라우저 얼굴 추적을 ${runtime.backend === 'gpu' ? 'GPU' : 'WASM'} 모드로 시작했습니다.`, 'success');
        } catch (error) {
            toast(error && error.message || '모델 팩을 시작하지 못했습니다.', 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function benchmarkSelected() {
        const id = selectedPackId();
        if (!id || busy) return;
        setBusy(true, 'CPU·GPU 얼굴 감지 속도를 측정하고 있습니다.');
        try {
            const result = await manager.benchmarkPack(id, { onProgress: updateProgress });
            const recommended = result.recommendation.backend === 'gpu' ? 'GPU' : result.recommendation.backend === 'cpu' ? 'WASM CPU' : '자동';
            if (els.visionPackBackend && result.recommendation.backend !== 'auto') els.visionPackBackend.value = result.recommendation.backend;
            toast(`성능 측정 완료 · ${recommended} 실행을 권장합니다.`, 'success');
        } catch (error) {
            toast(error && error.message || '모델 성능을 측정하지 못했습니다.', 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function rollbackSelected() {
        if (busy) return;
        const snapshot = manager.snapshot();
        const rollback = snapshot.rollback && snapshot.rollback.packId ? snapshot.packs.find(item => item.id === snapshot.rollback.packId) : null;
        if (!rollback) return;
        const confirmed = typeof global.confirm !== 'function' || global.confirm(`${rollback.label} 모델로 복구할까요?
현재 프로젝트와 원본 파일은 변경되지 않습니다.`);
        if (!confirmed) return;
        setBusy(true, '이전 모델 팩을 확인하고 복구하고 있습니다.');
        try {
            const runtime = await manager.rollbackToPrevious({ onProgress: updateProgress });
            if (els.visionPackSelect) els.visionPackSelect.value = runtime.packId;
            toast('이전 얼굴 감지 모델로 안전하게 복구했습니다.', 'success');
        } catch (error) {
            toast(error && error.message || '이전 모델로 복구하지 못했습니다.', 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function deactivateSelected() {
        if (busy) return;
        setBusy(true, '브라우저 얼굴 추적을 종료하고 있습니다.');
        try {
            await manager.deactivate();
            toast('브라우저 얼굴 추적을 끄고 모션 추적으로 전환했습니다.', 'action');
        } finally {
            setBusy(false);
            render();
        }
    }

    async function removeSelected() {
        const id = selectedPackId();
        if (!id || busy) return;
        const pack = manager.findPack(id);
        const confirmed = typeof global.confirm !== 'function' || global.confirm(`${pack && pack.label || '선택한 모델 팩'}을 이 브라우저에서 삭제할까요?\n영상·프로젝트·원본 파일은 삭제되지 않습니다.`);
        if (!confirmed) return;
        setBusy(true, '모델 팩을 삭제하고 있습니다.');
        try {
            await manager.removePack(id);
            toast('브라우저 비전 모델 팩을 삭제했습니다.', 'success');
        } catch (error) {
            toast(error && error.message || '모델 팩을 삭제하지 못했습니다.', 'error');
        } finally {
            setBusy(false);
            render();
        }
    }

    function init() {
        [
            'visionModelPackPanel', 'visionPackStatus', 'visionPackDetail', 'visionPackSelect', 'visionPackBackend',
            'visionPackInstallBtn', 'visionPackFolderInput', 'visionPackActivateBtn', 'visionPackDeactivateBtn',
            'visionPackVerifyBtn', 'visionPackRemoveBtn', 'visionPackBenchmarkBtn', 'visionPackRollbackBtn',
            'visionPackRecommendation', 'visionPackBenchmarkDetail', 'visionPackProgress'
        ].forEach(id => { els[id] = byId(id); });
        if (!els.visionModelPackPanel) return;
        els.visionPackInstallBtn && els.visionPackInstallBtn.addEventListener('click', () => els.visionPackFolderInput && els.visionPackFolderInput.click());
        els.visionPackFolderInput && els.visionPackFolderInput.addEventListener('change', event => installFiles(event.target.files));
        els.visionPackSelect && els.visionPackSelect.addEventListener('change', render);
        els.visionPackActivateBtn && els.visionPackActivateBtn.addEventListener('click', activateSelected);
        els.visionPackDeactivateBtn && els.visionPackDeactivateBtn.addEventListener('click', deactivateSelected);
        els.visionPackBenchmarkBtn && els.visionPackBenchmarkBtn.addEventListener('click', benchmarkSelected);
        els.visionPackRollbackBtn && els.visionPackRollbackBtn.addEventListener('click', rollbackSelected);
        els.visionPackVerifyBtn && els.visionPackVerifyBtn.addEventListener('click', verifySelected);
        els.visionPackRemoveBtn && els.visionPackRemoveBtn.addEventListener('click', removeSelected);
        doc.addEventListener('ai-shorts-vision-pack-change', render);
        render();
        global.AIShortsVisionModelPackPanel = Object.freeze({ render, installFiles, verifySelected, activateSelected, benchmarkSelected, rollbackSelected, deactivateSelected, removeSelected });
    }

    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true });
    else init();
})(window);
