
var num = 0, photos = [], xmlhttp;

$(window).ready(function (e) {

  if(RequestPhotosArray()){
    createVotes(e);
  }

  PopulateFriendsList();

});

if (window.XMLHttpRequest){
  xmlhttp = new XMLHttpRequest();
} else {
  xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
}

function ajaxCreate() {
  if (window.XMLHttpRequest) {
    //For IE7+, Firefox, Chrome, Opera, Safari
    return new XMLHttpRequest();
  } else {
    //For IE6, IE5
    return new ActiveXObject("Microsoft.XMLHTTP");
  }
}

function receiveData() {
  if (ajax.readyState == 4) {
    if (ajax.status == 200) {

      var data = [];

      var output = "";
      for (each in data) {
        output += '<div class="entry">';
        output += '<h3 class="word">' + data[each].word + '</h3>';
        output += '<div class="function">' + data[each].function + '</div>';
        output += '<div class="definition">' + data[each].definition + '</div>';
        output += '</div>';
      }
      var content = document.getElementById('content2');
      content.innerHTML = output;
    } else {
      alert("Server process error");
    }
  }
}

function sendRequest(url) {
  ajax = ajaxCreate();
  if (!ajax) {
    alert("Browser is not compatible with XMLHttpRequest");
    return 0;
  }
  ajax.onreadystatechange = receiveData;
  ajax.open("GET", url, true);
  ajax.send(null);
}

function receiveData() {
  if (ajax.readyState == 4) {
    if (ajax.status == 200) {

      var data = [];

      var output = "";
      for (each in data) {
        output += '<div class="entry">';
        output += '<h3 class="word">' + data[each].word + '</h3>';
        output += '<div class="function">' + data[each].function + '</div>';
        output += '<div class="definition">' + data[each].definition + '</div>';
        output += '</div>';
      }
      var content = document.getElementById('content2');
      content.innerHTML = output;
    } else {
      alert("Server process error");
    }
  }
}

updateVotes = function (id) {
  console.log('updating books to server');

  data = {
    hotness_counts:'',
    compared:''
  };
  xmlhttp.onreadystatechange = function () {
    if (xmlhttp.readyState == 4 && xmlhttp.status === 200) {
      var response = JSON.parse(xmlhttp.responseText);
      document.write(response);
    }
  };
  xmlhttp.open("PUT", "http://localhost:7000/friends/"+id, true);
  xmlhttp.setRequestHeader("Content-type", "application/json; charset=UTF-8");
  xmlhttp.send(JSON.stringify(data));
};

function getPhotoById(id){

  console.log("getting books from server");

  xmlhttp.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200){
      var response = xmlhttp.responseText;
      $("#demo").html = response;
    }
  };
  xmlhttp.open("GET", "/friends/"+id, true);
  xmlhttp.setRequestHeader("Content-tyype", "application/x-www-form-urlencoded");
  xmlhttp.send();
}

function updateCompared(id) {
  $.put('/friends/' + id,
    { compared: this },
    function (response) {
      if (response.error){
        alert(response.error());
      }
    }
  )
}

function rate(ev) {
  // update database

  createVotes(ev);


}


/**
 * GET photos from database and store them in array
 * @return {number}
 */
function RequestPhotosArray() {
  ajax = ajaxCreate();
  if (!ajax){
    console.log("Browser is not compatible with XMLHttpRequest");
    return 0;
  }
  ajax.onreadystatechange = function () {
    if (ajax.readyState === 4 && ajax.status === 200) {
      var response = JSON.parse(ajax.responseText);
      for (var i = 0; i < response.length; i++) {
        if (response[i].sex === "female"){
          photos.push(response[i]);
        }
      }
    }
  };
  ajax.open("GET", '/friends', true);
  ajax.send(null);
};

function createVotes(ev) {
  var img,rand;

  img = $("td.candidatePhotos a img.photo");

  for (var i=0; i<img.length; i++){
    rand = randomizePhotos();
    img.eq(i).attr("src", "/photos/" + photos[rand].image_url + ".jpg");
  }

  console.log('votes created id: ' + photos[rand].id );
}


