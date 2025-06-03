import CacheController from "../support.mjs"
const cacheController = new CacheController(7); // version
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
        scriptModule: [
            "fetch.mjs",
            "Enum.mjs",
            "array_HTML.mjs",
            "binary_operate.mjs",
            "file_io.mjs",
            "IndexedDatabase.mjs",
            "Notifier.mjs"
        ],
        component: [
            "utils.mjs",
            "context_menu/context_menu.mjs",
            "context_menu/context_menu.css",
            "overlay_window/OverlayWindow.mjs",
            "overlay_window/overlay_window.css"
        ],
        website: [
            "css/BSIF_style.css"
        ]
    });
    // @ts-ignore
    event.waitUntil(installation);
    await installation;
    // @ts-ignore
    (await clients.matchAll({includeUncontrolled: true,type: "window"}))[0]?.postMessage("updated");
});
// @ts-ignore
self.addEventListener("fetch", event => { event.respondWith(cacheController.respond(event.request)) });
// @ts-ignore
self.addEventListener("activate", async event => { event.waitUntil(cacheController.clean()) });