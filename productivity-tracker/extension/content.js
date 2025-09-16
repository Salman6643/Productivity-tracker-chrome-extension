// content.js
// Could capture extra events on page if needed


// report visibility or active interactions (optional)
(function(){
document.addEventListener('visibilitychange', () => {
// we can notify background if needed
chrome.runtime.sendMessage({type: 'VISIBILITY', hidden: document.hidden});
});
})();