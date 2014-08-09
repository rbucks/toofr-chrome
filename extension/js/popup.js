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
    var content = '<div class="navbar"><div class="navbar-inner"><img src="/img/toofr_small_white.png" style="padding:6px;"/></div></div>',
        inputs = ['firstname', 'lastname', 'domain'];

    content += '<section><table><tbody>';
    content += '<tr><td><form id="submitMake">';
    for (var i = 0, len = inputs.length; i < len; i++) {
      var id = inputs[i];
      content += '<div class="form-group"><input id="' + id + '" value="' + (data[id] ? data[id] : '') + '" placeholder="' + id + '"/></div>';
    }
    content += '<button type="submit" class="btn btn-success">Submit</button>';
    content += '</form></td>';
    content += '<td style="padding-left:30px;"><form id="submitEmail">';
    content += '<div class="form-group"><input id="email" placeholder="email"/></div>';
    content += '<button class="btn btn-success">Submit</button>';
    content += '</form></td>';
    content += '</tr></tbody></table></section>';

    content += '<section><div id="result"></div></section>';


    var eventHandlers = [];
    eventHandlers.push(

      function() {
        var showResult = function(msg, className, delay) {
          var $result = $('#result');
          $result.removeClass();
          if (className) $result.addClass(className);
          $result.html(msg).show();
          if (delay) {
            setTimeout(function(){
              $result.hide();
            }, delay);
          }
        }

        var showLoader = function() {
          showResult('<div class="text-center"><img src="/img/loader.gif"/></div>');
        }

        var checkAPI = function() {
          if (!data.apiKey) {
            showResult('<p><strong>Please add your Toofr API key.</strong></p><p>Find it by logging into Toofr and going to http://toofr.com/api, and then save it in the Chrome extension options.</p>', 'alert alert-info', false);
            return false;
          }
          return true;
        }

        var sendRequest = function(url, processResponse) {
          $.ajax({
            url: url,
            beforeSend: showLoader,
            dataType: 'json'
          }).done( function(response){
            var result = processResponse(response); 
            showResult( result.content, result.type );
          }).fail( function(){
            showResult('Network error', 'alert alert-info', 2000);
          });
        }

        var processMakeResponse = function(json) {
          var type = '',
              content = '';
          if ((content = checkResponseErrors(json)) !== false) {
            type = 'alert alert-danger';
          }
          else if (!json.response.email) {
            content = "Sorry, no email address was found.";
            type = 'alert alert-danger';
          }
          else {
            type = 'alert alert-success';
            content = '';
            $.each(['first', 'last', 'domain', 'email'], function(i, id){
              content += '<div><span>' + id + ':</span>' + json.response[id] + '</div>';
            })
          }
          return {type: type, content: content};
        }

        var processEmailResponse = function(json) {
          var type = '',
              content = '';
          if ((content = checkResponseErrors(json)) !== false) {
            type = 'alert alert-danger';
          }
          else {
            var mx = json.response.email_tester.mx.result,
                social = json.response.email_tester.social.result;
            content = '<div><span>MX:</span>' + mx;
            content += '<div><span>Social:</span>' + social;
            type = 'alert alert-success';
            if (!mx && !social) type = 'alert alert-danger';
          }
          return {type: type, content: content};
        }

        var checkResponseErrors = function(json) {
          if (!json.response) return "Bad response";
          else if (json.response.error) return json.response.error;
          else return false;
        }

        $('#submitMake').submit( function(e){
          e.preventDefault();
          if (!checkAPI()) return;
          var url = 'http://toofr.com/api/guess' +
              '?key=' + data.apiKey + 
              '&domain=' + $('#domain').val() + 
              '&first=' + $('#firstname').val() + 
              '&last=' + $('#lastname').val();
          sendRequest(url, processMakeResponse);
        });

        $('#submitEmail').submit( function(e){
          e.preventDefault();
          if (!checkAPI) return;
          var url = 'http://toofr.com/api/email_tester' + 
              '?key=' + data.apiKey + 
              '&email=' + $('#email').val();
          sendRequest(url, processEmailResponse);
        });

      });

    return {content: content, eventHandlers: eventHandlers};
  }

  return my;

})(Popup || {});


Popup.init();