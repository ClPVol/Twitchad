// france-tv-videoad.js text/javascript
(function() {
    if ( /(^|\.)france\.tv$/.test(document.location.hostname) === false ) { return; }
    'use strict';

    const ourFTVAdSolutionsVersion = 1;
    if (typeof window.ftvAdSolutionsVersion !== 'undefined' && window.ftvAdSolutionsVersion >= ourFTVAdSolutionsVersion) {
        console.log("Skipping FTV blocker, another instance is active.");
        return;
    }
    window.ftvAdSolutionsVersion = ourFTVAdSolutionsVersion;

    function declareOptions(scope) {
        // Marqueurs typiques des flux publicitaires ou tracking chez France TV / Freewheel / Dai
        scope.AdSignifiers = ['/ad/', '/dai/', 'freewheel', 'doubleclick', 'googlesyndication', 'telemetry'];
        scope.IsAdStrippingEnabled = true;
        scope.AdSegmentCache = new Map();
    }

    const ftvWorkers = [];

    function hookWindowWorker() {
        const realWorker = window.Worker;
        const newWorker = class Worker extends realWorker {
            constructor(workerUrl, options) {
                let isFTVWorker = false;
                try {
                    isFTVWorker = new URL(workerUrl).origin.includes('france.tv');
                } catch {}

                if (!isFTVWorker) {
                    super(workerUrl, options);
                    return;
                }

                const newBlobStr = `
                    const AdSegmentCache = new Map();
                    ${stripFTVAdSegments.toString()}
                    ${processFTVM3U8.toString()}
                    ${hookWorkerFetch.toString()}
                    ${declareOptions.toString()}
                    declareOptions(self);
                    
                    const workerString = (() => {
                        const req = new XMLHttpRequest();
                        req.open('GET', '${workerUrl.replaceAll("'", "%27")}', false);
                        req.send();
                        return req.responseText;
                    })();
                    
                    hookWorkerFetch();
                    eval(workerString);
                `;

                super(URL.createObjectURL(new Blob([newBlobStr], { type: 'text/javascript' })), options);
                ftvWorkers.push(this);
            }
        };

        Object.defineProperty(window, 'Worker', {
            get: () => newWorker,
            set: (value) => { console.log('Attempt to override FTV worker denied'); }
        });
    }

    function hookWorkerFetch() {
        console.log('hookWorkerFetch (FTV)');
        const realFetch = fetch;
        fetch = async function(url, options) {
            if (typeof url === 'string') {
                url = url.trimEnd();

                // Si l'URL correspond à un segment publicitaire connu, on renvoie un segment vidéo vide (banc de test)
                if (AdSegmentCache.has(url)) {
                    return new Promise((resolve, reject) => {
                        realFetch('data:video/mp4;base64,AAAAKGZ0eXBtcDQyAAAAAWlzb21tcDQyZGFzaGF2YzFpc282aGxzZgAABEltb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAYagAAAAAAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAAABqHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAURtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAALuAAAAAAFXEAAAAAAAtaGRscgAAAAAAAAAAc291bgAAAAAAAAAAAAAAAFNvdW5kSGFuZGxlcgAAAADvbWluZgAAABBzbWhkAAAAAAAAAAAAAAAkZGluZgAAABxkcmVmAAAAAAAAAAEAAAAMdXJsIAAAAAEAAACzc3RBAAAAGdzdHNkAAAAAAAAAAEAAABXbXA0YQAAAAAAAAABAAAAAAAAAAAAAgAQAAAAALuAAAAAAAAzZXNkcwAAAAADgICAIgABAASAgIAUQBUAAAAAAAAAAAAAAAWAgIACEZAGgICAAQIAAAAQc3R0cwAAAAAAAAAAAAAAEHN0c2MAAAAAAAAAAAAAABRzdHN6AAAAAAAAAAAAAAAAAAAAEHN0c2coAAAAAAAAAAAAAAeV0cmFrAAAAXHRraGQAAAADAAAAAAAAAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAoAAAAFoAAAAAAGBbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAA9CQAAAAABVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABLG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAOxzdGJsAAAAoHN0c2QAAAAAAAAAAQAAAJBhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAoABaABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAOmF2Y0MBTUAe/+EAI2dNQB6WUoFAX/LgLUBAQFAAAD6AAA6mDgAAHoQAA9CW7y4KAQAEaOuPIAAAABBzdHRzAAAAAAAAAAAAAAAQc3RzYwAAAAAAAAAAAAAAFHN0c3oAAAAAAAAAAAAAAAAAAAAQc3RjbwAAAAAAAAAAAAAASG12ZXgAAAAgdHJleAAAAAAAAAABAAAAAQAAAC4AAAAAAoAAAAAAACB0cmV4AAAAAAAAAAIAAAABAACCNQAAAAACQAAA', options)
                        .then(resolve)
                        .catch(reject);
                    });
                }

                // Interception et nettoyage des fichiers de playlist HLS
                if (url.includes('m3u8')) {
                    return new Promise((resolve, reject) => {
                        realFetch(url, options).then(async (response) => {
                            if (response.status === 200) {
                                const cleanedM3u8 = stripFTVAdSegments(await response.text());
                                resolve(new Response(cleanedM3u8, { headers: response.headers }));
                            } else {
                                resolve(response);
                            }
                        }).catch(reject);
                    });
                }
            }
            return realFetch.apply(this, arguments);
        };
    }

    function stripFTVAdSegments(textStr) {
        if (!textStr) return textStr;
        const lines = textStr.replaceAll('\r', '').split('\n');
        const cleanedLines = [];
        let skipNextLine = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            if (skipNextLine) {
                // On mémorise l'URL du segment publicitaire pour le bloquer au niveau du fetch
                AdSegmentCache.set(line, Date.now());
                skipNextLine = false;
                continue;
            }

            // Détection des tags publicitaires dans le m3u8 (SCTE-35, DAI, Freewheel)
            const isAdTag = line.startsWith('#EXT-X-DISCONTINUITY') || 
                             line.startsWith('#EXT-X-DATERANGE') || 
                             AdSignifiers.some(signifier => line.includes(signifier));

            if (isAdTag) {
                // Si la ligne suivante est un segment vidéo (.ts / .mp4 / .m4s), on l'exclut également
                if (i < lines.length - 1 && !lines[i + 1].startsWith('#')) {
                    skipNextLine = true;
                }
                continue; // Supprime la ligne publicitaire courante
            }

            // Supprime les métadonnées de tracking publicitaire (ex: X-PLAYER-AD)
            if (line.startsWith('#EXT-X-ASSET') || line.includes('PLAYER-AD')) {
                continue;
            }

            cleanedLines.push(line);
        }

        // Nettoyage régulier du cache mémoire des segments obsolètes
        AdSegmentCache.forEach((value, key, map) => {
            if (value < Date.now() - 120000) {
                map.delete(key);
            }
        });

        return cleanedLines.join('\n');
    }

    function processFTVM3U8(url, textStr) {
        return stripFTVAdSegments(textStr);
    }

    // Initialisation globale sur la page principale
    declareOptions(window);
    hookWindowWorker();
    
    // Injection immédiate du hook fetch sur le thread principal de la page
    const mainHook = hookWorkerFetch.toString()
        .replace('hookWorkerFetch (FTV)', 'hookMainFetch (FTV)')
        .replace('AdSegmentCache', 'window.AdSegmentCache');
    
    // Execution du hook sur l'objet window
    window.AdSegmentCache = new Map();
    const runMainHook = new Function(`return ${mainHook}`)();
    runMainHook();

})();
