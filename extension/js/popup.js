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
    var content = '<div class="navbar navbar-light bg-light mb-3"><div class="navbar-brand"><a href="https://www.findemails.com" target="_blank"><img src="/img/find_emails_logo.png" class="d-inline-block align-top" /></a> <span class="small text-muted">' + activeTabDomain + '</span></div><a href="https://www.findemails.com/guess" target="_blank" class="btn btn-outline-dark btn-sm ml-auto">Dashboard <i class="fa fa-external-link-alt"></i></a></div></div>';
    content += '<div class="container"><ul class="nav nav-tabs"><li class="nav-item"><a href="#tab-prospects" data-toggle="tab" class="nav-link active">Get Prospects</a></li><li class="nav-item"><a href="#tab-query" data-toggle="tab" class="nav-link">Find Emails</a></li><li class="nav-item"><a href="#tab-verify" data-toggle="tab" class="nav-link">Verify Email</a></li></ul>';

    content += '<div class="tab-content">';

    content += '<section id="tab-prospects" class="tab-pane active"><div id="prospects-result"></div></section>';

    content += '<section id="tab-query" class="tab-pane fade">';
    content += '<form id="submitName" class="mt-3">';
    content += '<div class="form-row mb-2">';
    content += '<div class="col"><input class="form-control" id="firstname" value="" placeholder="First Name"></div>';
    content += '<div class="col"><input class="form-control" id="lastname" value="" placeholder="Last Name"></div>';
    content += '</div>'
    content += '<div class="form-row">';
    content += '<div class="col-md-12"><div class="input-group"><input id="domain" value=' + activeTabDomain + ' placeholder="Company or Domain" class="form-control"><div class="input-group-append"><input type="submit" class="btn btn-success" id="submitGuess" value="Find Emails"></div></div></div>'
    content += '</div>'
    content += '</form>';
    content += '<div id="guess-result"></div>'
    content += '</section>';

    content += '<section id="tab-verify" class="tab-pane fade">';
    content += '<form id="submitEmail" class="mt-3">';
    content += '<div class="form-row">';
    content += '<div class="col-md-12"><div class="input-group"><input id="email" placeholder="Email Address" class="form-control"><div class="input-group-append"><input type="submit" class="btn btn-success" id="bnt-submitEmail" value="Verify Email"></div></div></div>'
    content += '</div>'
    content += '</form>';
    content += '<div id="email-result"></div>'
    content += '</section>';

    content += '<section><div id="result"></div></section>';
    content += '</div></div>';


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
          }).fail( function(jqxhr){
            var message = 'Network error';
            if (jqxhr.responseJSON && jqxhr.responseJSON.message) {
              message = jqxhr.responseJSON.message;
            }
            showResult(message, 'alert alert-info', 2000);
          });
        }


        var processGuessResponse = function(json) {
          var maxConfidence = -1;
          var item;
          for (var key in json) {
            if (key === 'employee') continue;
            if (json[key].confidence > maxConfidence) {
              item = json[key];
              maxConfidence = json[key].confidence;
            }
          }
          var res = {};
          res.email = item;
          res.confidence_detail = item.detail;
          if (json.employee) {
            res.first_name = json.employee.first_name;
            res.last_name = json.employee.last_name;
            res.profile = json.employee.profile;
            if (!res.profile) res.profile = {};
          }
          try {
            var data = getProspectTemplateData(res);
            var content = renderProspect(data);
          } catch (e) {
            console.log(e);
          }
          $('#guess-result').html(content);
          $('#result').html('');
        }


        var processEmailResponse = function(json) {
          var res = {};
          res.email = {
            email: json.email,
            confidence: json.confidence,
            state: json.state
          };
          res.confidence_detail = json.detail;
          if (json.employee) {
            res.first_name = json.employee.first_name;
            res.last_name = json.employee.last_name;
            res.profile = json.employee.profile;
            if (!res.profile) res.profile = {};
          }
          try {
            var data = getProspectTemplateData(res);
            var content = renderProspect(data);
          } catch (e) {
            console.log(e);
          }
          $('#email-result').html(content);
          $('#result').html('');
        }


        var processProspectsResponse = function(json) {
          var content = '';
          if (!json.prospects || !json.prospects.length) {
            content = '<div class="text-center no-results"><img src="/img/empty.png"><p class="lead text-mute">Sorry, we came up empty</p></div>';
          }
          else {
            var prospects = json.prospects;
            for (var i = 0, len = prospects.length; i < len; i++) {
              var item = prospects[i];
              try {
                var data = getProspectTemplateData(item);
                content += renderProspect(data);
              } catch (e) {
                console.log(e);
              }
            }
          }
          $('#prospects-result').html(content);
          $('#result').html('');
        };


        var getProspectTemplateData = function(item){
          var data = $.extend({}, item);
          var profile = item.profile;
          if (!profile) profile = {};
          data.profile = profile;
          data.profileImg = profile.photo;
          if (!data.profileImg) data.profileImg = '/img/blank-photo.png';
          if (!data.title) data.title = profile.title;
          data.fullname = profile.fn;
          if (!data.fullname) data.fullname = data.first_name + ' ' + data.last_name;
          if (!data.first_name && !data.last_name) data.fullname = '';
          if (item.confidence_detail) {
            data.confidenceDetails = {};
            if (!item.confidence_detail.length) {
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
              for (var key in names) {
                data.confidenceDetails[ names[key] ] = item.confidence_detail[key];
              }
            }
            else {
              for (var i = 0, len = item.confidence_detail.length; i < len; i++) {
                var detail = item.confidence_detail[i];
                data.confidenceDetails[detail.description] = detail.response.replace('+', '');
              }
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

        $('#submitGuess').click( function(e){
          e.preventDefault();
          if (!checkAPI()) return;
          var url = 'https://www.findemails.com/api/v1/guess_email.json' +
              '?key=' + data.apiKey +
              '&company_name=' + $('#domain').val() +
              '&first_name=' + $('#firstname').val() +
              '&last_name=' + $('#lastname').val();
          sendRequest('POST', url, processGuessResponse, {
            customRender: true
          });
        });

        $('#submitEmail').submit( function(e){
          e.preventDefault();
          if (!checkAPI()) return;
          var url = 'https://www.findemails.com/api/v1/test_email.json' +
              '?key=' + data.apiKey +
              '&email=' + $('#email').val();
          sendRequest('POST', url, processEmailResponse, {
            customRender: true
          });
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
