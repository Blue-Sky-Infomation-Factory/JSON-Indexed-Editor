import { config, indexorStorage } from "../data.mjs";
import { parse, parseAndGetNodes, EVENT_LISTENERS } from "/javascript/module/array_HTML.mjs";
import { changeTab, createTab, getTab } from "../ui.mjs";
import MiniWindow from "/javascript/module/MiniWindow.mjs";
import Notifier from "/javascript/module/Notifier.mjs";
function buildSet(item) {
	const name = item.name;
	return ["button", [
		["span", name, { class: "indexor-management-set-name", title: name }],
		["span", `${item.indexors.length}个索引器，${item.variables.length}个变量`, { class: "indexor-management-set-detail" }]
	], { class: "indexor-management-set", "data-id": name, [EVENT_LISTENERS]: [["click", userChangeSetDetail, { passive: true }]] }, name]
}
function buildVariable(item) { return ["div", `${item.name} = ${item.value}`] }
function buildIndexor(item) {
	return ["div", [
		['span', "名称："], ['span', item.name],
		['span', "路径："], ['span', item.path]
	]]
}
function updateCurrentSet() {
	currentSetIndexors.textContent = currentSet.indexors.length;
	currentSetVariables.textContent = currentSet.variables.length;
	if (!showingSetName) updateSetDetail(currentSet);
}
function modifyCurrentSet(data) {
	if (!(data instanceof Object)) throw new TypeError("Invalid data.");
	const { indexors, variables } = data;
	if (!Array.isArray(indexors)) throw new TypeError("Invalid data.");
	if (!Array.isArray(variables)) throw new TypeError("Invalid data.");
	const temp1 = [], temp2 = [];
	for (const item of indexors) {
		if (!(item instanceof Object)) throw new TypeError("Invalid data.");
		const { name, path } = item;
		temp1.push({
			name: typeof name == "string" ? name : "",
			path: typeof path == "string" ? path : ""
		});
	}
	for (const item of variables) {
		if (!(item instanceof Object)) throw new TypeError("Invalid data.");
		const { name, value } = item;
		if (typeof name != "string" || !name || typeof value != "number") throw new TypeError("Invalid data.");
		temp2.push({ name, value });
	}
	currentSet = { indexors: temp1, variables: temp2 };
	config.update(currentSet, "currentSet");
	updateCurrentSet();
	currentSetChangeNotifier.trigger();
}
async function updateSetsList() {
	list.innerHTML = "";
	const setsList = await indexorStorage.getAll(),
		// @ts-ignore
		elements = sets = parseAndGetNodes(setsList.map(buildSet), list);
	for (const item of setsList) {
		const name = item.name;
		// @ts-ignore
		elements[name] = {
			data: item,
			element: elements[name]
		}
	}
	if (!Object.hasOwn(elements, showingSetName)) changeSetDetail("");
}
function changeSetDetail(setName) {
	var data, element;
	if (setName) {
		const set = sets[showingSetName = setName];
		data = set.data;
		element = set.element;
		saveSet.display = "none";
		renameSet.display = applySet.display = deleteSet.display = null;
	} else {
		data = currentSet;
		// @ts-ignore
		(element = currentSetElement).scrollIntoViewIfNeeded();
		setName = "当前使用方案";
		showingSetName = "";
		saveSet.display = null;
		renameSet.display = applySet.display = deleteSet.display = "none";
	}
	showingSetElement.classList.remove("current");
	(showingSetElement = element).classList.add("current");
	setNameTitle.title = setNameTitle.textContent = setName;
	updateSetDetail(data);
}
function userChangeSetDetail() { changeSetDetail(this.dataset.id) }
function updateSetDetail({ variables, indexors }) {
	variablesList.innerHTML = indexorsList.innerHTML = "";
	if (variablesNumber.textContent = variables.length) {
		variablesList.classList.remove("empty");
		variablesList.appendChild(parse(variables.map(buildVariable)));
	} else {
		variablesList.classList.add("empty");
	}
	if (indexorsNumber.textContent = indexors.length) {
		indexorsList.classList.remove("empty");
		indexorsList.appendChild(parse(indexors.map(buildIndexor)));
	} else {
		indexorsList.classList.add("empty");
	}
}
/**
 * @type {{
 * listFrame: HTMLDivElement,
 * list: HTMLDivElement,
 * detail: HTMLDivElement,
 * renameSet: HTMLButtonElement,
 * saveSet: HTMLButtonElement,
 * applySet: HTMLButtonElement,
 * deleteSet: HTMLButtonElement,
 * currentSetElement: HTMLButtonElement,
 * currentSetIndexors: Text,
 * currentSetVariables: Text,
 * setNameTitle: HTMLSpanElement,
 * variablesNumber: HTMLSpanElement,
 * indexorsNumber: HTMLSpanElement,
 * variablesList: HTMLDivElement,
 * indexorsList: HTMLDivElement
 * }}
 */
