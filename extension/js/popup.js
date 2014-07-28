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
    var content = '',
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
        $(document).ready(function(){
          console.log('template loaded');
        });
      });

    console.log(content);
    return {content: content, eventHandlers: eventHandlers};
  }

  return my;

})(Popup || {});


Popup.init();