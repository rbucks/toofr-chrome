var Popup = (function(my){

  var bg = chrome.extension.getBackgroundPage();
  var settings = {};
  var linkedinData = {};
  var activeTabDomain = '';


  my.init = function() {
    window.addEventListener('load', showPopup, false);
  };


  function showPopup() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
      var tab = tabs[0];
      if (tab.url) {
        activeTabDomain = (new URL(tab.url)).hostname;
      }
      updateSettings();
      updateLinkedinData();
      renderContent();
    });
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
    var content = '<div class="navbar navbar-light bg-light"><div class="navbar-brand"><img src="/img/find_emails_logo.png" /></div></div>';
    content += '<ul class="nav nav-tabs"><li class="nav-item"><a href="#tab-prospects" data-toggle="tab" class="nav-link active">Prospects</a></li><li class="nav-item"><a href="#tab-query" data-toggle="tab" class="nav-link">Query</a></li></ul>';
    var inputs = ['firstname', 'lastname', 'domain'];

    content += '<div class="tab-content">';
    content += '<section id="tab-prospects" class="tab-pane active"><div id="prospects-result"></div></section>';
    content += '<section id="tab-query" class="tab-pane fade"><table><tbody>';
    content += '<tr><td><form id="submitName">';
    for (var i = 0, len = inputs.length; i < len; i++) {
      var id = inputs[i];
      content += '<div class="form-group"><input id="' + id + '" value="' + (data[id] ? data[id] : '') + '" placeholder="' + id + '"/></div>';
    }
    content += '<input type="button" class="btn btn-success" id="submitMake" value="Submit">';
    content += '</form></td>';
    content += '<td style="padding-left:30px;"><form id="submitEmail">';
    content += '<div class="form-group"><input id="email" placeholder="email"/></div>';
    content += '<button class="btn btn-success">Submit</button>';
    content += '</form></td>';
    content += '</tr></tbody></table></section>';

    content += '<section><div id="result"></div></section>';
    content += '</div>';


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
          showResult('<div class="text-center"><img src="/img/bouncing.gif" style="width:75px"/></div>');
        }

        var checkAPI = function() {
          if (!data.apiKey) {
            showResult('<p><strong>Please add your Toofr API key.</strong></p><p>Find it by logging into Toofr. You will see your API key in the footer of every page. Right click on the Chrome extention to get to your Options page where you add your API key.</p>', 'alert alert-info', false);
            return false;
          }
          return true;
        }

        var sendRequest = function(method, url, processResponse, params) {
          $.ajax({
            url: url,
            method: method,
            beforeSend: showLoader,
            dataType: 'json'
          }).done( function(response){
            if (params && params.customRender) {
              processResponse(response);
              return;
            }
            var result = processResponse(response);
            showResult( result.content, result.type );
          }).fail( function(){
            showResult('Network error', 'alert alert-info', 2000);
          });
        }

        var processMakeResponse = function(json) {
            first = Object.keys(json)[0];
            confidence = json[first].confidence;
            email = json[first].email;
            type = 'alert alert-success';
            content = '';
            content += '<div><span>email: </span><a href="mailto:' + email +'">' + email + '</a></div>';
            content += '<div><span>confidence: </span>' + confidence + '</div>';
            content += '<div class="progress">';
            content += '<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + confidence + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + confidence + '%" "></div></div>';
          return {type: type, content: content};
        }

        var processEmailResponse = function(json) {
          var type = '',
              content = '';
          if ((content = checkResponseErrors(json)) !== false) {
            type = 'alert alert-danger';
          }
          else {
            var confidence = json.confidence, email = json.email;
            content = '<div><span>Confidence:</span>' + confidence + '</div>';
            content += '<div class="progress">';
            content += '<div class="progress-bar progress-bar-success" role="progressbar" aria-valuenow="' + confidence + '" aria-valuemin="0" aria-valuemax="100" style="width: ' + confidence + '%" "></div></div>';
            type = 'alert alert-success';
            if (!confidence) type = 'alert alert-danger';
          }
          return {type: type, content: content};
        }


        var processProspectsResponse = function(json) {
          var type = '',
              content = '';
          if (!json.prospects) {
            type = 'alert alert-danger';
            content = 'Bad response';
          }
          else {
            content += '<div class="prospect-domain">Domain: ' + activeTabDomain + '</div>';
            type = 'alert alert-success';
            var prospects = json.prospects;
            for (var i = 0, len = prospects.length; i < len; i++) {
              var item = prospects[i];
              try {
                var data = getProspectTemplateData(item);
                content += renderProspect(data);
              } catch (e) {}
            }
          }
          $('#prospects-result').html(content);
          $('#result').html('');
          // return {type: type, content: content};
        };


        var getProspectTemplateData = function(item){
          var data = $.extend({}, item);
          data.profileImg = item.profile.photo;
          if (!data.profileImg) data.profileImg = '/img/blank-photo.png';
          if (!data.title) data.title = item.profile.title;
          data.fullname = item.profile.fn;
          if (!data.fullname) data.fullname = data.first_name + ' ' + data.last_name;
          if (item.confidence_detail) {
            var names = {
              check_catchall: "Catchall",
              check_disposable: "Disposable",
              check_for_gibberish: "Gibberish",
              check_for_list: "List",
              check_for_name: "Name",
              check_generic: "Uniqueness",
              check_mailserver: "Mailserver",
              check_mx_records: "MX records",
              check_pattern: "Pattern",
            }
            data.confidenceDetails = {};
            for (var key in names) {
              data.confidenceDetails[ names[key] ] = item.confidence_detail[key];
            }
          }
          return data;
        };


        var renderProspect = function(data){
          var scoreLine = '';
          for (var key in data.confidenceDetails) {
            scoreLine += '<span class="prospect-score">' + key + ' score +' + data.confidenceDetails[key] + '</span>';
          }
          var html = [
            '<div class="prospect-item">',
              '<span class="prospect-email">' + data.email.email + '</span>',
              '<div class="prospect-score-container">',
                '<span class="prospect-state">' + data.email.state + '</span>',
                '<span class="prospect-confidence">' + data.email.confidence + '%</span>',
                '<span class="prospect-score-line">' + scoreLine + '</span>',
              '</div>',
              '<div class="prospect-left-col">',
                '<img src="' + data.profileImg + '">',
              '</div>',
              '<div class="prospect-right-col">',
                '<div class="prospect-name">' + data.fullname + '</div>',
                data.title? '<span class="prospect-title">' + data.title + '</span>' : '',
                data.profile.linkedin_profile ? '<div><a href="' + data.profile.linkedin_profile + '" class="prospect-li-link" target="_blank"></a></div>' : '',
              '</div>',
            '</div>'
          ].join('\n');
          return html;
        }


        var checkResponseErrors = function(json) {
          if (!json.confidence) return "Bad response";
          else if (json.error) return json.error;
          else return false;
        }

        $('#submitMake').click( function(e){
          e.preventDefault();
          if (!checkAPI()) return;
          var url = 'https://www.findemails.com:443/api/v1/guess_email.json' +
              '?key=' + data.apiKey +
              '&company_name=' + $('#domain').val() +
              '&first_name=' + $('#firstname').val() +
              '&last_name=' + $('#lastname').val();
          sendRequest('POST', url, processMakeResponse);
        });

        $('#submitEmail').submit( function(e){
          e.preventDefault();
          if (!checkAPI()) return;
          var url = 'https://www.findemails.com:443/api/v1/test_email.json' +
              '?key=' + data.apiKey +
              '&email=' + $('#email').val();
          sendRequest('POST', url, processEmailResponse);
        });

        var getProspectsByDomain = function() {
          if (!checkAPI()) return;
          var url = 'https://www.findemails.com/api/v1/get_prospects.json' +
            '?key=' + data.apiKey +
            '&company_name=' + activeTabDomain;
          sendRequest('GET', url, processProspectsResponse, {
            customRender: true
          });
        };

        getProspectsByDomain();

      });

    return {content: content, eventHandlers: eventHandlers};
  }

  return my;

})(Popup || {});


Popup.init();
