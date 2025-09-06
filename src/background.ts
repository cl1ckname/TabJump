chrome.runtime.onInstalled.addListener(() => {
	console.log("Jump Tab installed ✅");
});

const LABELS = [
	..."abcdefghijklmnopqrstuvwxyz",
	..."ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	..."0123456789"
];

const originalTitles: Map<number, string> = new Map;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.type === "REQUEST_TABS") {
		chrome.windows.getCurrent({ populate: true }, (window) => {
			if (!window?.tabs) return;

			const tabs = window.tabs.slice(0, LABELS.length);

			tabs.forEach((tab, i) => {
				if (!tab.url) {
					return
				}
				if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
					return;
				}

				const label = LABELS[i];
				if (!tab.id) return;
				originalTitles.set(tab.id, tab.title || "")

				chrome.scripting.executeScript({
					target: { tabId: tab.id },
					func: (label) => {
						if (!document.title.startsWith(`[${label}]`)) {
							document.title = `[${label}] ${document.title}`;
						}
					},
					args: [label]
				});
			});

			const mapping = tabs.map((tab, i) => ({
				label: LABELS[i],
				id: tab.id!,
				title: tab.title
			}));

			sendResponse({ tabs: mapping });
		});

		return true;
	}

	if (message.type === "JUMP_TO_TAB" || message.type === "CLEAR_TAB_PREFIXES") {
		const tabIdToJump = message.tabId as number | undefined;

		// Restore all titles
		originalTitles.forEach((originalTitle, tabId) => {
			chrome.scripting.executeScript({
				target: { tabId },
				func: (title: string) => (document.title = title),
				args: [originalTitle],
			});

		})

		originalTitles.forEach((_, key) => { originalTitles.delete(key) });

		if (tabIdToJump) {
			chrome.tabs.update(tabIdToJump, { active: true });
			chrome.windows.update(sender.tab?.windowId!, { focused: true });
		}

		sendResponse({ success: true });
		return true;
	}
});

//
