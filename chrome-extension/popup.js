document.addEventListener("DOMContentLoaded", async () => {
  const pageTitleEl = document.getElementById("page-title");
  const pageUrlEl = document.getElementById("page-url");
  const importBtn = document.getElementById("import-btn");
  
  const statusLoading = document.getElementById("status-loading");
  const statusSuccess = document.getElementById("status-success");
  const statusError = document.getElementById("status-error");
  const viewDealLink = document.getElementById("view-deal-link");

  let activeTab = null;

  // 1. Get the current active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeTab = tabs[0];
    
    if (activeTab) {
      pageTitleEl.textContent = activeTab.title || "Untitled Page";
      pageUrlEl.textContent = activeTab.url || "";
      
      // Enable button only if we have a valid HTTP/HTTPS page
      if (activeTab.url && activeTab.url.startsWith("http")) {
        importBtn.removeAttribute("disabled");
      } else {
        pageTitleEl.textContent = "Unsupported page type";
        pageUrlEl.textContent = "Extension requires an HTTP/HTTPS site";
      }
    }
  } catch (err) {
    console.error("Error query active tab:", err);
    pageTitleEl.textContent = "Error loading tab info";
  }

  // 2. Handle the Import button click
  importBtn.addEventListener("click", async () => {
    if (!activeTab) return;

    // Reset status views
    statusLoading.style.display = "flex";
    statusSuccess.style.display = "none";
    statusError.style.display = "none";
    importBtn.setAttribute("disabled", "true");

    try {
      // Execute scripting to grab page content from tab
      const results = await chrome.scripting.executeScript({
        target: { tabId: activeTab.id },
        files: ["content.js"]
      });

      const pageText = results?.[0]?.result || "";

      // Send payload to Next.js API endpoint
      const response = await fetch("http://localhost:3000/api/extension/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          url: activeTab.url,
          title: activeTab.title || "Imported Website Target",
          htmlContent: pageText
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.projectId) {
        statusLoading.style.display = "none";
        statusSuccess.style.display = "flex";
        viewDealLink.setAttribute("href", `http://localhost:3000/projects/${data.projectId}`);
      } else {
        throw new Error("Invalid response schema from server");
      }
    } catch (err) {
      console.error("Import error:", err);
      statusLoading.style.display = "none";
      statusError.style.display = "block";
      importBtn.removeAttribute("disabled");
    }
  });
});
