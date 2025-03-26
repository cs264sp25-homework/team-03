document.addEventListener('DOMContentLoaded', function() {
    const getTabsButton = document.getElementById('getTabs');
    const tabList = document.getElementById('tabList');

    getTabsButton.addEventListener('click', function() {
        // Send message to background script
        chrome.runtime.sendMessage({type: "getTabs"}, function(response) {
            // Clear previous list
            tabList.innerHTML = '';
            
            // Display tabs
            response.tabs.forEach(function(tab) {
                const tabElement = document.createElement('p');
                tabElement.textContent = tab.title;
                tabList.appendChild(tabElement);
            });
        });
    });
}); 