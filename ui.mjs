import { uiData } from "./data.mjs";
import { EVENT_LISTENERS, parseAndGetNodes } from "/javascript/module/array_HTML.mjs";
// 预览窗格宽度控制
const ceil = Math.ceil,
	previewFrame = document.getElementById("preview-frame"),
	previewFrameStyle = previewFrame.style,
	previewSwitch = document.getElementById("preview-switch"),
	rootStyle = document.documentElement.style;
let previewFrameWidth, save = false, previewSwitchState = true;
previewFrameStyle.width = (await uiData.get("previewFrameWidth") ?? 256) + "px";
const resizeObserver = new ResizeObserver(([{ borderBoxSize: [{ inlineSize }] }]) => {
	previewFrameWidth = ceil(inlineSize);
	if (!save) return;
	save = false;
	uiData.update(previewFrameWidth, "previewFrameWidth");
});
resizeObserver.observe(previewFrame);
function resize({ movementX }) { previewFrameStyle.width = (previewFrameWidth += movementX) + "px" };
function resizeEnd() {
	window.removeEventListener("pointermove", resize);
	window.removeEventListener("pointerup", resizeEnd);
	window.removeEventListener("blur", resizeEnd);
	save = true;
	resizeObserver.observe(previewFrame);
	rootStyle.cursor = null;
}
document.getElementById("preview-resize").addEventListener("pointerdown", /* resizeStart */() => {
	resizeObserver.disconnect();
	window.addEventListener("pointermove", resize, { passive: true });
	window.addEventListener("pointerup", resizeEnd, { passive: true });
	window.addEventListener("blur", resizeEnd, { passive: true });
	rootStyle.cursor = "ew-resize";
});
previewSwitch.addEventListener("click", function () {
	if (previewSwitchState = !previewSwitchState) {
		previewFrame.className = "on";
		previewSwitch.title = "收起预览窗格";
	} else {
		previewFrame.className = "off";
		previewSwitch.title = "展开预览窗格";
	}
	previewSwitch.blur();
})
// 选项卡控制
const tabsElement = document.getElementById("editor-tabs"),
	tabsOverlayTrack = document.getElementById("editor-tabs-scroll-bar"),
	tabsOverlayTrackStyle = tabsOverlayTrack.style,
	tabsOverlaySlide = document.getElementById("editor-tabs-scroll-bar-slide").style,
	pageFrame = document.getElementById("editor-page"),
	relation = Symbol("relation");