//@ts-ignore
const {
	listFrame, list, detail, renameSet: { style: renameSet }, saveSet: { style: saveSet }, applySet: { style: applySet }, deleteSet: { style: deleteSet },
	currentSetElement, currentSetIndexors, currentSetVariables, setNameTitle, variablesNumber, indexorsNumber, variablesList, indexorsList
} = parseAndGetNodes([
	["div", [
		["button", [
			["span", "当前使用方案", { class: "indexor-management-set-name" }],
			["span", [
				["#text", "0", null, "currentSetIndexors"],
				"个索引器，",
				["#text", "0", null, "currentSetVariables"],
				"个变量"], { class: "indexor-management-set-detail" }]
		], { class: "indexor-management-set current", "data-id": "", [EVENT_LISTENERS]: [["click", userChangeSetDetail, { passive: true }]] }, "currentSetElement"],
		["div", "保存的方案", { id: "indexor-management-list-title" }],
		["div", null, { id: "indexor-management-list" }, "list"]
	], { id: "indexor-management-list-frame" }, "listFrame"],
	["div", [
		["div", [
			["span", "当前使用方案", { id: "indexor-management-detail-name" }, "setNameTitle"],
			["div", [
				["button", "保存方案", {
					class: "default-color", [EVENT_LISTENERS]: [
						["click", async () => {
							const name = await MiniWindow.prompt("请输入方案名称：", "方案" + Date.now());
							if (!name) {
								MiniWindow.alert("方案名称不能为空！");
								return;
							}
							if (Object.hasOwn(sets, name) && !await MiniWindow.confirm("已经存在此名称的方案，你想要覆盖吗？")) return;
							await indexorStorage.update({ name, ...currentSet });
							await updateSetsList();
							changeSetDetail(name);
						}, { passive: true }]
					]
				}, "saveSet"],
				["button", "使用方案", {
					class: "default-color", [EVENT_LISTENERS]: [
						["click", async () => {
							if (!await MiniWindow.confirm("确定要使用这一方案吗？未保存的当前使用方案将会丢失！")) return;
							modifyCurrentSet(sets[showingSetName].data);
							changeSetDetail("");
							currentSetChangeNotifier.trigger()
						}, { passive: true }]
					]
				}, "applySet"],
				["button", "删除方案", {
					class: "default-color", [EVENT_LISTENERS]: [
						["click", async () => {
							if (!await MiniWindow.confirm("确定要删除这一方案吗？此操作不可撤销！")) return;
							await indexorStorage.delete(showingSetName);
							await updateSetsList();
						}, { passive: true }]
					]
				}, "deleteSet"],
				["button", "重命名", {
					class: "default-color", [EVENT_LISTENERS]: [
						["click", async () => {
							const name = await MiniWindow.prompt("请输入方案名称：", showingSetName);
							if (!name) {
								MiniWindow.alert("方案名称不能为空！");
								return;
							}
							if (showingSetName == name) return;
							if (Object.hasOwn(sets, name)) {
								MiniWindow.alert("已经存在此名称的方案，重命名失败！");
								return
							};
							const set = sets[showingSetName].data;
							indexorStorage.delete(showingSetName);
							set.name = name;
							await indexorStorage.add(set);
							await updateSetsList();
							changeSetDetail(name);
						}, { passive: true }]
					]
				}, "renameSet"]
			], { id: "indexor-management-detail-buttons" }]
		], { id: "indexor-management-detail-top" }],
		["div", [
			["div", [
				["span", ["变量（", ["#text", "0", null, "variablesNumber"], "）"]],
				["div", null, { class: "indexor-management-detail-part-content empty", id: "indexor-management-detail-variables" }, "variablesList"]
			], { class: "indexor-management-detail-part" }],
			["div", [
				["span", ["索引器（", ["#text", "0", null, "indexorsNumber"], "）"]],
				["div", null, { class: "indexor-management-detail-part-content empty", id: "indexor-management-detail-indexors" }, "indexorsList"]
			], { class: "indexor-management-detail-part" }]
		], { id: "indexor-management-detail-content" }]
	], { id: "indexor-management-detail" }, "detail"]
]).nodes,
	currentSetChangeNotifier = new Notifier;
var currentSet, showingSetElement = currentSetElement, showingSetName = "", sets;
function getCurrentSet() { return structuredClone(currentSet) }
modifyCurrentSet(await config.get("currentSet") ?? { indexors: [], variables: [] });
await updateSetsList();
function show() { changeTab(getTab("indexor-management") || createTab("indexor-management", "索引器方案", [listFrame, detail])) }
export default show;
export { show, getCurrentSet, modifyCurrentSet, currentSetChangeNotifier };