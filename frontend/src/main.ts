import { invoke } from "@tauri-apps/api/core";

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;

async function greet() {
    if (greetMsgEl && greetInputEl) {
        greetMsgEl.textContent = await invoke("greet", {
            name: greetInputEl.value,
        });
    }
}

window.addEventListener("DOMContentLoaded", () => {
    greetInputEl = document.querySelector("#greet-input-el");
    greetMsgEl = document.querySelector("#greet-msg");
    document.querySelector("#greet-btn")?.addEventListener("click", () => greet());
});

console.log("What Todo Next - Application loaded");