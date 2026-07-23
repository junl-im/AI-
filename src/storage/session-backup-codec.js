// AI Shorts Studio v1.5.27 - bounded LZW backup compression with checksum verification
'use strict';
(function exposeSessionBackupCodec(global) {
    if (global.AIShortsSessionBackupCodec) return;
    const PREFIX = 'AISSB1:';
    const MAX_INPUT_CHARS = 2500000;

    function bytesFromText(text) {
        if (typeof TextEncoder === 'function') return new TextEncoder().encode(text);
        const encoded = unescape(encodeURIComponent(text));
        const bytes = new Uint8Array(encoded.length);
        for (let index = 0; index < encoded.length; index += 1) bytes[index] = encoded.charCodeAt(index);
        return bytes;
    }
    function textFromBytes(bytes) {
        if (typeof TextDecoder === 'function') return new TextDecoder().decode(bytes);
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 8192) binary += String.fromCharCode.apply(null, bytes.subarray(offset, offset + 8192));
        return decodeURIComponent(escape(binary));
    }
    function checksum(bytes) {
        let hash = 0x811c9dc5;
        for (let index = 0; index < bytes.length; index += 1) {
            hash ^= bytes[index];
            hash = Math.imul(hash, 0x01000193) >>> 0;
        }
        return hash.toString(16).padStart(8, '0');
    }
    function compressBytes(bytes) {
        if (!bytes.length) return new Uint16Array(0);
        const dictionary = new Map();
        const output = [];
        let nextCode = 256;
        let phrase = String.fromCharCode(bytes[0]);
        for (let index = 1; index < bytes.length; index += 1) {
            const character = String.fromCharCode(bytes[index]);
            const combined = phrase + character;
            if (dictionary.has(combined)) phrase = combined;
            else {
                output.push(phrase.length === 1 ? phrase.charCodeAt(0) : dictionary.get(phrase));
                if (nextCode <= 65535) dictionary.set(combined, nextCode++);
                phrase = character;
            }
        }
        output.push(phrase.length === 1 ? phrase.charCodeAt(0) : dictionary.get(phrase));
        return Uint16Array.from(output);
    }
    function decompressCodes(codes, expectedBytes) {
        if (!codes.length) return new Uint8Array(0);
        const dictionary = [];
        for (let index = 0; index < 256; index += 1) dictionary[index] = String.fromCharCode(index);
        let nextCode = 256;
        let phrase = dictionary[codes[0]];
        if (phrase == null) throw new Error('압축 백업의 시작 코드가 올바르지 않습니다.');
        const chunks = [phrase];
        let outputLength = phrase.length;
        for (let index = 1; index < codes.length; index += 1) {
            const code = codes[index];
            let entry = dictionary[code];
            if (entry == null && code === nextCode) entry = phrase + phrase[0];
            if (entry == null) throw new Error('압축 백업 코드가 손상되었습니다.');
            chunks.push(entry);
            outputLength += entry.length;
            if (nextCode <= 65535) dictionary[nextCode++] = phrase + entry[0];
            phrase = entry;
            if (expectedBytes && outputLength > expectedBytes + 1024) throw new Error('압축 백업 크기 검증에 실패했습니다.');
        }
        const binary = chunks.join('');
        if (expectedBytes && binary.length !== expectedBytes) throw new Error('압축 백업의 원본 크기가 일치하지 않습니다.');
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index) & 255;
        return bytes;
    }
    function codesToBase64(codes) {
        let binary = '';
        for (let offset = 0; offset < codes.length; offset += 4096) {
            const chunk = codes.subarray(offset, offset + 4096);
            for (let index = 0; index < chunk.length; index += 1) {
                const code = chunk[index];
                binary += String.fromCharCode(code >>> 8, code & 255);
            }
        }
        return global.btoa ? global.btoa(binary) : Buffer.from(binary, 'binary').toString('base64');
    }
    function base64ToCodes(value) {
        const binary = global.atob ? global.atob(value) : Buffer.from(value, 'base64').toString('binary');
        if (binary.length % 2) throw new Error('압축 백업 데이터 길이가 올바르지 않습니다.');
        const codes = new Uint16Array(binary.length / 2);
        for (let index = 0; index < codes.length; index += 1) codes[index] = (binary.charCodeAt(index * 2) << 8) | binary.charCodeAt(index * 2 + 1);
        return codes;
    }
    function encode(text, options) {
        const raw = String(text || '');
        const opts = options || {};
        const maxChars = Math.max(1024, Number(opts.maxChars) || MAX_INPUT_CHARS);
        if (raw.length > maxChars) throw new Error('백업 원문이 압축 허용 크기를 초과했습니다.');
        const bytes = bytesFromText(raw);
        const codes = compressBytes(bytes);
        const envelope = PREFIX + JSON.stringify({ codec: 'lzw16', bytes: bytes.length, chars: raw.length, checksum: checksum(bytes), data: codesToBase64(codes) });
        const minimumSavingsRatio = Math.max(0, Math.min(0.5, Number(opts.minimumSavingsRatio == null ? 0.05 : opts.minimumSavingsRatio)));
        const compressed = envelope.length < raw.length * (1 - minimumSavingsRatio);
        return Object.freeze({ text: compressed ? envelope : raw, compressed, codec: compressed ? 'lzw16' : 'plain', rawChars: raw.length, storedChars: compressed ? envelope.length : raw.length, savingsRatio: raw.length ? Math.max(0, 1 - (compressed ? envelope.length : raw.length) / raw.length) : 0, checksum: checksum(bytes) });
    }
    function decode(value, options) {
        const stored = String(value || '');
        const opts = options || {};
        if (!stored.startsWith(PREFIX)) return Object.freeze({ text: stored, compressed: false, codec: 'plain', rawChars: stored.length, storedChars: stored.length, savingsRatio: 0, checksum: checksum(bytesFromText(stored)) });
        const envelope = JSON.parse(stored.slice(PREFIX.length));
        if (!envelope || envelope.codec !== 'lzw16' || typeof envelope.data !== 'string') throw new Error('지원하지 않는 세션 백업 압축 형식입니다.');
        const maxBytes = Math.max(4096, Number(opts.maxBytes) || MAX_INPUT_CHARS * 4);
        const expectedBytes = Math.max(0, Number(envelope.bytes) || 0);
        if (!expectedBytes || expectedBytes > maxBytes) throw new Error('압축 백업의 원본 크기가 허용 범위를 벗어났습니다.');
        const bytes = decompressCodes(base64ToCodes(envelope.data), expectedBytes);
        const actualChecksum = checksum(bytes);
        if (actualChecksum !== String(envelope.checksum || '')) throw new Error('압축 백업 체크섬이 일치하지 않습니다.');
        const text = textFromBytes(bytes);
        if (Number(envelope.chars) && text.length !== Number(envelope.chars)) throw new Error('압축 백업 문자 수가 일치하지 않습니다.');
        return Object.freeze({ text, compressed: true, codec: 'lzw16', rawChars: text.length, storedChars: stored.length, savingsRatio: text.length ? Math.max(0, 1 - stored.length / text.length) : 0, checksum: actualChecksum });
    }
    function inspect(value, options) {
        const stored = String(value || '');
        const verify = Boolean(options && options.verify);
        try {
            if (verify) {
                const decoded = decode(stored);
                return Object.freeze({ valid: true, verified: true, compressed: decoded.compressed, codec: decoded.codec, rawChars: decoded.rawChars, storedChars: decoded.storedChars, savingsRatio: decoded.savingsRatio, checksum: decoded.checksum });
            }
            if (!stored.startsWith(PREFIX)) return Object.freeze({ valid: true, verified: false, compressed: false, codec: 'plain', rawChars: stored.length, storedChars: stored.length, savingsRatio: 0, checksum: checksum(bytesFromText(stored)) });
            const envelope = JSON.parse(stored.slice(PREFIX.length));
            const rawChars = Math.max(0, Number(envelope && envelope.chars) || 0);
            if (!envelope || envelope.codec !== 'lzw16' || !rawChars || !Number(envelope.bytes) || typeof envelope.data !== 'string' || !/^[a-f0-9]{8}$/i.test(String(envelope.checksum || ''))) throw new Error('압축 백업 메타데이터가 올바르지 않습니다.');
            return Object.freeze({ valid: true, verified: false, compressed: true, codec: 'lzw16', rawChars, storedChars: stored.length, savingsRatio: rawChars ? Math.max(0, 1 - stored.length / rawChars) : 0, checksum: String(envelope.checksum) });
        } catch (error) { return Object.freeze({ valid: false, verified: false, compressed: stored.startsWith(PREFIX), codec: 'unknown', rawChars: 0, storedChars: stored.length, savingsRatio: 0, checksum: '', error: error && error.message || String(error) }); }
    }

    global.AIShortsSessionBackupCodec = Object.freeze({ PREFIX, encode, decode, inspect, checksum });
})(window);
