import CacheController from "../support.mjs"
const cacheController = new CacheController(6); // version
self.addEventListener("install", async event => {
    const installation = cacheController.install({
        own: [
            // [".git",".gitattributes","info.json","service_worker.mjs"]
            "buttons.svg",
            "components/indexed_edit.mjs",
            "components/indexor_management.mjs",
            "components/welcome.mjs",
            "css/indexed_edit.css",
            "css/indexor_management.css",
            "css/main.css",
            "css/welcome.css",
            "data.mjs",
            "helper.mjs",
            "icon_monochrome.svg",
            "icon.png",
            "icon.svg",
            "index.html",
            "indexor.mjs",
            "main.mjs",
            "manifest.webmanifest",
            "menu.mjs",
            "tree.mjs",
            "ui.mjs"
        ],
        requiredScripts: [
            "array_HTML.mjs",
            "binary_operate.mjs",
            "context_menu.mjs",
            "file_io.mjs",
            "IndexedDatabase.mjs",
            "MiniWindow.mjs",
            "Notifier.mjs"
        ],
        shared: [
            "/css/BSIF_style.css"
        ]
    });
    event.waitUntil(installation);
    await installation;
    (await clients.matchAll({includeUncontrolled: true,type: "window"}))[0]?.postMessage("updated");
});
self.addEventListener("fetch", event => { event.respondWith(cacheController.respond(event.request)) });
self.addEventListener("activate", async event => { event.waitUntil(cacheController.clean()) });