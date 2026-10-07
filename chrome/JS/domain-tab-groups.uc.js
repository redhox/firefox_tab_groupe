// ==UserScript==
// @name           Domain Tab Groups - Favicons
// @description    Affiche le favicon du premier onglet dans l'en-tête des groupes natifs Firefox.
// @include        main
// ==/UserScript==

(() => {
  "use strict";

  const PREFIX = "data-domain-tab-groups-favicon";
  const ICON_SIZE = 16;
  let observer = null;
  let refreshTimer = null;
  const watchedTabs = new WeakSet();

  function log(...args) {
    console.debug("[Domain Tab Groups]", ...args);
  }

  function getGroupTabs(group) {
    try {
      if (Array.isArray(group.tabs)) return group.tabs.filter(Boolean);
    } catch (_) {}
    try {
      return Array.from(group.querySelectorAll(".tabbrowser-tab"));
    } catch (_) {
      return [];
    }
  }

  function getLabel(group) {
    try {
      if (group.labelElement) return group.labelElement;
    } catch (_) {}
    try {
      return group.querySelector(".tab-group-label");
    } catch (_) {
      return null;
    }
  }

  function getIcon(tab) {
    try {
      if (tab?.image) return String(tab.image);
    } catch (_) {}
    try {
      const icon = gBrowser.getIcon(tab);
      if (icon) return String(icon);
    } catch (_) {}
    try {
      const image = tab?.getAttribute("image");
      if (image) return image;
    } catch (_) {}
    return "";
  }

  function setLabelIcon(label, icon) {
    if (!label) return;
    if (icon) {
      label.style.setProperty("--dtg-favicon", `url("${icon.replaceAll('"', '\\"')}")`);
      label.style.setProperty("--dtg-favicon-size", `${ICON_SIZE}px`);
      label.setAttribute(PREFIX, "1");
    } else {
      label.style.removeProperty("--dtg-favicon");
      label.style.removeProperty("--dtg-favicon-size");
      label.removeAttribute(PREFIX);
    }
  }

  function refreshGroup(group) {
    const label = getLabel(group);
    if (!label) return;
    const tabs = getGroupTabs(group);
    const firstWithIcon = tabs.find(tab => getIcon(tab));
    setLabelIcon(label, firstWithIcon ? getIcon(firstWithIcon) : "");
  }

  function refreshAll() {
    refreshTimer = null;
    try {
      const groups = Array.from(gBrowser.tabGroups || []);
      for (const group of groups) refreshGroup(group);
    } catch (e) {
      console.error("[Domain Tab Groups] refresh error", e);
    }
  }

  function scheduleRefresh(delay = 80) {
    if (refreshTimer) return;
    refreshTimer = setTimeout(refreshAll, delay);
  }

  function watchTab(tab) {
    if (!tab || watchedTabs.has(tab)) return;
    watchedTabs.add(tab);

    tab.addEventListener("TabAttrModified", event => {
      const changed = event.detail?.changed || [];
      if (changed.includes("image") || changed.includes("busy") || changed.includes("label")) {
        scheduleRefresh(50);
      }
    });
  }

  function installObservers() {
    if (observer) observer.disconnect();

    observer = new MutationObserver(mutations => {
      let relevant = false;
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          relevant = true;
          for (const node of mutation.addedNodes) {
            if (node?.localName === "tab") watchTab(node);
            if (node?.querySelectorAll) {
              node.querySelectorAll(".tabbrowser-tab").forEach(watchTab);
            }
          }
        } else if (mutation.type === "attributes") {
          if (["image", "group", "collapsed", "label"].includes(mutation.attributeName)) {
            relevant = true;
          }
        }
        if (relevant) break;
      }
      if (relevant) scheduleRefresh();
    });

    const target = gBrowser.tabContainer || document.querySelector("#tabbrowser-tabs");
    if (target) {
      observer.observe(target, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["image", "group", "collapsed", "label"]
      });
    }

    for (const tab of gBrowser.tabs) watchTab(tab);
  }

  async function start() {
    try {
      if (typeof UC_API?.Windows?.waitWindowLoading === "function") {
        await UC_API.Windows.waitWindowLoading(window);
      } else if (typeof gBrowserInit?.delayedStartupFinished === "boolean" && !gBrowserInit.delayedStartupFinished) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    } catch (e) {
      log("waitWindowLoading", e);
    }

    // Give Firefox a little time to finish restoring tab groups and their labels.
    await new Promise(resolve => setTimeout(resolve, 250));

    installObservers();
    refreshAll();

    // Session restore and vertical-tab initialization can continue after startup.
    setTimeout(refreshAll, 1000);
    setTimeout(refreshAll, 2500);

    window.addEventListener("unload", () => observer?.disconnect(), { once: true });
    log("favicon handler loaded");
  }

  start().catch(e => console.error("[Domain Tab Groups] startup error", e));
})();