var tabsWidth, tabsContentWidth, tabsSlideWidth, tabsSlideMotionSpace, tabsMotionSpace, dragScrollOrigin;
function tabsChange() {
	if (tabsContentWidth > tabsWidth) {
		tabsOverlayTrackStyle.display = null;
		tabsOverlaySlide.width = (tabsSlideWidth = ceil(tabsWidth / tabsContentWidth * tabsWidth)) / 16 + "rem";
		tabsSlideMotionSpace = tabsWidth - tabsSlideWidth;
		tabsMotionSpace = tabsContentWidth - tabsWidth;
		tabsScroll();
	} else tabsOverlayTrackStyle.display = "none";
}
function tabsScroll() { tabsOverlaySlide.left = tabsElement.scrollLeft / tabsMotionSpace * tabsSlideMotionSpace / 16 + "rem" }
new ResizeObserver(([{ borderBoxSize: [{ inlineSize }] }]) => {
	tabsWidth = ceil(inlineSize);
	tabsContentWidth = tabsElement.scrollWidth;
	tabsChange();
}).observe(tabsElement);
new MutationObserver(([{ addedNodes, removedNodes }]) => {
	if (addedNodes.length || removedNodes.length) {
		tabsContentWidth = tabsElement.scrollWidth;
		tabsChange();
	}
}).observe(tabsElement, { childList: true });
tabsElement.addEventListener("scroll", tabsScroll, { passive: true });
tabsElement.addEventListener("wheel", event => {
	if (event.shiftKey) return;
	const y = event.deltaY;
	if (y) {
		event.preventDefault();
		tabsElement.scrollBy({ left: y, behavior: "smooth" });
	}
});
function dragScroll({ movementX }) { tabsElement.scrollLeft = (dragScrollOrigin += movementX) / tabsSlideMotionSpace * tabsMotionSpace }
function dragScrollEnd() {
	dragScrollOrigin = undefined;
	tabsOverlayTrackStyle.opacity = null;
	window.removeEventListener("pointermove", dragScroll);
	window.removeEventListener("pointerup", dragScrollEnd);
	window.removeEventListener("blur", dragScrollEnd)
}
tabsOverlayTrack.addEventListener("pointerdown", ({ target, offsetX }) => {
	if (target == tabsOverlayTrack) {
		const half = ceil(tabsSlideWidth / 2);
		if (offsetX - half <= 0) {
			dragScrollOrigin = tabsElement.scrollLeft = 0;
		} else if (tabsSlideMotionSpace + half <= offsetX) {
			tabsElement.scrollLeft = tabsMotionSpace;
			dragScrollOrigin = tabsSlideMotionSpace;
		} else tabsElement.scrollLeft = (dragScrollOrigin = offsetX - half) / tabsSlideMotionSpace * tabsMotionSpace;
	} else dragScrollOrigin = ceil(tabsElement.scrollLeft / tabsMotionSpace * tabsSlideMotionSpace);
	window.addEventListener("pointermove", dragScroll, { passive: true });
	window.addEventListener("pointerup", dragScrollEnd, { passive: true });
	window.addEventListener("blur", dragScrollEnd, { passive: true });
	// @ts-ignore
	tabsOverlayTrackStyle.opacity = 0.5;
}, { passive: true });
function noticeChangeTab(currentTab, lastTab) {
	currentTab.dispatchEvent(new Event("show"));
	lastTab?.dispatchEvent(new Event("hide"));
}
function userChangeTab() { changeTab(this[relation]) }
function changeTab(tab) {
	const lastTab = currentTab;
	lastTab?.tab.classList.remove("current");
	currentTab = tab;
	const tabElement = tab.tab;
	tabElement.classList.add("current");
	pageFrame.innerHTML = "";
	pageFrame.appendChild(tab.page);
	tabElement.scrollIntoViewIfNeeded();
	queueMicrotask(noticeChangeTab.bind(null, tab, lastTab));
}
function userCloseTab(event) {
	event.stopImmediatePropagation();
	this.parentNode[relation].close();
}
function getTab(id) {
	for (const item of tabItems) if (item.id == id) return item;
	return null;
}
class TabItem extends EventTarget {
	constructor(id, title, content, userClosable = true) {
		{
			const exist = getTab(id);
			if (exist) return exist;
		}
		/** @ts-ignore @type {{ tab: HTMLButtonElement, page: HTMLDivElement }} */
		const { tab, page } = parseAndGetNodes([
			["button", [
				["span", title],
				userClosable ? ["button", null, { class: "editor-tab-close", [EVENT_LISTENERS]: [["click", userCloseTab, { passive: true }]] }] : null
			], { class: "editor-tab", draggable: true, [EVENT_LISTENERS]: [["click", userChangeTab, { passive: true }]] }, "tab"],
			["div", content, { id: "editor-page-" + id }, "page"]
		]).nodes;
		super();
		this.id = id;
		this.tab = tab;
		this.page = page;
		Object.freeze(this);
		Object.defineProperty(tab, relation, { value: this });
		Object.defineProperty(page, relation, { value: this });
		tabItems.push(this);
		tabsElement.append(tab);
	}
	close() {
		const index = tabItems.indexOf(this);
		if (index == -1) return;
		tabItems.splice(index, 1);
		this.tab.remove();
		this.dispatchEvent(new Event("close"));
		if (this != currentTab) return;
		const length = tabItems.length;
		if (length) {
			changeTab(tabItems[index < length ? index : length - 1]);
		} else {
			currentTab = null;
			pageFrame.innerHTML = "";
		}
	}
}
var movingTab = null;
function tabDragOver(event) {
	event.preventDefault();
	event.dataTransfer.dropEffect = "move";
	event.stopImmediatePropagation();
}
function tabDragLeave(event) {
	event.preventDefault();
	event.dataTransfer.dropEffect = "none";
}
function tabDrop({ target, layerX }) {
	var targetIndex;
	if (target.className == "editor-tab-close") {
		targetIndex = tabItems.indexOf(target.parentNode[relation]);
	} else if (target.classList.contains("editor-tab")) {
		targetIndex = tabItems.indexOf(target[relation]);
	} else {
		const lastIndex = tabItems.length - 1, lastTab = tabItems[lastIndex].tab;
		if (layerX + tabsElement.scrollLeft > lastTab.offsetLeft + lastTab.offsetWidth) {
			targetIndex = lastIndex;
		} else return;
	}
	const currentIndex = tabItems.indexOf(movingTab);
	if (currentIndex == targetIndex) return;
	if (currentIndex < targetIndex) {
		tabsElement.insertBefore(movingTab.tab, tabItems[targetIndex].tab.nextSibling)
		tabItems.copyWithin(currentIndex, currentIndex + 1, targetIndex + 1);
		tabItems[targetIndex] = movingTab;
	} else {
		tabsElement.insertBefore(movingTab.tab, tabItems[targetIndex].tab);
		tabItems.copyWithin(targetIndex + 1, targetIndex, currentIndex);
		tabItems[targetIndex] = movingTab;
	}
}
function tabDragEnd() {
	movingTab = null
	tabsElement.removeEventListener("dragover", tabDragOver);
	tabsElement.removeEventListener("dragleave", tabDragLeave);
	tabsElement.removeEventListener("drop", tabDrop);
	tabsElement.removeEventListener("dragend", tabDragEnd);
}
tabsElement.addEventListener("dragstart", ({ target }) => {
	movingTab = target[relation];
	tabsElement.addEventListener("dragover", tabDragOver);
	tabsElement.addEventListener("dragleave", tabDragLeave);
	tabsElement.addEventListener("drop", tabDrop);
	tabsElement.addEventListener("dragend", tabDragEnd);
});
function createTab(id, title, content, userClosable = true) {
	const length = tabItems.length,
		tab = new TabItem(id, title, content, userClosable);
	if (!length) changeTab(tab);
	return tab;
}
/** @type {TabItem[]} */
const tabItems = [];
var currentTab = null;
export { createTab, changeTab, getTab };