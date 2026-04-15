/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-959db468'], (function (workbox) { 'use strict';

  importScripts("/push-sw.js");
  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "push-sw.js",
    "revision": "5932d0db1f4fed350839a43f9b7d8694"
  }, {
    "url": "index.html",
    "revision": "83c40171bf3ae1f67470aab22b21c785"
  }, {
    "url": "certificate-frame.png",
    "revision": "cd05bcfcc901fda7560fa3777acf23c1"
  }, {
    "url": "thumbnails/tazkiyah.png",
    "revision": "5d8189a05485432696eaf0fccaa701d9"
  }, {
    "url": "thumbnails/tafseer.png",
    "revision": "a33cb20f5b2ea607a8ee97d7d5fefb17"
  }, {
    "url": "thumbnails/shariah_foundation.png",
    "revision": "32e7fdf69cf5588857006e11d9eced09"
  }, {
    "url": "thumbnails/seerah.png",
    "revision": "dc8a80de9c5eda0ba7d123d267c8b233"
  }, {
    "url": "thumbnails/nifas.png",
    "revision": "9d1b82470aaada366f2ba79b39d55953"
  }, {
    "url": "thumbnails/madkhal.png",
    "revision": "2cf0e58f7b9294d2ae5b0d48fea19469"
  }, {
    "url": "thumbnails/fiqh_waseelit.png",
    "revision": "bac8d08a7acd66dc807e263a721a6662"
  }, {
    "url": "thumbnails/fiqh_it7af.png",
    "revision": "cc7e25a7d9528683b353b914fd729d72"
  }, {
    "url": "thumbnails/arba3oon.png",
    "revision": "4ca60707b592a941b55f91b7234aa73c"
  }, {
    "url": "thumbnails/aqeeda.png",
    "revision": "8676f1e35f7bb99d0e597c984a25c472"
  }, {
    "url": "icons/icon-96x96.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-72x72.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-384x384.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-152x152.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-144x144.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-128x128.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "assets/workbox-window.prod.es5-BIl4cyR9.js",
    "revision": null
  }, {
    "url": "assets/video-W3B8S2d4.js",
    "revision": null
  }, {
    "url": "assets/user-x-CAeiJ99F.js",
    "revision": null
  }, {
    "url": "assets/user-check-BHXm-DOk.js",
    "revision": null
  }, {
    "url": "assets/usePagination-DJx5E68K.js",
    "revision": null
  }, {
    "url": "assets/useDebounce-Cceufa1Z.js",
    "revision": null
  }, {
    "url": "assets/upload-Bt-bd7md.js",
    "revision": null
  }, {
    "url": "assets/target-1rB4ZFHK.js",
    "revision": null
  }, {
    "url": "assets/SupervisorStudents-DzXP_IhI.js",
    "revision": null
  }, {
    "url": "assets/SupervisorDashboard-fMSWbcI4.js",
    "revision": null
  }, {
    "url": "assets/StudentDetailsModal-BIlpXHra.js",
    "revision": null
  }, {
    "url": "assets/StudentCertificates-BC24xRgo.js",
    "revision": null
  }, {
    "url": "assets/star-CuY_sbXR.js",
    "revision": null
  }, {
    "url": "assets/square-pen-C3OJ--St.js",
    "revision": null
  }, {
    "url": "assets/Settings-BZCYK_nG.js",
    "revision": null
  }, {
    "url": "assets/Search-CWCuINpY.js",
    "revision": null
  }, {
    "url": "assets/save-Di_5igjM.js",
    "revision": null
  }, {
    "url": "assets/sanitize-CRr1UQdy.js",
    "revision": null
  }, {
    "url": "assets/RegistrationForm-Ci59Evlv.js",
    "revision": null
  }, {
    "url": "assets/RatingBox-3TWFAMgP.js",
    "revision": null
  }, {
    "url": "assets/Quiz-Dnw5svsu.js",
    "revision": null
  }, {
    "url": "assets/purify.es-B9ZVCkUG.js",
    "revision": null
  }, {
    "url": "assets/Profile-WDSzwCM_.js",
    "revision": null
  }, {
    "url": "assets/Player-DLlKneim.js",
    "revision": null
  }, {
    "url": "assets/play-BovQLOPG.js",
    "revision": null
  }, {
    "url": "assets/PieChart-C4m8-MNe.js",
    "revision": null
  }, {
    "url": "assets/phone-DLqumhV4.js",
    "revision": null
  }, {
    "url": "assets/PersonalProgress-4zBBxAVE.js",
    "revision": null
  }, {
    "url": "assets/Notifications-9rLuETHy.js",
    "revision": null
  }, {
    "url": "assets/notificationManager-BVODi4Lt.js",
    "revision": null
  }, {
    "url": "assets/MessagingSystem-DAxPnTK_.js",
    "revision": null
  }, {
    "url": "assets/map-pin-CQ4acKUl.js",
    "revision": null
  }, {
    "url": "assets/mail-4AABrfI0.js",
    "revision": null
  }, {
    "url": "assets/loader-BpXg-nIW.js",
    "revision": null
  }, {
    "url": "assets/Library-DW7eWXfm.js",
    "revision": null
  }, {
    "url": "assets/LandingPage-DlKYMXR8.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-C4ngQmGD.js",
    "revision": null
  }, {
    "url": "assets/index.es-C6NljqPx.js",
    "revision": null
  }, {
    "url": "assets/index-xiRdh3gV.css",
    "revision": null
  }, {
    "url": "assets/index-Dya5SHxa.js",
    "revision": null
  }, {
    "url": "assets/index-BM4gIbWo.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-QH1iLAAe.js",
    "revision": null
  }, {
    "url": "assets/globe-Co_dGnIn.js",
    "revision": null
  }, {
    "url": "assets/funnel-BfrifVzt.js",
    "revision": null
  }, {
    "url": "assets/ForgotPassword-B5C7ZO5a.js",
    "revision": null
  }, {
    "url": "assets/file-text-D8X9ftGU.js",
    "revision": null
  }, {
    "url": "assets/Favorites-C4pFv7d4.js",
    "revision": null
  }, {
    "url": "assets/eye-off-ie537S9s.js",
    "revision": null
  }, {
    "url": "assets/eye-CUBlUkAe.js",
    "revision": null
  }, {
    "url": "assets/EmailVerification-C805-e5A.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-C2oHQZNW.js",
    "revision": null
  }, {
    "url": "assets/DailyTracking-BkeSeD9v.js",
    "revision": null
  }, {
    "url": "assets/clock-H_otdCyr.js",
    "revision": null
  }, {
    "url": "assets/circle-check-BpnNaQuQ.js",
    "revision": null
  }, {
    "url": "assets/chevron-left-H8Q5xHMO.js",
    "revision": null
  }, {
    "url": "assets/Auth-BjWL9r4D.js",
    "revision": null
  }, {
    "url": "assets/AdminStudents-BhaEYpHV.js",
    "revision": null
  }, {
    "url": "assets/AdminReports-CPH9SZ97.js",
    "revision": null
  }, {
    "url": "assets/AdminQuizManagement-DX7Z9tYq.js",
    "revision": null
  }, {
    "url": "assets/AdminPendingStudents-Ct82h9Fp.js",
    "revision": null
  }, {
    "url": "assets/AdminLibrary-Be1S_WwA.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboard-BhrfvLWd.js",
    "revision": null
  }, {
    "url": "assets/AdminCertificateManagement-nRUB64RK.js",
    "revision": null
  }, {
    "url": "assets/AdminBackupSettings-BeheE0sV.js",
    "revision": null
  }, {
    "url": "assets/AdminAudioCourses-qeAEHpWT.js",
    "revision": null
  }, {
    "url": "assets/AdminAnnouncements-blZvR-Vp.js",
    "revision": null
  }, {
    "url": "assets/AdminActivityLog-Dfi3Dhg9.js",
    "revision": null
  }, {
    "url": "icons/icon-128x128.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-144x144.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-152x152.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-192x192.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-384x384.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-512x512.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-72x72.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "icons/icon-96x96.png",
    "revision": "6af4021e12a4eda37cf43126d312e352"
  }, {
    "url": "manifest.webmanifest",
    "revision": "1a21730f9a3c4fbd7311e21c7d9548db"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/images\.unsplash\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "unsplash-images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');

}));
