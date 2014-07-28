var App = (function (my) {

  my.init = function() {

  }

  chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.type == '') {

        }
    });


  return my;

})(App || {});

App.init();