var Popup = (function(my){

  var bg = chrome.extension.getBackgroundPage();
  var linkedinData = {};
  var settings = {};

  my.init = function() {
    window.addEventListener('load', showPopup, false);
  };

  function showPopup() {
    updateSettings();
    updateLinkedinData();
    renderContent();
  }

  function updateLinkedinData() {
    linkedinData = bg.App.linkedinData;
  }

  function updateSettings() {
    settings.apiUrl = localStorage['apiUrl'] || '';
    settings.apiKey = localStorage['apiKey'] || '';
  }

  function renderContent() {
    var result = my.template( $.extend({}, linkedinData, settings) );
    document.body.innerHTML = result.content;
    // attach event listeners
    for (var i = result.eventHandlers.length - 1; i >= 0; i--) {
      var f = result.eventHandlers[i];
      if (typeof f === 'function') f();
    };
  }

  // ========================================= Template
  my.template = function(data) {
    var content = '<hr/>',
        inputs = ['firstname', 'lastname', 'domain'];
    console.log(data);
    for (var i = 0, len = inputs.length; i < len; i++) {
      var id = inputs[i];
      content += '<input id="' + id + '" value="' + (data[id] ? data[id] : '') + '" placeholder="' + id + '"/>';
    }
    content += '<div class="text-center"><button id="submitMake">Submit</button></div>';

    content += '<hr/>';

    content += '<input id="email" placeholder="email"/>';
    content += '<div class="text-center"><button id="submitEmail">Submit</button></div>';
    content += '<hr/>';
    content += '<div id="result"></div>';

    var eventHandlers = [];
    eventHandlers.push(

      function() {
        var showResult = function(msg, delay) {
          var $result = $('#result');
          $result.html(msg).show();
          if (delay) {
            setTimeout(function(){
              $result.hide();
            }, delay);
          }
        }

        var showLoader = function() {
          showResult('<img src="/img/loader.gif"/>');
        }

        var checkAPI = function() {
          if (!data.apiKey) {
            showResult('Provide API key', 2000);
            return false;
          }
          if (!data.apiUrl) {
            showResult('Provide API url', 2000);
            return false;
          }
          return true;
        }

        var sendRequest = function(url) {
          $.ajax({
            url: url,
            beforeSend: showLoader,
            dataType: 'json'
          }).done( function(response){
            showResult( '<pre>' + JSON.stringify(response, '', 2) + '</pre>' );
          }).fail( function(){
            showResult('failed');
          });
        }

        $('#submitMake').click( function(){
          if (!checkAPI()) return;
          var url = data.apiUrl +
              '?key=' + data.apiKey + 
              '&domain=' + $('#domain').val() + 
              '&first=' + $('#firstname').val() + 
              '&last=' + $('#lastname').val();
          sendRequest(url);
        });

        $('#submitEmail').click( function(){
          if (!checkAPI) return;
          var url = 'http://toofr.com/api/email_tester' + 
              '?key=' + data.apiKey + 
              '&email=' + $('#email').val();
          sendRequest(url);
        });

      });

    return {content: content, eventHandlers: eventHandlers};
  }

  return my;

})(Popup || {});


Popup.init();