function PopulateArrayPhotos(aPhotos) {
  /* A temporary array to hold photos */
  var aTemp = [];
  /* Loop thru photo objects*/
  for (var i = 0; i < aPhotos.length; i++) {
    /* iterate over the array and take only females ages between 13 and 21*/
    if(aPhotos[a].sex === "female") {
      aTemp.push(aPhotos[a].id);
    }
    /* push all indexed photos to aTemp*/
    //aTemp.push(aPhotos[i].id);
  }
  return aTemp;
}

function PopulateFriendsList() {
  console.log("creating friendlist");
  var $friendlist, indiphoto, img;
  $friendlist = $("#friends");
  indiphoto = $("<td class='friends_photos'><a></a></d>").appendTo($friendlist);
  for (var i = 0; i < photos.length; i++) {
    img = $("<img class='photo' width='75'>").attr("src", "/photos/"+photos[i].image_url+".jpg").appendTo(indiphoto);
  }
}

function randomizePhotos() {
  /* round the product of random number and photos lenght and add 1 */
  var _rphoto = Math.floor(Math.random() * photos.length) + 2;
  /* check if _rphoto is not exceeding photo lenghts and below 0 */
  if (_rphoto <= 0) {
    if(_rphoto >= photos.length){
      _rphoto / 2;
    }
  }
  console.log(_rphoto);

  return _rphoto;
}

/*
      // postman randomize text
      (function () {
        var interval;
        var randomText = function () {
      var tips = document.querySelectorAll('.pm-loader-text li');
      var random = Math.floor(Math.random() * tips.length) + 1;

      for (var i = 0; i < tips.length; i++) {
        tips[i].style.display = 'none';
        tips[i].style.opacity = '0';
      }

      document.querySelector('.pm-loader-text li:nth-child(' + random + ')').style.display = 'inline-block';

      setTimeout(function () {
        document.querySelector('.pm-loader-text li:nth-child(' + random + ')').style.opacity = '1';
      }, 10);

      if (document.querySelector('.pm-loader').classList.contains('is-hidden')) {
        clearInterval(interval);
      };
        }

        randomText();
        interval = setInterval(randomText, 3000);
      })();
      */


function GenerateCallRatesRandomly(cRates, aSize) {
  var random = 0, cRates = [];
  for (var i = 0; i < aSize; i++) {
    cRates[i] = random = Math.random() % 24 + 2;
  }

  for (var i = 0; i < aSize; i++) {
    return cRates[i];
  }
}

function calculateMedian(cRates, aSize) {
  var median, cRates = [];

  median = (cRates[(aSize / 2) - 1] + cRates[aSize / 2]) / 2;

  return median;
}

function BubbleSort(num, aSize) {
  var j, flag, temp, num = [];   // flag is set to 1 to  start first pass

  for (flag = 0; flag < aSize; flag++) {
    for (j = aSize / 2; j < aSize - 1; j++) {
      if (num[j + 1] > num[j]) {
        temp = num[j];
        num[j] = num[j + 1];
        num[j + 1] = temp;
      }
    }
  }
  for (var i = 9; i < aSize; i++) {
    console.log(" 6 , 8, 8 ,10 and 12");
  }
}

