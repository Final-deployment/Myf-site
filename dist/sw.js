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
    "revision": "415d3c13c3ac3295f8c3ef4154e8f1bc"
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
    "url": "assets/video-ASw1RJT3.js",
    "revision": null
  }, {
    "url": "assets/user-x-DahjmX0p.js",
    "revision": null
  }, {
    "url": "assets/user-check-DktfLMtF.js",
    "revision": null
  }, {
    "url": "assets/usePagination-8Huz9JZM.js",
    "revision": null
  }, {
    "url": "assets/useDebounce-BpbYtOKn.js",
    "revision": null
  }, {
    "url": "assets/upload-DTh6k8dm.js",
    "revision": null
  }, {
    "url": "assets/target-BqHDYtW3.js",
    "revision": null
  }, {
    "url": "assets/SupervisorStudents-DzZi9eac.js",
    "revision": null
  }, {
    "url": "assets/SupervisorDashboard-D2TnxuV3.js",
    "revision": null
  }, {
    "url": "assets/StudentDetailsModal-UD-Oqhc-.js",
    "revision": null
  }, {
    "url": "assets/StudentCertificates-B73rx-TJ.js",
    "revision": null
  }, {
    "url": "assets/star-CamqYmju.js",
    "revision": null
  }, {
    "url": "assets/square-pen-BP94qRa_.js",
    "revision": null
  }, {
    "url": "assets/Settings-V9srR_-4.js",
    "revision": null
  }, {
    "url": "assets/Search-Yf6sezxt.js",
    "revision": null
  }, {
    "url": "assets/save-Di6gXauJ.js",
    "revision": null
  }, {
    "url": "assets/sanitize-CRr1UQdy.js",
    "revision": null
  }, {
    "url": "assets/RegistrationForm-BqGP6T96.js",
    "revision": null
  }, {
    "url": "assets/RatingBox-DxNDJ263.js",
    "revision": null
  }, {
    "url": "assets/Quiz-DYXBTBau.js",
    "revision": null
  }, {
    "url": "assets/purify.es-B9ZVCkUG.js",
    "revision": null
  }, {
    "url": "assets/Profile-CKeSy1Pp.js",
    "revision": null
  }, {
    "url": "assets/Player-COzR9pJ0.js",
    "revision": null
  }, {
    "url": "assets/play-DxmW4-J6.js",
    "revision": null
  }, {
    "url": "assets/PieChart-BB2UGEri.js",
    "revision": null
  }, {
    "url": "assets/phone-C9H_4fQW.js",
    "revision": null
  }, {
    "url": "assets/PersonalProgress-CLchBfTB.js",
    "revision": null
  }, {
    "url": "assets/Notifications-CoBskBTP.js",
    "revision": null
  }, {
    "url": "assets/notificationManager-CqBg-9Xc.js",
    "revision": null
  }, {
    "url": "assets/MessagingSystem-Dr3bRIW-.js",
    "revision": null
  }, {
    "url": "assets/map-pin-BiJOyh0l.js",
    "revision": null
  }, {
    "url": "assets/mail-BbpJL-lG.js",
    "revision": null
  }, {
    "url": "assets/loader-GlSeRvcy.js",
    "revision": null
  }, {
    "url": "assets/Library-DoWoP288.js",
    "revision": null
  }, {
    "url": "assets/LandingPage-LKMVkUKJ.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-CFTDBxnb.js",
    "revision": null
  }, {
    "url": "assets/index.es-BFOmivyf.js",
    "revision": null
  }, {
    "url": "assets/index-Dl3WAlAZ.css",
    "revision": null
  }, {
    "url": "assets/index-D96gQReM.js",
    "revision": null
  }, {
    "url": "assets/index-CjfPojb0.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-QH1iLAAe.js",
    "revision": null
  }, {
    "url": "assets/globe-D66J0nzd.js",
    "revision": null
  }, {
    "url": "assets/funnel-CsmMtC7S.js",
    "revision": null
  }, {
    "url": "assets/ForgotPassword-DUYZypiQ.js",
    "revision": null
  }, {
    "url": "assets/file-text--E2kU3tY.js",
    "revision": null
  }, {
    "url": "assets/Favorites-BnWz8u10.js",
    "revision": null
  }, {
    "url": "assets/eye-off-BcEDoHbc.js",
    "revision": null
  }, {
    "url": "assets/eye-CCbUt9PE.js",
    "revision": null
  }, {
    "url": "assets/EmailVerification-CAslfwU9.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-CAGPnUgg.js",
    "revision": null
  }, {
    "url": "assets/DailyTracking-DApSwu2v.js",
    "revision": null
  }, {
    "url": "assets/clock-C3vXqVYY.js",
    "revision": null
  }, {
    "url": "assets/circle-check-JqUtaS_Z.js",
    "revision": null
  }, {
    "url": "assets/chevron-left-dX9q-s2s.js",
    "revision": null
  }, {
    "url": "assets/Auth-BoPeuiFP.js",
    "revision": null
  }, {
    "url": "assets/AdminStudents-CdvfYUmv.js",
    "revision": null
  }, {
    "url": "assets/AdminReports-C_yW7vWm.js",
    "revision": null
  }, {
    "url": "assets/AdminQuizManagement-CmnJ4Mco.js",
    "revision": null
  }, {
    "url": "assets/AdminPendingStudents-B15X6tah.js",
    "revision": null
  }, {
    "url": "assets/AdminLibrary-k0HUDQ1V.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboard-CIEtdFG8.js",
    "revision": null
  }, {
    "url": "assets/AdminCertificateManagement-I6KJew5q.js",
    "revision": null
  }, {
    "url": "assets/AdminBackupSettings-DQCQrOG5.js",
    "revision": null
  }, {
    "url": "assets/AdminAudioCourses-CZmx_Sqv.js",
    "revision": null
  }, {
    "url": "assets/AdminAnnouncements-CUgtMpfZ.js",
    "revision": null
  }, {
    "url": "assets/AdminActivityLog-ZCE7SZyS.js",
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
    "revision": "e50651d13a0cc4eced79bc531af39e53"
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
