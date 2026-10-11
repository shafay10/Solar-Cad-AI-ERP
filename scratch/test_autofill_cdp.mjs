import { spawn } from "node:child_process";
import fs from "node:fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9333;
const userDataDir = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\0a665d4c-a16c-4093-a542-73c0fa6e51eb\\scratch\\chrome_profile";

console.log("Launching headless Chrome...");
const chrome = spawn(chromePath, [
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1440,960",
  "about:blank"
], { stdio: "ignore" });

function sleep(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

async function getPageWsUrl() {
  for (let i = 0; i < 20; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      if (res.ok) {
        const json = await res.json();
        const page = json.find((t) => t.type === "page");
        if (page && page.webSocketDebuggerUrl) {
          return page.webSocketDebuggerUrl;
        }
      }
    } catch (e) {}
    await sleep(300);
  }
  throw new Error("Could not connect to Chrome page target");
}

async function main() {
  try {
    const wsUrl = await getPageWsUrl();
    console.log("Connected to page via CDP:", wsUrl);

    const ws = new WebSocket(wsUrl);
    let id = 1;
    const callbacks = new Map();
    const capturedLogs = [];

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && callbacks.has(msg.id)) {
        const cb = callbacks.get(msg.id);
        callbacks.delete(msg.id);
        cb(msg.result);
      }
      if (msg.method === "Runtime.consoleAPICalled") {
        const text = msg.params.args.map((a) => {
          if (a.value !== undefined) return typeof a.value === "object" ? JSON.stringify(a.value) : a.value;
          if (a.description !== undefined) return a.description;
          return JSON.stringify(a);
        }).join(" ");
        const logLine = `[CONSOLE ${msg.params.type.toUpperCase()}]: ${text}`;
        capturedLogs.push(logLine);
        console.log(logLine);
      }
    };

    await new Promise((res) => (ws.onopen = res));

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const reqId = id++;
        callbacks.set(reqId, resolve);
        ws.send(JSON.stringify({ id: reqId, method, params }));
      });
    }

    await send("Runtime.enable");
    await send("Page.enable");

    console.log("Navigating to http://localhost:3000...");
    await send("Page.navigate", { url: "http://localhost:3000" });
    await sleep(3000);

    // Step 1: Click HelioScope CAD tab
    console.log("Clicking 'HelioScope CAD' tab...");
    const cadClick = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const allButtons = Array.from(document.querySelectorAll("button"));
          const cadBtn = allButtons.find(b => b.textContent && b.textContent.includes("HelioScope CAD"));
          if (cadBtn) {
            cadBtn.click();
            return "SUCCESS: Clicked HelioScope CAD tab";
          }
          return "FAILED: HelioScope CAD tab not found";
        })()
      `,
      returnByValue: true
    });
    console.log("Tab result:", cadClick?.result?.value);
    await sleep(3000);

    // Step 2: Click ONLY genuine <button> with Auto-Fill Roof
    console.log("Locating and clicking real <button> with 'Auto-Fill Roof'...");
    const clickEval = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const buttons = Array.from(document.querySelectorAll("button"));
          const autofillBtn = buttons.find(b => b.textContent && b.textContent.trim().includes("Auto-Fill Roof"));
          if (autofillBtn) {
            autofillBtn.click();
            return "SUCCESS: Clicked BUTTON with text: " + autofillBtn.textContent.trim();
          }
          return "NOT_FOUND: Buttons were: " + buttons.map(b => b.textContent.trim()).filter(Boolean).slice(0, 15).join(" | ");
        })()
      `,
      returnByValue: true
    });
    console.log("Click result:", clickEval?.result?.value);

    // Wait 4 seconds for module packing, solarModulesPane creation, and rendering
    await sleep(4000);

    // Inspect Leaflet DOM
    const inspectRes = await send("Runtime.evaluate", {
      expression: `
        (function() {
          const pane = document.querySelector(".leaflet-pane.leaflet-solarModulesPane-pane");
          const polygons = pane ? pane.querySelectorAll("path, polygon") : [];
          const allPanes = Array.from(document.querySelectorAll(".leaflet-pane")).map(p => ({
            class: p.className,
            zIndex: window.getComputedStyle(p).zIndex,
            children: p.children.length
          }));
          return {
            solarModulesPaneFound: !!pane,
            solarModulesPaneZIndex: pane ? window.getComputedStyle(pane).zIndex : null,
            polygonsInSolarModulesPane: polygons.length,
            allLeafletPanes: allPanes,
            windowPanelsLength: (window.__helioScopePanelsRef && window.__helioScopePanelsRef.current) ? window.__helioScopePanelsRef.current.length : 0
          };
        })()
      `,
      returnByValue: true
    });
    console.log("DOM Inspection:", JSON.stringify(inspectRes?.result?.value, null, 2));

    // Capture screenshot
    console.log("Capturing screenshot of map and UI...");
    const shot = await send("Page.captureScreenshot", { format: "png" });
    if (shot && shot.data) {
      const outPath = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\0a665d4c-a16c-4093-a542-73c0fa6e51eb\\autofill_modules_rendered.png";
      fs.writeFileSync(outPath, Buffer.from(shot.data, "base64"));
      console.log("Saved screenshot to:", outPath);
    }

    // Save console logs to file
    const logFilePath = "C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\0a665d4c-a16c-4093-a542-73c0fa6e51eb\\browser_console_output.txt";
    fs.writeFileSync(logFilePath, capturedLogs.join("\n"), "utf8");
    console.log("Saved console output to:", logFilePath);

    ws.close();
  } catch (err) {
    console.error("Error in main:", err);
  } finally {
    chrome.kill();
  }
}

main();
