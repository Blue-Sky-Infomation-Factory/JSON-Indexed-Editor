import { read, readableTypes, open } from "/javascript/module/file_io.mjs";
import OverlayWindow from "/component/overlay_window/OverlayWindow.mjs";
import { getTab } from "./ui.mjs";
import { renderMenu, menus } from "./menu.mjs";
import { closeFile, load, saveAs, saveFile } from "./tree.mjs";
import { show as showWelcome } from "./components/welcome.mjs";
import { show as showEdit } from "./components/indexed_edit.mjs";
import { show as showIndexorManager } from "./components/indexor_management.mjs";
import "./helper.mjs";
var working = false, pending = false;
async function loadFile(fileHandle) {
	if (pending || working) return;
	pending = true;
	const closeWaitWin = OverlayWindow.wait("正在加载，请稍等……");
	let data
	try {
		data = JSON.parse(await read(await fileHandle.getFile(), readableTypes.TEXT));
		fileHandle.requestPermission({ mode: "readwrite" });
	} catch (error) {
		pending = false;
		OverlayWindow.alert("无法解读该文件，请选择正确的 JSON 文件。", "错误！");
		closeWaitWin();
		return;
	}
	startWork(data, fileHandle);
	document.title = fileHandle.name;
	pending = false;
	closeWaitWin();
}
function preventDefault(event) { event.preventDefault() }
function startWork(data, fileHandle) {
	if (working) {
		OverlayWindow.alert("此实例已经打开了文件，请启动一个新实例。");
		return;
	}
	working = true;
	load(data, fileHandle);
	getTab("welcome").close();
	showEdit();
}
async function openFile() {
	if (working || pending) return;
	try { loadFile(await open({ types: [{ accept: { "application/json": [".json"] } }] })) } catch (e) { }
}
function endWork() {
	working = false;
	document.title = "JSON 索引化编辑器"
	getTab("indexed-edit").close();
	showWelcome();
}
document.addEventListener("dragover", event => {
	event.preventDefault();
	event.dataTransfer.dropEffect = "none";
});
document.addEventListener("drop", preventDefault);
menus.push({
	text: "文件",
	sort: 0,
	list: [{
		type: "item",
		text: "打开文件",
		get disabled() { return working },
		onSelect: openFile
	}, {
		type: "item",
		text: "保存文件",
		get disabled() { return !working },
		keys: {
			ctrl: true,
			key: "S"
		},
		onSelect: saveFile
	}, {
		type: "item",
		text: "另存为",
		get disabled() { return !working },
		onSelect: saveAs
	}, {
		type: "item",
		text: "关闭文件",
		get disabled() { return !working },
		onSelect: closeFile
	}]
}, {
	text: "查看",
	sort: 1,
	list: [{
		type: "item",
		text: "索引器方案管理",
		onSelect: showIndexorManager
	}]
});
renderMenu();
showWelcome();
// @ts-ignore
launchQueue.setConsumer(function (launchParams) {
	const file = launchParams.files[0];
	if (file) loadFile(file);
});
document.getElementById("loading-mask").remove();
export { endWork, openFile }