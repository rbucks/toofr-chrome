var App = (function (my) {

  my.linkedinData = {
  };

  my.init = function() {
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
        if (request.type === 'name') {
          my.linkedinData = request.data;
          my.getCompanyDomain( my.linkedinData, function( domain ){
            my.linkedinData.domain = domain;
          });
        }
        sendResponse('ok');
      });
  };


  my.getCompanyDomain = function( data, cbProcessDomain ){
    if (!data.company) return;
    if (!localStorage.apiKey) return;
    var url = 'http://toofr.com/api/plugin' +
        '?key=' + localStorage.apiKey +
        '&domain=' + data.company;
    $.getJSON(url, function( json ){
      if (json && typeof json.response === 'string') {
        cbProcessDomain( json.response );
      }
    });
  };


  return my;

})(App || {});


App.init();
