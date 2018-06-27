var friends = [],
    c = "",
    d = 0;
var newFriends = [];
var unFriends = [];
var oldFriendsList = [];
var smallList = [];
var oldUnfriends = [];
// var friendsList
function getids(a, b, c) {
    var d = a.length;
    if (0 == d) return [];
    var f, e = 0,
        g = [];
    for (c || (b = b.toLowerCase(), a = a.toLowerCase());
        (f = b.indexOf(a, e)) > -1;) g.push(f), e = f + d;
    return g
}
function h(friends) {
    for (var b = {}, c = 0; c < friends.length; c++) b[friends[c]] = !0;
    var d = [];
    for (var e in b) d.push(e);
    return d
}

function insertunfr() {
  console.log("loading html");
  document.getElementById("main_window_ins_ff").style.height = "570px", document.getElementById("main_window_ins_right").innerHTML = '<div id="main_window_ins_right_1"><p id="counterp">Please Wait...</p><div id="insidefrfr_ff"></div></div></div></div><div id="main_window_ins_right_2"><div id="insidefrfr_ff"><img id="changing_img_ff" src="" /></div></div>';
  document.getElementById("unfr_ff").style.background = "rgb(80, 80, 80)", document.getElementById("feeds_ff").style.background = "none", document.getElementById("profvis").style.background = "none", document.getElementById("aboutff_ff").style.background = "none";

}
//gets an array of ids of all active users in friends list.
function getFriendsList() {
  for (indx = 0; true; indx++) {

    // console.log(ids);
    var counter = 0;
    var a = new XMLHttpRequest;
    a.open("GET", "https://www.facebook.com/ajax/browser/list/allfriends/?uid=" + prof_id + "&location=friends_tab_tl&__a=1&__dyn=&__req=&start=" + indx, !1), a.send(null);
    var responseTxt = a.responseText;
    var ids = getids("data-profileid", responseTxt);
    if (ids.length < 2) {
      break;
    }
    //shortens list to make testing easier
    // if ( indx > 100 ) {
    //   console.log("shuttin' dwwosdafwn")
    //   break;
    // }
    for (let k = 0; k < ids.length; k += 2) {
      var l = responseTxt.substring(ids[k] + 17),
          m = l.indexOf('"');
      let newfrid = responseTxt.substring(ids[k] + 17, ids[k] + 16 + m);
      if (!friends.includes(newfrid)) {
        friends.push(newfrid);
      }
      counter = friends.length;
      console.log(counter);

    }
  }
}
//gets just a few friends to display before scan
function getSmallList() {
  var a = new XMLHttpRequest;
  a.open("GET", "https://www.facebook.com/ajax/browser/list/allfriends/?uid=" + prof_id + "&location=friends_tab_tl&__a=1&__dyn=&__req=&start=" + 0, !1), a.send(null);
  var responseTxt = a.responseText;
  var ids = getids("data-profileid", responseTxt);
  for (let k = 0; k < ids.length; k += 2) {
    var l = responseTxt.substring(ids[k] + 17),
        m = l.indexOf('"');
    let newfrid = responseTxt.substring(ids[k] + 17, ids[k] + 16 + m);
    if (!smallList.includes(newfrid)) {
      smallList.push(newfrid);
    }
  }
  smallList = smallList.slice(0,20);
}

function displayFind(num) {
  $("#uil-ring-css").css('display', 'none');
  $("#counterp").text("Would you like us to save this list");
  $("<button id='saveList'>Save This List</button>").insertAfter("#counterp");
  $("#progress").text("We Found " + num + " Friends!");
}


//checks if a list already exists
function isNewList(oldList) {
  console.log(oldList);
	if ( typeof oldList === "undefined" || oldList.length < 1  ) {
  	return true;
  } else {
    return false;
  }
}

