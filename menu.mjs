import { EVENT_LISTENERS, parse } from "/javascript/module/array_HTML.mjs";
import { showMenu, closeMenu } from "../../javascript/module/context_menu.mjs";
/** @type {{text: string, list: Parameters<showMenu>[0], sort: number}[]} */
const menus = [], menuElement = document.getElementById("menu");
var focusItem = null, expanded = false, keepFocus = false, keyboardMode = true;
function sort(item1, item2) { return item1.sort - item2.sort }
function renderMenu() {
	menuElement.innerHTML = "";
	menus.sort(sort);
	// @ts-ignore
	menuElement.appendChild(parse(menus.map(menuItemMapper)))
}
function keyboardEvent(event) {
	if (event.ctrlKey || event.shiftKey || event.altKey) return;
	switch (event.key) {
		case "tab": break;
		case "ArrowRight": {
			keepFocus = true;
			const children = menuElement.children, currentIndex = focusItem.tabIndex;
			// @ts-ignore
			menuElement.children[currentIndex < children.length - 1 ? currentIndex + 1 : 0].focus();
			break;
		}
		case "ArrowLeft": {
			keepFocus = true;
			const children = menuElement.children, currentIndex = focusItem.tabIndex;
			// @ts-ignore
			menuElement.children[currentIndex ? currentIndex - 1 : children.length - 1].focus();
			break;
		}
		case "Escape":
			focusItem.blur();
			break;
		default:
			return;
	}
	event.preventDefault()
}
function onMenuFocus() { document.addEventListener("keydown", keyboardEvent) }
function onMenuBlur() {
	focusItem = null;
	document.removeEventListener("keydown", keyboardEvent);
}
function onItemFocus() {
	if (!focusItem) onMenuFocus();
	focusItem = this;
}
function onItemBlur() { if (keepFocus) { keepFocus = false } else onMenuBlur() }
function onItemHover() {
	if (expanded) {
		keyboardMode = false;
		this.click();
	} else if (focusItem) this.focus();
}
function onListClose(selected) {
	this.classList.remove("active");
	if (keepFocus) {
		keepFocus = false;
	} else if (selected) {
		expanded = false;
		onMenuBlur();
	} else {
		expanded = false;
		focusItem.focus();
	}
}
/** @this {HTMLButtonElement} */
function onItemClick(event) {
	const lastFocus = focusItem;
	focusItem = this;
	if (lastFocus) {
		keepFocus = true;
		lastFocus.blur();
	} else onMenuFocus();
	this.classList.add("active");
	expanded = true
	showMenu(menus[this.tabIndex].list, { element: this }, { darkStyle: true, onClose: onListClose.bind(this), keyboardMode: keyboardMode && !event.pointerType });
	keyboardMode = true;
}
function menuItemMapper(item, tabindex) {
	return ["button", item.text, {
		class: "menu-item", tabindex, [EVENT_LISTENERS]: [
			["mouseenter", onItemHover],
			["click", onItemClick],
			["focus", onItemFocus],
			["blur", onItemBlur]
		]
	}]
}

document.addEventListener("keydown", function (event) {
	if (event.key != "Alt" || event.ctrlKey || event.shiftKey) return;
	event.preventDefault();
	if (focusItem) {
		if (expanded) closeMenu();
		focusItem.blur();
		// @ts-ignore
	} else menuElement.firstElementChild.focus();
});

export { menus, renderMenu };