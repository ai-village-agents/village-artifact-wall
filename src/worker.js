// Artifact Wall — AI Village Showcase, Sat June 13 2026, The Fold SF
// Capture layer only: paper stations remain the game. Scope: ops/cloudflare-artifact-wall-scope-v0.md

const STATIONS = ["Prompt Relay", "Future Headline", "Event-in-a-Box", "Bug Triage", "Arcade", "Other"];

const esc = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;")
  .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const page = (title, body, refresh) => new Response(`<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${refresh ? `<meta http-equiv="refresh" content="${refresh}">` : ""}
<title>${esc(title)}</title>
<style>
:root { --cream:#faf6ee; --ink:#2b2620; --coral:#e8604c; --mint:#bfe3d0; }
* { box-sizing:border-box; }
body { margin:0; background:var(--cream); color:var(--ink); font-family:Georgia,'Times New Roman',serif; }
.wrap { max-width:680px; margin:0 auto; padding:24px 16px 64px; }
h1 { font-size:1.6rem; margin:.2em 0 .1em; }
.sub { color:#6b6258; margin:0 0 1.2em; font-size:.95rem; }
label { display:block; font-weight:bold; margin:1em 0 .3em; }
select,textarea,input[type=text] { width:100%; padding:10px; font-size:1rem; border:2px solid var(--ink); border-radius:8px; background:#fff; font-family:inherit; }
textarea { min-height:120px; }
.consent { display:flex; gap:.6em; align-items:flex-start; margin:1.1em 0; font-size:.95rem; }
.consent input { margin-top:.25em; transform:scale(1.3); }
button.submit { background:var(--coral); color:#fff; border:none; border-radius:10px; padding:12px 22px; font-size:1.05rem; font-family:inherit; cursor:pointer; }
.note { background:var(--mint); border-radius:10px; padding:10px 14px; font-size:.9rem; margin-top:1.4em; }
.err { background:#f7d6d0; border-radius:10px; padding:10px 14px; margin:1em 0; }
.card { background:#fff; border:2px solid var(--ink); border-radius:12px; padding:18px 20px; margin:14px 0; box-shadow:4px 4px 0 rgba(43,38,32,.15); }
.card .text { font-size:1.3rem; white-space:pre-wrap; }
.card .meta { color:#6b6258; font-size:.85rem; margin-top:.6em; }
.tag { display:inline-block; background:var(--mint); border-radius:6px; padding:2px 8px; font-size:.8rem; margin-bottom:.5em; }
.modrow { display:flex; justify-content:space-between; align-items:center; gap:10px; }
a { color:var(--coral); }
footer { margin-top:2.5em; font-size:.85rem; color:#6b6258; }
</style></head><body><div class="wrap">${body}
<footer>Artifact Wall &middot; AI Village Showcase &middot; paper boards are the real game — this is just the keepsake shelf 🦊</footer>
</div></body></html>`, { headers: { "content-type": "text/html; charset=utf-8" } });

const formBody = (err) => `
<h1>Leave one for the Village 🏮</h1>
<p class="sub">If you made a haiku, future headline, event pitch, bug report, or other small artifact tonight, you can optionally share it. We may display selected artifacts during the event and quote non-sensitive excerpts in a recap. Please don't include private contact info or anything you wouldn't want displayed in the room.</p>
${err ? `<div class="err">${esc(err)}</div>` : ""}
<form method="POST" action="/submit">
  <label for="station">Which station is it from?</label>
  <select id="station" name="station" required>
    ${STATIONS.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
  </select>
  <label for="artifact_text">Your artifact</label>
  <textarea id="artifact_text" name="artifact_text" maxlength="500" required placeholder="Type or copy it here (up to 500 characters)"></textarea>
  <label for="display_name">Display name (optional)</label>
  <input type="text" id="display_name" name="display_name" maxlength="40" placeholder="First name, nickname, or leave blank">
  <div class="consent">
    <input type="checkbox" id="consent" name="consent" value="1" required>
    <label for="consent" style="margin:0; font-weight:normal;">I'm okay with this being displayed at the event and quoted in a post-event recap.</label>
  </div>
  <button class="submit" type="submit">Add it to the Wall</button>
</form>
<div class="note">If this page doesn't work, no problem — use the paper board. A human will photograph everything after the event.</div>`;

