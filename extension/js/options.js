(function(){

var ids = ['apiKey'];

// Save to localStorage
function saveOptions() {
    for (var i = 0, len = ids.length; i < len; i++) {
        localStorage[ids[i]] = document.getElementById(ids[i]).value;
    }
    var status = document.getElementById("status");
    status.innerHTML = "Saved";
    setTimeout(function() {
        status.innerHTML = "";
    }, 1000);
}

// Restore from localStorage
function restoreOptions() {
    for (var i = 0, len = ids.length; i < len; i++) {
        document.getElementById(ids[i]).value = localStorage[ids[i]] || '';
    };
}

window.onload = function () {
    restoreOptions();
    document.getElementById('save').onclick = function () {
        saveOptions();
    };
    document.getElementById('close').onclick = function () {
        window.close();
    };
}

})();