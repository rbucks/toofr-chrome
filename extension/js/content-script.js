var Linkedin = (function(my){

  my.result = {
    firstname: '',
    lastname: ''
  }

  my.init = function() {
    window.addEventListener('load', my.getName, false);
  }

  my.getName = function() {
    var fullname = document.querySelector(".full-name");

    if (!fullname) {
      console.log('Name not found');
      return;
    }

    fullname = fullname.textContent || '';
    var matches = fullname.match(/(\w+)\s+(.*)/);

    if (!matches) {
      console.log('Bad name: ' + fullname);
    }
    my.result.firstname = matches[1];
    my.result.lastname = matches[2];
    my.sendResult();
  }

  my.sendResult = function() {
    console.log('Sending results...');
    console.log(my.result);
    chrome.runtime.sendMessage({type: "name", data: my.result}, function(response) {
      console.log(response);
    });
  }

  return my;

})(Linkedin || {});


Linkedin.init();