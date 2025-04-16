import { openFile } from "../main.mjs";
import { createTab } from "../ui.mjs";
import { EVENT_LISTENERS, parse } from "/javascript/module/array_HTML.mjs";
const content = Array.from(parse([
	["div", null, { id: "welcome-icon" }],
	["button", "打开 JSON 文件", { id: "welcome-open", class: "default-color", [EVENT_LISTENERS]: [["click", openFile]] }]
]).childNodes);
function show() { createTab("welcome", "欢迎", content, false) }
show();
export { show };