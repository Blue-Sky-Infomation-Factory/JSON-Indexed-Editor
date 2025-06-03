import { menus, renderMenu } from "./menu.mjs";
import { EVENT_LISTENERS, parse, parseAndGetNodes } from "/javascript/module/array_HTML.mjs";
import OverlayWindow from "/component/overlay_window/OverlayWindow.mjs";

const serviceWorker = navigator.serviceWorker;
serviceWorker.startMessages
serviceWorker.addEventListener("message", function ({ data }) { if (data == "updated") new Notification("应用已就绪", { body: "新版本已安装完成，请重新启动应用以完成更新。" }) });
var serviceWorkerInstallation = null;
async function installSeviceWorker() {
	try {
		await navigator.serviceWorker.register("./service_worker.mjs", { type: "module", updateViaCache: "none" });
	} catch (e) {
		console.error(e);
		serviceWorkerInstallation = null;
		return false;
	}
	serviceWorkerInstallation = null;
	return true;
}
function throwWindowClose(reject) { reject(new Error("Closed")) }
async function waitInstall(closePromise, processing, done) {
	await Promise.race([serviceWorkerInstallation, closePromise]);
	processing.style.display = "none";
	done.style.display = "grid";
}
function cacheResource() {
	const { promise: windowClose, reject: windowCloseCall } = Promise.withResolvers(),
		{ documentFragment, nodes: { start, processing, done } } = parseAndGetNodes([
			["style", [
				".help-cache{display:grid;grid-template-rows:1fr 4rem}",
				".help-cache>:not(br){display:none}",
				"#help-cache-start{place-self:end;height:2.5rem}",
				"#help-cache-processing,#help-cache-done{align-items:center;justify-content:center;grid-template-columns:2rem auto;gap:1rem}",
				"#help-cache-done-icon{font-size:1.5rem;color:#1C0}"
			]],
			"将本应用离线缓存到您的电脑中，如此一来，即便之后您无法访问互联网，也能够正常使用本应用。", ["br"],
			"本应用大小不足 1 MiB，无需担心会占用您过多空间。",
			["button", "开始缓存", {
				id: "help-cache-start", class: "default-color", [EVENT_LISTENERS]: [
					["click", async function () {
						serviceWorkerInstallation = installSeviceWorker();
						// @ts-ignore
						start.style.display = "none";
						// @ts-ignore
						processing.style.display = "grid";
						waitInstall(windowClose, processing, done);
					}]
				]
			}, "start"],
			["div", [
				["div", null, { class: "bs-loading" }],
				"正在缓存……", ["br"],
				"您可以关闭本界面继续工作"
			], { id: "help-cache-processing" }, "processing"],
			["div", [
				["div", "✔",{ id: "help-cache-done-icon" }],
				"您已经完成缓存，本应用已准备好断网使用。", ["br"],
				"将本页面添加至收藏夹或者安装本应用方便您快速访问。",
			], { id: "help-cache-done" }, "done"]
		]);
	if (serviceWorker.controller) {
		// @ts-ignore
		done.style.display = "grid";
	}
	else if (serviceWorkerInstallation) {
		// @ts-ignore
		processing.style.display = "grid";
		waitInstall(windowClose, processing, done);
	}
	else {
		// @ts-ignore
		start.style.display = "block";
	}
	const overlayWindow = new OverlayWindow(documentFragment, "离线缓存", { containerClassName: "help-cache", size: { height: "8rem", width: "32rem" } });
	overlayWindow.addEventListener("closed", throwWindowClose.bind(null, windowCloseCall));
}

function about() {
	new OverlayWindow(parse([
		["style", [
			".help-about{display:grid;gap:1rem;justify-items:center;padding:0 2rem}",
			"#help-about-title{font-size:2rem}"
		]],
		["span", "JSON 索引化编辑工具", {id:"help-about-title"}],
		["span", "版本：2.0.4 (7)"],
		["span", "© BlueSky Information Factory"],
	]), "关于本应用", { containerClassName: "help-about" });
}

menus.push({
	text: "帮助",
	sort: 10,
	list: [{
		type: "item",
		text: "缓存应用程序",
		onSelect: cacheResource
	}, {
		type: "item",
		text: "关于本应用",
		onSelect: about
	}]
});
renderMenu();