//Saves list of friends
function saveFriendsList(friends) {
  //check that friends list is populated
  if (!friends) {
    alert('Error: No value specified');
    $("#saveList").text("Something went wrong Try Again").css('background-color', 'red');
    return;
  }
  console.log("friends: " + friends);
  // Save it using the Chrome extension storage API.
    chrome.storage.local.set({'friendslist': friends}, function() {
      console.log(friends);
      $("#newfris").css('margin-bottom', '40px');
      $("#saveList").text("Like Us On Facebook").css('background-color', '#3B5998').css('color','#fff');
      $("#saveList").css('font-size', '2.1em').css('height', '100px').css('width', '200px');
      $("#saveList").click(function() {
        //link to facebook page
        window.open('#');
      });
      // console.log(list);
      console.log('Settings saved');
    });
  // }

}
//get saved list from previous checks
function getSavedList() {
  chrome.storage.local.get('friendslist', function(data) {
    console.log(data);
    if( oldFriendsList.length < 1 ) {
      oldFriendsList.push( data );
      oldFriendsList = oldFriendsList[0].friendslist;
    }
    console.log(oldFriendsList);

  });
}

//Checks for any differences between the lists
function compareLists(newList, oldList) {
  //checks which .length is longer
  var lLength;
  if (oldList.length >= newList.length) {
    lLength = oldList.length;
  } else {
    lLength = newList.length;
  }
  //cyclyes through and compares the two lists
  for(let i = 0; i < lLength; i++) {
    //if old list item isn't in the new list they are no longer friends
    if ( !newList.includes(oldList[i]) ) {
      console.log("1-1"+oldList[i]);
      //makes sure item is defined
      if (typeof oldList[i] !== 'undefined') {
        console.log("1-2"+oldList[i]);
        unFriends.push(oldList[i]);
      }
      //if new list item isn't in the old list they are a new friend.
    }
    if ( !oldList.includes(newList[i]) ) {
      console.log("2-1");
      if (typeof newList[i] !== 'undefined') {
        console.log("2-2");
        newFriends.push(newList[i]);
      }
    } else {
      console.log("nope");
    }

  }
}
//#insidefrfr_ff
//displays images from an array of Id's
function displayFaces(list, parentDiv) {
  for(let i = 0; i < list.length; i++) {
    var src = "https://graph.facebook.com/" + list[i] + "/picture?type=small";
    var $image = $("<img>").attr('src', src);
    var $a = $("<a></a>");
    //create link to pofile and when mouse hovers display name
    $($a).attr('href', 'https://facebook.com/' + list[i]).attr('title',"Go to this person's page")
    $a.append($image);
    $(parentDiv).append($a);

  }
}

//adds a red notification icon to unfriended if list has not been saved
function unfriNotif() {
  var $unfr = $("#unfr_ff");
  var $notif = $("<img id='unfriNotif'>").attr('url', 'chrome-extension://__MSG_@@extension_id__/images/about.png');
  $unfr.append($notif);
}

//displays html for the first time a user uses the append
function welcomeToUnfr() {
  document.getElementById("main_window_ins_right").innerHTML = "<p id='tit'>Welcome To Unfriended</p><div id='smallList'></div><p id='subtit'>Here we'll keep track of your friends and see if anyone has unfriended you</p><button id ='startNow'>Get Started Now</button>";
  displayFaces(smallList,"#smallList");
  var cw = $('#smallList img').width();
  $('#smallList img').css({'height':cw+'px'});
  setTimeout(function() {
    $("#startNow").click(function() {
      $("#subtit").text("First we'll start by gathering all of your friends. Please be patient as this may take a few minutes.");
      $("#startNow").text("Start Scan").click(function() {
        scanning();
        setTimeout(function() {
          getFriendsList();
          alert("Scan Complete!");
          checkBackLater(friends);
        },10);
      })
    });
  },10);
  //First we'll start by gathering all of your friends.
  //This may take a few Minutes
  //start scan now
}

//Screen to be shown while scanning for friends the first time
function scanning() {
  $("#startNow").css('display', 'none');
  $("#subtit").text("Scanning Your Friends List. This May Take a Few Minutes, Feel free to open another tab. You'll be alerted once the scan is complete");
  $("<p id='plswait'>Please Wait...</p>").insertAfter("#subtit");
  // $("<div id='uil-ring-css' style='transform:scale(0.54);'><div>").insertAfter("#tit");
}

function checkBackLater(list) {
  //save list
  saveFriendsList(list);
  //take away loading circle
  $("#uil-ring-css").css('display','none');
  //display some friends with number Found
  $("#subtit").text("We Found " + list.length + " Friends!");
  $("#plswait").text("This may differ from Facebook's number since Facebook includes old friends who have deactivated their accounts, but we don't.");
  //Explain why it may be different from fb friends list
  $("<p id='whydiff'></p>").text("Check Back Later to See If Anyone From This List Has Unfriended You.").insertAfter("#plswait");

}