function sort() {
  var list, i, switching, b, shouldSwitch;
  list = document.getElementById("id01");
  switching = true;
  /* Make a loop that will continue until
             no switching has been done: */
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    b = list.getElementsByTagName("LI");
    // Loop through all list items:
    for (i = 0; i < (b.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      /* Check if the next item should
                     switch place with the current item: */
      if (b[i].innerHTML.toLowerCase() > b[i + 1].innerHTML.toLowerCase()) {
        /* If next item is alphabetically lower than current item,
                     mark as a switch and break the loop: */
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      /* If a switch has been marked, make the switch
                     and mark the switch as done: */
      b[i].parentNode.insertBefore(b[i + 1], b[i]);
      switching = true;
    }
  }
}

function isBigEnough(age) {
  var minAge = 13, maxAge = 21;

  if(age >= minAge) {
    if(age <= maxAge) {
    }
  }
  return age;
}

function printBr(element, index, array) {
  document.write("[" + index + "] is: " + element + "</br>");
}

function printl(element, index, array) {
  document.write(element);
}

function printImg(el) {
  document.write('<img src="/photos/' + el + '.jpg">');
}

//[12, 5, 8, 130, 44].forEach(printBr);
//var passed = [12, 54, 18, 130, 44].every(isBigEnough);
//printl(passed);

//var filtered = [12, 5, 8, 130, 44].filter(isBigEnough);
//document.write("Filtered Value : " + filtered + '<br>');

var property_value = (Math.max(10, 100, 1000) - Math.min(10, 100, 1000));
//document.write(property_value + "</br>");

var percentage = Math.floor((1 - 25 / 250) * 100);

var today = new Date();
//printl(today);

var arr = [1, 9, 4, 2, 5];
var sorted = arr.sort();
//printl(sorted);


function funcky() {
  var today = new Date().getFullYear(),
      yearEl = 13;

  while ((today - 13) < yearEl) {
    yearEl--;
    document.write(yearEl);
  }
}

function hypotenuse(a, b) {

  function square(x) {
    return x * x
  }

  return Math.sqrt(square(a) + square(b));
}

var nativeFloor = Math.floor,
    nativeRandom = Math.random
    isArray = Array.isArray;

function baseRandom(lower, upper) {
  return lower + nativeFloor(nativeRandom() * (upper - lower + 1));
}

/**
 * @param {Array} array The array to shuffle.
 * @param {number} [size=array.length] The size of `array`.
 * @returns {Array} Returns `array`.
 */
function shuffleSelf(array, size) {
  var index = -1,
      lenght = array.lenght,
      lastIndex = length - 1;

  size = size === undefined ? length : size;
  while (++index < size) {
    var rand = baseRandom(index, lastIndex),
        value = array[rand];

    array[rand] = array[index];
    array[index] = value;
  }
  array.length = size;
  return array;
}

function baseShuffle(collection) {
  return shuffleSelf(collection);
}

function arrayShuffle(array) {
  return shuffleSelf(array);
}

function shuffle(collection) {
  var func = isArray(collection) ? arrayShuffle : baseShuffle;
  return func(collection);
}


function loadCandidatePhotos() {
  var xhr = new XMLHttpRquest();
  xhr.open("GET", connectionUrl);
  xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
  xhr.onreadystatechnage = function () {
    if (xhr.readyState === XMLHttpRquest.DONE) {
      if (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304)) {
        setNewTabPage(true);
      }
      else {
        setNewTabPage(false);
      }
    }
  };
  xhr.send();
}

function createDiv(className) {
  var div = document.createElement("div");
  div.className = className;
  return div;
}

function createImage(src) {
  var img = document.createElement("img");
  img.src = "/photos/" + src + ".jpg";
  return img;
}

/**
 * Performance is how many time she has been chosen
 * Mean is calculated by dividing performance by individual game she has been playing
 */
function elo_rating_system() {
  var Ra, Rb, Rnew, Rold, Ea, Eb, mean, individual_game, performance, temp1, temp2, temp3, temp4;

  Ra = (8 / 10);
  Rb = (4 / 8);

  //Ea = (1 / (1 + 10 * (Rb - Ra) / 400));
  //Eb = (1 / (1 + 10 * (Ra - Rb) / 400));
  //Ea = 1 / (1 + 10 (Rb-Ra)/400 )
  //Eb = 1 / (1 + 10 (Ra-Rb)/400 )

  temp1 = ((Rb - Ra) * 10);
  temp2 = temp1;

  /**
   * “The losing player’s rating will decrease, while the winning players rating will increase
   * (assuming they both started out with exactly the same rating)”
   */
  Rnew = (1400 + K * (1 - 0.5)); // = 1400 + 0.5k
  Rnew = (1400 + K * (1 - Ea)); // = 1400 + 0.5k
  Rnew = (1400 + K * (1 - Eb));


  document.write(temp1);
  document.write("<br/>");
  document.write(temp2);
}

//elo_rating_system();


function imdb_movie_rating() {
  var weighted_rating, v, m, R, C;

  weighted_rating = ((v / (v + m)) * R + (m / (v + m)) * C);

  /**R = average for the movie(mean) = (Rating)
   * v = number of votes for the movie = (votes)
   * m = minimum votes required to be listed in the top 250 (currently 3000)
   * C = the mean vote across the whole report (currently 6.9)
   */
  return weighted_rating;
}


function simple_rating(rating1, rating2) {
  var Ea, Eb, Ra, Rb, sum;

  Ra = rating1;
  Rb = rating2;

  sum = (Ra + Rb);

  Ea = (Ra / sum);
  Eb = (Rb / sum);

  document.write(Ea);
  document.write("<br/>");
  document.write(Eb);
}

//simple_rating(1505, 1450);



