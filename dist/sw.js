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
    "revision": "bcee7a92360b44b91b73a8223efa126b"
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
    "url": "assets/video-B_lrjOhk.js",
    "revision": null
  }, {
    "url": "assets/user-x-DQnjnKG4.js",
    "revision": null
  }, {
    "url": "assets/user-check-CFt2Au6h.js",
    "revision": null
  }, {
    "url": "assets/usePagination-BMXuS1hg.js",
    "revision": null
  }, {
    "url": "assets/useDebounce-zAu2-_5E.js",
    "revision": null
  }, {
    "url": "assets/upload-K5gbpwRK.js",
    "revision": null
  }, {
    "url": "assets/target-BQHC0-Xh.js",
    "revision": null
  }, {
    "url": "assets/SupervisorStudents-BLG53ZFv.js",
    "revision": null
  }, {
    "url": "assets/SupervisorDashboard-BVgrinGP.js",
    "revision": null
  }, {
    "url": "assets/StudentDetailsModal-BatSneRO.js",
    "revision": null
  }, {
    "url": "assets/StudentCertificates-D4-CZt2S.js",
    "revision": null
  }, {
    "url": "assets/star-Dh3lfsv4.js",
    "revision": null
  }, {
    "url": "assets/square-pen-58Njk32W.js",
    "revision": null
  }, {
    "url": "assets/Settings-DPHOjKC9.js",
    "revision": null
  }, {
    "url": "assets/Search-DlWELll_.js",
    "revision": null
  }, {
    "url": "assets/save-Djgh6y3y.js",
    "revision": null
  }, {
    "url": "assets/sanitize-CRr1UQdy.js",
    "revision": null
  }, {
    "url": "assets/RegistrationForm-DgkAVcPF.js",
    "revision": null
  }, {
    "url": "assets/RatingBox-BDM89EXa.js",
    "revision": null
  }, {
    "url": "assets/Quiz-BbjBhelY.js",
    "revision": null
  }, {
    "url": "assets/purify.es-B9ZVCkUG.js",
    "revision": null
  }, {
    "url": "assets/Profile-CWce_pOL.js",
    "revision": null
  }, {
    "url": "assets/Player-B4Gm3euY.js",
    "revision": null
  }, {
    "url": "assets/play-icWqNP5H.js",
    "revision": null
  }, {
    "url": "assets/PieChart-C_EbWF_w.js",
    "revision": null
  }, {
    "url": "assets/phone-Zbz9WxSw.js",
    "revision": null
  }, {
    "url": "assets/PersonalProgress-Ca-_tM0k.js",
    "revision": null
  }, {
    "url": "assets/Notifications-Cdlo6o7Y.js",
    "revision": null
  }, {
    "url": "assets/notificationManager-Bx_tC5Vo.js",
    "revision": null
  }, {
    "url": "assets/MessagingSystem-0eCid442.js",
    "revision": null
  }, {
    "url": "assets/map-pin-zbzkQHfq.js",
    "revision": null
  }, {
    "url": "assets/mail-BKDhZ_C_.js",
    "revision": null
  }, {
    "url": "assets/loader-B_UnBAzz.js",
    "revision": null
  }, {
    "url": "assets/Library-ClOTmGpv.js",
    "revision": null
  }, {
    "url": "assets/LandingPage-BKrdUsRA.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-C-l5BLca.js",
    "revision": null
  }, {
    "url": "assets/index.es-Q4nIVV2i.js",
    "revision": null
  }, {
    "url": "assets/index-xiRdh3gV.css",
    "revision": null
  }, {
    "url": "assets/index-j8_06SQO.js",
    "revision": null
  }, {
    "url": "assets/index-D3LUFzbw.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-QH1iLAAe.js",
    "revision": null
  }, {
    "url": "assets/globe-CtXZVJo3.js",
    "revision": null
  }, {
    "url": "assets/funnel-BVwGrvgC.js",
    "revision": null
  }, {
    "url": "assets/ForgotPassword-CNbzHlTD.js",
    "revision": null
  }, {
    "url": "assets/file-text-BpCoazEA.js",
    "revision": null
  }, {
    "url": "assets/Favorites-CS06WnnP.js",
    "revision": null
  }, {
    "url": "assets/eye-off-BpTp80Dh.js",
    "revision": null
  }, {
    "url": "assets/eye-CxXo4OPn.js",
    "revision": null
  }, {
    "url": "assets/EmailVerification-DhLqjM0a.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-C-2w5E3j.js",
    "revision": null
  }, {
    "url": "assets/DailyTracking-Cft13uEC.js",
    "revision": null
  }, {
    "url": "assets/clock-BGFqLO_C.js",
    "revision": null
  }, {
    "url": "assets/circle-check-Da4ldwxQ.js",
    "revision": null
  }, {
    "url": "assets/chevron-left-BXzvCRz5.js",
    "revision": null
  }, {
    "url": "assets/Auth-B-YLrznx.js",
    "revision": null
  }, {
    "url": "assets/AdminStudents-Bwq7RRQe.js",
    "revision": null
  }, {
    "url": "assets/AdminReports-DJcla1Tz.js",
    "revision": null
  }, {
    "url": "assets/AdminQuizManagement-BjlAVeaE.js",
    "revision": null
  }, {
    "url": "assets/AdminPendingStudents-DszIJrXn.js",
    "revision": null
  }, {
    "url": "assets/AdminLibrary-f0dFVGOH.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboard-vMiu5XQG.js",
    "revision": null
  }, {
    "url": "assets/AdminCertificateManagement-CJvCJ2zP.js",
    "revision": null
  }, {
    "url": "assets/AdminBackupSettings-BynOQoVI.js",
    "revision": null
  }, {
    "url": "assets/AdminAudioCourses-BBkk_-JL.js",
    "revision": null
  }, {
    "url": "assets/AdminAnnouncements-DviNBamH.js",
    "revision": null
  }, {
    "url": "assets/AdminActivityLog-D1ZMil7k.js",
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