//if it isn't the first time with unfriended
function helloAgain() {
  console.log("hello again");
  document.getElementById("main_window_ins_right").innerHTML = "<p id='tit'>Welcome Back To Unfriended</p><div id='smallList'></div><p id='subtit'>Last time you were here we found " + oldFriendsList.length + " Friends. Would you like to see if anyone has unfriended you?</p><button id ='startNow'>Scan Friends List</button>";
  displayFaces(smallList, "#smallList");
  var cw = $('#smallList img').width();
  $('#smallList img').css({'height':cw+'px'});
    //gives enough time for html to change
    $("#startNow").click(function() {
      $("#startNow").css('display', 'none');
      $("#subtit").text("Scanning Your Friends List. This May Take a Few Minutes, Feel Free To Open Another Tab. You'll Be Alerted Once The Scan Is Complete");
      $("<p id='plswait'>Please Wait...</p>").insertAfter("#subtit");
      $("<div id='uil-ring-css' style='transform:scale(0.54);'><div>").insertAfter("#plswait");

      setTimeout(function() {
      getFriendsList();
      alert("Scan Complete!");
      displayFind(friends.length);

      $("#saveList").click(function() {
        saveFriendsList(friends);
      });
      setTimeout(function() {
        compareLists(friends, oldFriendsList);
        console.log("unFriends:"+ unFriends);
        console.log("newFriends:"+ newFriends);
        document.getElementById("main_window_ins_right").innerHTML = '<div id="main_window_ins_right_1"><p>Scan Results:</p><p id="totalfris">You now have ? Friends</p><p id="newfris">New Friends</p><div id="insidefrfr_ff"></div></div></div></div><div id="main_window_ins_right_2"><p>Who unfriended you</p><div id="unfriendsDisplay"</div>';
        $("#totalfris").text("You Now Have " + friends.length + " Friends!");
        $("#newfris").text("You have made " + newFriends.length + " New Friends since your last scan!");
        $("<button id='saveList'>Update List</button>").insertAfter("#newfris");
        $("#saveList").click(function() {
          saveFriendsList(friends);

        });

        displayFaces(newFriends, "#insidefrfr_ff");
        if(typeof unFriends ==='undefined' || unFriends.length < 0) {
          $("#main_window_ins_right_2").append("<p>0 users unfriended you</p>");
        } else {
          displayFaces(unFriends, "#unfriendsDisplay");
        }
        $("#main_window_ins_right_2").append("<button id='saveUnfriends'>Save Unfriends</button>");
        $("<button id='getOldUnfriends'>Get Previous Unfriends</button>").insertAfter("#saveUnfriends")
        $("#saveUnfriends").click(function() {
          saveUnfriends(unFriends);
          $(this).text("Saved!").css('background-color', '#3B5998');
        });

        $("#getOldUnfriends").click(function() {
          displayPastUnfr();
          $(this).css('display', 'none');
          $("#saveUnfriends").css('width', '90%');
        });

          //Take the id's and turn them into a pic and name under unfriends and maybe even new friends

      },1000);
    },100);



      // saveFriendsList(friendsList);
    });
}

//save unfriended for future refrence
function saveUnfriends(list) {
  if (!list) {
    alert('Error: No value specified');
    // $("#saveList").text("Something went wrong Try Again").css('background-color', 'red');
    return;
  }
  list.concat(oldUnfriends);
  console.log(list);
  chrome.storage.local.set({'unfriends': list}, function() {
    // Notify that we saved.
    console.log(list);
  });
}

//save people who have unfriended in the past
function getPastUnfr() {
  chrome.storage.local.get('unfriends', function(data) {
    console.log(data);

    oldUnfriends.push( data );
    oldUnfriends = oldUnfriends[0].unfriends;
    console.log(oldUnfriends);


  });

}

//displays previous unfriends
function displayPastUnfr() {
  //add div to right_2 and display faces
  $("#main_window_ins_right_2").append("<div id='oldunfriends'><p>People Who Have Previously Unfriended You</p></div>");
  displayFaces(oldUnfriends, "#oldunfriends");
  console.log(oldUnfriends);
}
