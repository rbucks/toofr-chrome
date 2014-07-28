var App = (function (my) {

  my.linkedinData = {
  };

  my.init = function() {
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.type === 'name') {
          my.linkedinData = request.data;
        }
        sendResponse('ok');
      });
  };


  return my;

})(App || {});


App.init();