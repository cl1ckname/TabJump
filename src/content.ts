type TabMapping = {
	label: string;
	id: number;
	title?: string;
};

let overlay: boolean = false;
let tabMappings: TabMapping[] = [];

window.addEventListener("keydown", (e) => {
	const pressed = e.key
	if (overlay) {
		if (pressed === "Escape") {
			chrome.runtime.sendMessage({ type: "CLEAR_TAB_PREFIXES" })
		}
	}


	if (!e.altKey) return;
	if (pressed === "Alt") return;

	if (pressed === "j" && !overlay) {
		e.preventDefault()
		const target = e.target as HTMLElement;
		if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
			return;
		}

		chrome.runtime.sendMessage({ type: "REQUEST_TABS" }, (response) => {
			tabMappings = response.tabs;
			overlay = true
		});
	} else if (overlay) {
		overlay = false
		const match = tabMappings.find((t) => t.label === pressed);

		if (match) {
			chrome.runtime.sendMessage({ type: "JUMP_TO_TAB", tabId: match.id });
		} else {
			if (pressed === "Escape") {
				chrome.runtime.sendMessage({ type: "CLEAR_TAB_PREFIXES" })
			}
		}
	}
});
