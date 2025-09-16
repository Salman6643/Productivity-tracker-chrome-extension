// popup.js
const statsEl = document.getElementById('stats');
const blockedEl = document.getElementById('blocked');
const saveBtn = document.getElementById('save');
const syncBtn = document.getElementById('sync');


async function load() {
chrome.storage.sync.get({blockedSites: []}, (items) => {
blockedEl.value = (items.blockedSites || []).join(', ');
});


chrome.runtime.sendMessage({type: 'GET_STATS'}, (res) => {
const history = res.history || [];
if (!history.length) {
statsEl.innerText = 'No data yet';
return;
}
// aggregate by domain
const map = {};
history.forEach(h => {
try {
const u = new URL(h.url);
const d = u.hostname.replace('www.', '');
map[d] = (map[d] || 0) + (h.duration || 0);
} catch(e){}
});
const rows = Object.entries(map)
.sort((a,b)=>b[1]-a[1])
.slice(0,10)
.map(([d,ms]) => `${d}: ${(ms/1000/60).toFixed(1)} min`);
statsEl.innerHTML = '<pre>' + rows.join('\n') + '</pre>';
});
}


saveBtn.addEventListener('click', () => {
const list = blockedEl.value.split(',').map(s=>s.trim()).filter(Boolean);
chrome.storage.sync.set({blockedSites: list}, () => {
alert('Saved');
});
});


syncBtn.addEventListener('click', () => {
// trigger the alarm by messaging background to run an immediate sync
chrome.runtime.sendMessage({type: 'FORCE_SYNC'});
alert('Sync requested');
});


load();