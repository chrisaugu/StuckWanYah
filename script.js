
var num = 0, xmlhttp;
var photos = [];

$(window).ready(function() {
    switch (document.location.pathname) {
        case "/":
            getTwoRandomPhotos();
            break;
        case "/index.html":
            getTwoRandomPhotos();
            break;
        case "/friends.html":
            populateFriendsList();
            break;
        case "/rankings.html":
            populateRankingsList();
            break;
    }
});

var getTwoRandomPhotos = function(){
    var options = {
        "async": true,
        "crossDomain": true,
        "method": "GET",
        "url": "/api/photos",
        "headers": {
            "content-type":"application/json"
        }
    };
    $.getJSON("/api/photos", function(photos){
        $.each(photos, function(i, photo){
            $("#photos [name=contenderId]").eq(i).attr("value", photo.user_id);
            $("#photos input:image").eq(i).attr("src", photo.image_url);
            // showing contender records
            $("#ratings .ratings").eq(i).html(photo.ratings);
            $("#wins .winings").eq(i).html(photo.wins);
            $("#wins .losings").eq(i).html(photo.losses);
            $("#scores .scorings").eq(i).html(photo.scores);
            $("#expectations .expectations").eq(i).html(photo.expectations);
        });
    });
}
var updateTwoRandomPhotos = function() {
    var options = {
        "async": true,
        "crossDomain": true,
        "method": "PUT",
        "url": "/api/photos",
        "data": {user_id: id, wins: 0, losses: 0}
    };
    $.ajax(options).done(function (data) {
        this.setState({helpBlock: data.message});
    });
}

function rate(ev) {
    //ev.preventDefualt()
    console.log(ev.target.previousElementSibling.getAttribute("value"));
    //updateTwoRandomPhotos();
    //getTwoRandomPhotos();
};

// Only populate the friends page with all photos
/**
 * @return {number}
 */
var populateFriendsList = function(){
    $.getJSON("/api/photos/list", 
        function(data) {

            var output = "";
            output += '<tr>';
            output += '<td class="photos" style="width: 902px;">';
            $.each(data, function(i, item) {
                output += '<a href=\"' + item.uri + '\">';
                output += '<img class="photo" src="/photos/' + item.image_url + '" style="width:70px!important">';
                output += '</a>';
            })
            output += '</td>';
            output += '</tr>';
            $("#photos").html(output);
        }
    )
}

// Only populate the ranking page with top 10 hottest friends
/**
 * @return {number}
 */
var populateRankingsList = function(){
    $.getJSON("/api/photos/top",
        function(data) {
            var output = "";
            $.each(data, function(i, item) {
                output += "<tr>";
                output += "<td>";
                output += "<img class='photo' src='/photos/" + item.image_url + "' width='180'>";
                output += "</td>";
                output += "</tr>";
            })
            $("#rankings").html(output);
        }
    )
}

var randomizePhotos = function(array) {
    /* round the product of random number and photos length and add 1 */
    var rand = Math.floor(Math.random() * array.length) + 1;
    /* check if rand is not exceeding photo lengths and below 0 */
    if (rand < 0) {
        if(rand >= array.length){
            return (rand / 2);
        }
        random_item()
    }
    console.log(rand);
    return rand;
}

function sh(pageName) {
    console.log(pageName);
    $.ajax({
        "async":true,
        "crossDomain": true,
        "method":"PUT",
        "url":"/api/hits",
        "data":{page_name:pageName}
    }).done(function(err, response){
        if (err) throw err;

        console.log(pageName+" receives "+response+" page hits.");
    });
}

function RequestGraphApi() {
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN",
        "method": "POST",
        "headers": {
            "content-type": "application/json"
        },
        "processData": false,
        "data": "{\n\t\"setting_type\": \"call_to_actions\",\n\t\"thread_state\": \"new_thread\",\n\t\"call_to_actions\": [\n\t\t{\n\t\t\t\"payload\": \"GET_STARTED\"\n\t\t}\n\t]\n}"
    };

    $.ajax(settings).done(function (response) {
        console.log(response);
    });
}

function RequestGraphApi2() {
    var data = JSON.stringify({
        "setting_type": "call_to_actions",
        "thread_state": "new_thread",
        "call_to_actions": [
            {
                "payload": "GET_STARTED"
            }
        ]
    });

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    xhr.addEventListener("readystatechange", function () {
        if (this.readyState === 4) {
            console.log(this.responseText);
        }
    });

    xhr.open("POST", "https://graph.facebook.com/v2.6/me/thread_settings?access_token=PAGE_ACCESS_TOKEN");
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(data);
}

var isBigEnough = function(age) {
  var min = 13, max = 21;
  if (age >= min && age <= max) {
    return true;
  }
  return false;
}
var printBr = function(element, index, array) {
    document.write("[" + index + "] is: " + element + "</br>");
}
var printl = function(element, index, array) {
    document.write(element);
}
var printImg = function(el) {
    document.write('<img src="/photos/' + el + '.jpg">');
}
var createDiv = function(id, className, child) {
    var div = document.createElement("div");
    div.id = id;
    div.className = className;
    div.append(child);
    return div;
}
var createImage = function(id, className, src, width, height) {
    var img=document.createElement("img");
    img.id=id;
    img.className=className;
    img.src="/photos/"+src.slice(1,-4)+".jpg";
    if(width!==null) img.width=width;
    if(height!==null) img.height=height;
    return img;
}

//[12, 5, 8, 130, 44].forEach(printBr);
//var passed = [12, 54, 18, 130, 44].every(isBigEnough);
//printl(passed);

//var filtered = [12, 5, 8, 130, 44].filter(isBigEnough);
//document.write("Filtered Value : " + filtered + '<br>');

var percentage = Math.floor((1 - 25 / 250) * 100);

var today = new Date();
//printl(today);

var arr = [1, 9, 4, 2, 5];
var sorted = arr.sort();
//printl(sorted);

var loadCandidatePhotos = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function () {
        if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && (xhr.status < 300 || xhr.status === 304)) {
                //setNewTabPage(true);
            }
            else {
                //setNewTabPage(false);
            }
        }
    };
    xhr.open("GET", url);
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*');
    xhr.send(null);
}


(function() {
  "use strict";


}());
