import { Indexor } from "../indexor.mjs";
import { parseAndGetNodes, EVENT_LISTENERS, parse as parseAH } from "/javascript/module/array_HTML.mjs";
import { createTab } from "../ui.mjs";
import OverlayWindow from "/component/overlay_window/OverlayWindow.mjs";
import { currentSetChangeNotifier, getCurrentSet, modifyCurrentSet } from "./indexor_management.mjs";
import showMenu from "/component/context_menu/context_menu.mjs";
const { stringify, parse } = JSON,
	/** @ts-ignore @type {{indexorFrame: HTMLDivElement, index: HTMLInputElement}} */
	{ indexorFrame, variableFrame } = parseAndGetNodes([
		["div", null, { id: "indexed-edit-variable-frame" }, "variableFrame"],
		["div", null, { id: "indexed-edit-indexor-frame" }, "indexorFrame"]
	]).nodes,
	identifierRegexp = /^[A-Za-z_$][\w$]*$/;

//索引器部分
/**@type {IndexorItem[]}*/
var indexors,
	/**@type {VaribaleItem[]}*/
	variables = [],
	/**@type {Map<string, VaribaleItem>}*/
	variablesMapping = new Map,
	/** @type {VaribaleItem} */
	currentActiveVariable = null;
class IndexorItem {
	#indexor = new Indexor;
	#name = "";
	/** @type {HTMLInputElement} */
	#nameElement;
	get name() { return this.#name }
	set name(value) {
		if (typeof value != "string") throw new TypeError("Invalid type");
		this.#nameElement.value = this.#name = value;
	}
	#userChangedName() {
		this.#name = this.#nameElement.value;
		updateCurrentSet();
	}
	/** @type {HTMLInputElement} */
	#pathElement;
	get path() { return this.#indexor.path }
	set path(value) {
		this.#pathElement.value = this.#indexor.path = value;
		this.#updateNode();
	}
	#node = null;
	get route() { return this.#indexor.route }
	#userChangedPath() {
		this.#indexor.path = this.#pathElement.value
		this.#updateNode();
		updateCurrentSet();
	}
	#updateNode() {
		const path = this.#pathElement,
			content = this.#contentElement;
		content.value = "";
		content.className = "indexor-content";
		var node;
		try {
			node = this.#node = this.#indexor.getNode(variablesMapping);
		} catch (e) {
			this.#node = null;
			content.disabled = true;
			content.placeholder = "索引路径错误";
			path.className = "indexor-path invalid";
			return;
		}
		if (!node) {
			path.className = "indexor-path";
			content.disabled = true;
			content.placeholder = "索引路径无效";
			return;
		}
		const type = node.type;
		switch (type) {
			case "string":
			case "number":
			case "boolean":
				path.className = "indexor-path " + type;
				content.disabled = false;
				content.placeholder = "请输入内容";
				content.value = stringify(node.value);
				return;
			case "null":
			case "undefined":
				content.disabled = true;
				content.placeholder = type;
				break;
			default:
				content.disabled = true;
				content.placeholder = "无法编辑的类型";
		}
		path.className = "indexor-path";
	}
	/** @type {HTMLInputElement} */
	#contentElement;
	#content;
	get content() { return this.#content }
	set content(value) {
		if (typeof value != "string") throw new TypeError("Invalid type");
		setContent(this.#node, this.#contentElement.value = this.#content = value.trim())
	}
	#userChangedContent() {
		const contentElement = this.#contentElement;
		contentElement.className = setContent(this.#node, this.#content = contentElement.value.trim()) ? "indexor-content" : "indexor-content invalid";
	}
	/** @type {HTMLDivElement} */
	#element;
	get element() { return this.#element }
	constructor(name = "", path = "") {
		/** @ts-ignore @type {{name: HTMLInputElement, path: HTMLInputElement, content: HTMLInputElement, element: HTMLDivElement}} */
		const nodes = parseAndGetNodes([["div", [
			["input", null, { class: "indexor-name", spellcheck: "false", placeholder: "索引器名称", value: name, [EVENT_LISTENERS]: [["input", this.#userChangedName.bind(this)]] }, "name"],
			["button", null, { class: "indexor-remove", title: "移除索引器", [EVENT_LISTENERS]: [["click", removeIndexor.bind(null, this)]] }],
			["span", "索引路径：", { class: "indexor-path-d" }],
			["input", null, { class: "indexor-path", spellcheck: "false", placeholder: "索引路径", value: path, [EVENT_LISTENERS]: [["input", this.#userChangedPath.bind(this)]] }, "path"],
			["input", null, { class: "indexor-content", spellcheck: "false", placeholder: "请输入内容", [EVENT_LISTENERS]: [["input", this.#userChangedContent.bind(this)]] }, "content"]
		], { class: "indexor" }, "element"]]).nodes;
		this.#element = nodes.element;
		this.#nameElement = nodes.name;
		this.#pathElement = nodes.path;
		this.#contentElement = nodes.content;
		this.#name = name;
		this.#indexor.path = path;
	}
	update() { this.#updateNode() }
	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: this.name,
			configurable: true
		})
	}
}
function newIndexor() {
	const indexor = new IndexorItem;
	indexor.update();
	indexors.push(indexor);
	indexorFrame.appendChild(indexor.element);
	updateCurrentSet();
}
async function removeIndexor(instance) {
	const i = indexors.indexOf(instance);
	if (i != -1 && await OverlayWindow.confirm("确定要移除这个索引器吗？")) {
		indexors.splice(i, 1);
		instance.element.remove();
		updateCurrentSet();
	}
}
async function removeAllIndexor() {
	if (indexors.length && await OverlayWindow.confirm("确定要移除全部索引器吗？")) {
		indexorFrame.innerHTML = "";
		indexors = [];
		updateCurrentSet();
	}
}
function updateAllIndexor() { for (const item of indexors) item.update() }
function setContent(node, content) {
	if (!node) return false;
	var parseContent;
	try { parseContent = parse(content) } catch (e) { return false }
	const type = typeof parseContent;
	if (type == node.type) {
		node.value = parseContent;
		node.content.innerText = content;
		return true;
	}
	return false;
}

class VaribaleItem {
	/** @type {string} */
	name;
	#value;
	get value() { return this.#value }
	set value(value) {
		if (typeof value != "number") throw new TypeError("Invalid type");
		// @ts-ignore
		this.#valueElement.value = this.#value = value;
		updateAllIndexor();
	}
	#userChangeValue() {
		this.#value = Number(this.#valueElement.value);
		updateAllIndexor();
		updateCurrentSet();
	}
	#element;
	get element() { return this.#element }
	#valueElement;
	#active = false;
	get active() { return this.#active }
	set active(value) { this.#element.classList[(this.#active = Boolean(value)) ? "add" : "remove"]("active") }
	/** @param {string} name */
	constructor(name, initialValue = 0) {
		Object.defineProperty(this, "name", { value: name, enumerable: true });
		this.#value = initialValue;
		/** @ts-ignore @type {{value: HTMLInputElement, element: HTMLDivElement}} */
		const nodes = parseAndGetNodes([["div", [
			["button", null, { class: "variable-remove", [EVENT_LISTENERS]: [["click", removeVariable.bind(null, this)]] }],
			["span", name, { class: "variable-name" }],
			["input", null, { class: "variable-value", type: "number", value: initialValue, [EVENT_LISTENERS]: [["change", this.#userChangeValue.bind(this)]] }, "value"]
		], { class: "variable" }, "element"]]).nodes;
		this.#element = nodes.element;
		this.#valueElement = nodes.value;
	}
	static {
		Object.defineProperty(this.prototype, Symbol.toStringTag, {
			value: this.name,
			configurable: true
		})
	}
}
async function newVariable() {
	const name = await OverlayWindow.prompt("请输入变量名称");
	if (!identifierRegexp.test(name)) {
		OverlayWindow.alert("名称不符合规则！名称只能包含字母、数字、下划线、横杠，且不能以数字开头。");
		return;
	}
	if (variablesMapping.has(name)) {
		OverlayWindow.alert("已存在具有该名称的变量。");
		return;
	}
	const variable = new VaribaleItem(name);
	variables.push(variable);
	variablesMapping.set(name, variable);
	variableFrame.appendChild(variable.element);
	updateAllIndexor();
	updateCurrentSet();
}
/** @param {VaribaleItem} instance */
async function removeVariable(instance) {
	const i = variables.indexOf(instance), name = instance.name;
	if (i != -1 && await OverlayWindow.confirm(`确定要移除变量 ${name} 吗？`)) {
		if (currentActiveVariable == instance) currentActiveVariable = null;
		variablesMapping.delete(name)
		variables.splice(i, 1);
		instance.element.remove();
		updateAllIndexor();
		updateCurrentSet();
	}
}
async function removeAllVariable() {
	if (variables.length && await OverlayWindow.confirm("确定要移除全部变量吗？")) {
		variableFrame.innerHTML = "";
		currentActiveVariable = null;
		variablesMapping = new Map();
		variables = [];
		updateAllIndexor();
		updateCurrentSet();
	}
}
function variableActiveShortCut(nextOrPrevious) {
	const max = variables.length - 1;
	if (max < 0) return;
	if (currentActiveVariable) {
		if (max < 1) return;
		var index = variables.indexOf(currentActiveVariable);
		index = nextOrPrevious ?
			(index < max ? index + 1 : 0) :
			(index ? index - 1 : max);
		currentActiveVariable.active = false;
		(currentActiveVariable = variables[index]).active = true;
	} else {
		(currentActiveVariable = variables[nextOrPrevious ? 0 : max]).active = true;
	}
}
function variableBumpShortCut(upOrDown) {
	if (!currentActiveVariable) return;
	if (upOrDown) { ++currentActiveVariable.value }
	else --currentActiveVariable.value;
	updateCurrentSet();
}
/**
 * @param {KeyboardEvent} event
 */
function variableKeyEvent(event) {
	if (!event.ctrlKey || event.shiftKey || event.altKey) return;
	switch (event.key) {
		case "ArrowRight":
			variableActiveShortCut(true);
			break;
		case "ArrowLeft":
			variableActiveShortCut(false);
			break;
		case "ArrowUp":
			variableBumpShortCut(true);
			break;
		case "ArrowDown":
			variableBumpShortCut(false);
			break;
		default:
			return;
	}
	event.preventDefault();
}
function enableVariableKey() { document.addEventListener("keydown", variableKeyEvent) }
function disableVariableKey() { document.removeEventListener("keydown", variableKeyEvent) }

function loadSet() {
	if (selfSetUpdate) return;
	const { indexors: indexorSet, variables: variableSet } = getCurrentSet();
	variableFrame.innerHTML = indexorFrame.innerHTML = "";
	indexors = [];
	variables = [];
	variablesMapping = new Map();
	var updated = false;
	if (variableSet.length) {
		const fragment = new DocumentFragment;
		for (const { name, value } of variableSet) {
			const item = new VaribaleItem(name, value);
			variables.push(item);
			variablesMapping.set(item.name, item);
			fragment.appendChild(item.element);
		}
		variableFrame.appendChild(fragment);
	} else {
		const item = new VaribaleItem("i");
		variables.push(item);
		variablesMapping.set(item.name, item);
		variableFrame.appendChild(item.element);
		updated = true;
	}
	if (indexorSet.length) {
		const fragment = new DocumentFragment;
		for (const { name, path } of indexorSet) {
			const item = new IndexorItem(name, path);
			indexors.push(item);
			fragment.appendChild(item.element);
		}
		indexorFrame.appendChild(fragment);
	} else {
		const item = new IndexorItem;
		indexors.push(item);
		indexorFrame.appendChild(item.element);
		updated = true;
	}
	updateAllIndexor();
	if (updated) updateCurrentSet();
}
var selfSetUpdate = false;
function updateCurrentSet() {
	selfSetUpdate = true;
	try { modifyCurrentSet({ indexors, variables }) } catch (e) { console.error(e) }
	selfSetUpdate = false;
}
currentSetChangeNotifier.addHandler(loadSet);
loadSet();

function holdMenu(element, list) {
	const classList = element.classList;
	classList.add("hold");
	showMenu(list, { element }, { darkStyle: true, onClose: onMenuClose.bind(null, classList), pureList: true });
}
function onMenuClose(classList) { classList.remove("hold") }
/** @type {Parameters<showMenu>[0]} */
const indexorMenu = [{
	type: "item",
	text: "添加索引器",
	onSelect: newIndexor
}, {
	type: "item",
	text: "移除全部索引器",
	onSelect: removeAllIndexor
}], variableMenu = [{
	type: "item",
	text: "添加变量",
	onSelect: newVariable
}, {
	type: "item",
	text: "移除全部变量",
	onSelect: removeAllVariable
}];

const content = Array.from(parseAH([
	["div", [
		"索引变量",
		["button", null, {
			class: "indexed-edit-options", title: "索引变量选项",
			[EVENT_LISTENERS]: [["click", function () { holdMenu(this, variableMenu) }]]
		}],
		variableFrame
	], { id: "indexed-edit-variables" }],
	["div", [
		"索引器",
		["button", null, {
			class: "indexed-edit-options", title: "索引器选项",
			[EVENT_LISTENERS]: [["click", function () { holdMenu(this, indexorMenu) }]]
		}]
	], { id: "indexed-edit-indexor" }],
	indexorFrame
]).childNodes);

function show() {
	const tab = createTab("indexed-edit", "索引式编辑", content, false);
	tab.addEventListener("show", enableVariableKey);
	tab.addEventListener("hide", disableVariableKey);
}

export { updateAllIndexor, show };