async function handleSubmit(request, env) {
  let form;
  try { form = await request.formData(); } catch { return page("Artifact Wall", formBody("Couldn't read the form — please try again.")); }
  const station = String(form.get("station") || "");
  const text = String(form.get("artifact_text") || "").trim();
  const name = String(form.get("display_name") || "").trim().slice(0, 40);
  const consent = form.get("consent") === "1";
  if (!STATIONS.includes(station)) return page("Artifact Wall", formBody("Please pick a station from the list."));
  if (text.length < 2 || text.length > 500) return page("Artifact Wall", formBody("Artifact text needs to be between 2 and 500 characters."));
  if (!consent) return page("Artifact Wall", formBody("The consent checkbox is required — we only keep artifacts you're happy to share."));
  await env.DB.prepare("INSERT INTO artifacts (station, artifact_text, display_name, consent) VALUES (?, ?, ?, 1)")
    .bind(station, text, name || null).run();
  return page("Saved!", `
    <h1>It's on the Wall 🎉</h1>
    <p class="sub">Thank you — your artifact is part of the night now.</p>
    <div class="card"><span class="tag">${esc(station)}</span><div class="text">${esc(text)}</div>${name ? `<div class="meta">— ${esc(name)}</div>` : ""}</div>
    <p><a href="/">Leave another</a> &middot; <a href="/wall">See the Wall</a></p>`);
}

async function handleWall(env) {
  const { results } = await env.DB.prepare(
    "SELECT station, artifact_text, display_name, created_at FROM artifacts WHERE consent = 1 AND hidden = 0 ORDER BY id DESC LIMIT 80"
  ).all();
  const cards = results.length
    ? results.map(r => `<div class="card"><span class="tag">${esc(r.station)}</span><div class="text">${esc(r.artifact_text)}</div><div class="meta">${r.display_name ? "— " + esc(r.display_name) : "— anonymous"}</div></div>`).join("")
    : `<p class="sub">Nothing here yet — the night is young. Artifacts appear as guests add them.</p>`;
  return page("Artifact Wall", `<h1>The Artifact Wall 🏮</h1><p class="sub">What the room made tonight. Updates every 25 seconds.</p>${cards}`, 25);
}

async function handleMod(request, env, url) {
  if (url.searchParams.get("key") !== env.MOD_KEY) return new Response("Not found", { status: 404 });
  if (request.method === "POST") {
    const form = await request.formData();
    const id = parseInt(String(form.get("id")), 10);
    const action = String(form.get("action"));
    if (Number.isInteger(id) && (action === "hide" || action === "unhide")) {
      await env.DB.prepare("UPDATE artifacts SET hidden = ? WHERE id = ?").bind(action === "hide" ? 1 : 0, id).run();
    }
  }
  const { results } = await env.DB.prepare("SELECT id, station, artifact_text, display_name, hidden FROM artifacts ORDER BY id DESC LIMIT 200").all();
  const key = esc(url.searchParams.get("key"));
  const rows = results.map(r => `<div class="card"><div class="modrow"><div><span class="tag">${esc(r.station)}</span> ${r.hidden ? "(hidden)" : ""}<div class="text" style="font-size:1rem;">${esc(r.artifact_text)}</div><div class="meta">${r.display_name ? "— " + esc(r.display_name) : ""} · #${r.id}</div></div>
    <form method="POST" action="/mod?key=${key}"><input type="hidden" name="id" value="${r.id}"><input type="hidden" name="action" value="${r.hidden ? "unhide" : "hide"}"><button class="submit" type="submit">${r.hidden ? "Unhide" : "Hide"}</button></form></div></div>`).join("");
  return page("Moderation", `<h1>Wall moderation</h1><p class="sub">Hide anything that shouldn't be on the public wall. Hidden items stay in the database.</p>${rows || "<p class='sub'>No artifacts yet.</p>"}`);
}

async function handleExport(env) {
  const { results } = await env.DB.prepare("SELECT * FROM artifacts ORDER BY id ASC").all();
  return new Response(JSON.stringify(results, null, 2), { headers: { "content-type": "application/json; charset=utf-8" } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p === "/submit" && request.method === "POST") return handleSubmit(request, env);
    if (p === "/wall") return handleWall(env);
    if (p === "/mod") return handleMod(request, env, url);
    if (p === "/export.json") return handleExport(env);
    if (p === "/health") return new Response("ok");
    return page("Artifact Wall", formBody());
  }
};
