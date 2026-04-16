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
    "revision": "2ed25d99b9f5ef04c415f8e79f6d0b8d"
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
    "url": "assets/video-xbQqEYtx.js",
    "revision": null
  }, {
    "url": "assets/user-x-BynskHNo.js",
    "revision": null
  }, {
    "url": "assets/user-check-BS5b9Jz1.js",
    "revision": null
  }, {
    "url": "assets/usePagination-CWm7FmXT.js",
    "revision": null
  }, {
    "url": "assets/useDebounce-DP9DAIAG.js",
    "revision": null
  }, {
    "url": "assets/upload-C6am-JCx.js",
    "revision": null
  }, {
    "url": "assets/target-CJNx3XSd.js",
    "revision": null
  }, {
    "url": "assets/SupervisorStudents-CoSrbYPK.js",
    "revision": null
  }, {
    "url": "assets/SupervisorDashboard-BUkKsodw.js",
    "revision": null
  }, {
    "url": "assets/StudentDetailsModal-Dj9OK4tW.js",
    "revision": null
  }, {
    "url": "assets/StudentCertificates-B1bHVNXb.js",
    "revision": null
  }, {
    "url": "assets/star-ByEZyuxz.js",
    "revision": null
  }, {
    "url": "assets/square-pen-CpivHxvs.js",
    "revision": null
  }, {
    "url": "assets/Settings-DiltshMa.js",
    "revision": null
  }, {
    "url": "assets/Search-Dn9xhvaw.js",
    "revision": null
  }, {
    "url": "assets/save-CIbP8vCh.js",
    "revision": null
  }, {
    "url": "assets/sanitize-CRr1UQdy.js",
    "revision": null
  }, {
    "url": "assets/RegistrationForm-8wkjBmeG.js",
    "revision": null
  }, {
    "url": "assets/RatingBox-DMKWYGvu.js",
    "revision": null
  }, {
    "url": "assets/Quiz-B20TdU1B.js",
    "revision": null
  }, {
    "url": "assets/purify.es-B9ZVCkUG.js",
    "revision": null
  }, {
    "url": "assets/Profile-BnWqF-Tz.js",
    "revision": null
  }, {
    "url": "assets/Player-BZ1kYgTz.js",
    "revision": null
  }, {
    "url": "assets/play-BNoGVZ98.js",
    "revision": null
  }, {
    "url": "assets/PieChart-ISpTvcvX.js",
    "revision": null
  }, {
    "url": "assets/phone-C67mGSmK.js",
    "revision": null
  }, {
    "url": "assets/PersonalProgress-D7TX1v92.js",
    "revision": null
  }, {
    "url": "assets/Notifications-BfQXdNTB.js",
    "revision": null
  }, {
    "url": "assets/notificationManager-BMPI-wCO.js",
    "revision": null
  }, {
    "url": "assets/MessagingSystem-DEuBVNmn.js",
    "revision": null
  }, {
    "url": "assets/map-pin-BfwBK4JP.js",
    "revision": null
  }, {
    "url": "assets/mail-C-iD8dxF.js",
    "revision": null
  }, {
    "url": "assets/loader-DyIJ9bCZ.js",
    "revision": null
  }, {
    "url": "assets/Library-bbACWedI.js",
    "revision": null
  }, {
    "url": "assets/LandingPage-Dvn60Zld.js",
    "revision": null
  }, {
    "url": "assets/jspdf.es.min-38cUbOmM.js",
    "revision": null
  }, {
    "url": "assets/index.es-CyO7gk8K.js",
    "revision": null
  }, {
    "url": "assets/index-I9iPBUiG.css",
    "revision": null
  }, {
    "url": "assets/index-D4VqTbpg.js",
    "revision": null
  }, {
    "url": "assets/index-Bl1iuwwd.js",
    "revision": null
  }, {
    "url": "assets/html2canvas.esm-QH1iLAAe.js",
    "revision": null
  }, {
    "url": "assets/globe-DKE2bFUP.js",
    "revision": null
  }, {
    "url": "assets/funnel-B6C8eHCA.js",
    "revision": null
  }, {
    "url": "assets/ForgotPassword-TzdCmksK.js",
    "revision": null
  }, {
    "url": "assets/file-text-BjJOIV2D.js",
    "revision": null
  }, {
    "url": "assets/Favorites-BissiBg1.js",
    "revision": null
  }, {
    "url": "assets/eye-off-C7zAqabK.js",
    "revision": null
  }, {
    "url": "assets/eye-BoiLGq29.js",
    "revision": null
  }, {
    "url": "assets/EmailVerification-BLSf5KQu.js",
    "revision": null
  }, {
    "url": "assets/Dashboard-DAyWkc8e.js",
    "revision": null
  }, {
    "url": "assets/DailyTracking-CPtGv04M.js",
    "revision": null
  }, {
    "url": "assets/clock-CcYeN7gk.js",
    "revision": null
  }, {
    "url": "assets/circle-check-1Bja7QH0.js",
    "revision": null
  }, {
    "url": "assets/chevron-left-oQ3SCCfl.js",
    "revision": null
  }, {
    "url": "assets/Auth-5xtIYm5Q.js",
    "revision": null
  }, {
    "url": "assets/AdminStudents-CkE6aCgX.js",
    "revision": null
  }, {
    "url": "assets/AdminReports-DX6pz8-d.js",
    "revision": null
  }, {
    "url": "assets/AdminQuizManagement-JgtxGipG.js",
    "revision": null
  }, {
    "url": "assets/AdminPendingStudents-CQ57nSIl.js",
    "revision": null
  }, {
    "url": "assets/AdminLibrary-D1dznz5m.js",
    "revision": null
  }, {
    "url": "assets/AdminDashboard-N_oYphRS.js",
    "revision": null
  }, {
    "url": "assets/AdminCertificateManagement-xqJYFE7F.js",
    "revision": null
  }, {
    "url": "assets/AdminBackupSettings-Dtt5bDy1.js",
    "revision": null
  }, {
    "url": "assets/AdminAudioCourses-CjNKP882.js",
    "revision": null
  }, {
    "url": "assets/AdminAnnouncements-_icl62nb.js",
    "revision": null
  }, {
    "url": "assets/AdminActivityLog-D6EgBjOt.js",
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
