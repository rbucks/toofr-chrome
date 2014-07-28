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
    var content = renderContent();
    $('body').html(content);
  }

  function updateLinkedinData() {
    linkedinData = bg.App.linkedinData;
  }

  function updateSettings() {
    settings.apiUrl = localStorage['apiUrl'] || '';
    settings.apiKey = localStorage['apiKey'] || '';
  }

  function renderContent() {
    var res = linkedinData.firstname + ' ' + linkedinData.lastname;
    console.log(linkedinData);
    console.log(settings);
    return res;
  }

  return my;

})(Popup || {});


Popup.init();