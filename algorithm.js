require 'date'

// Actually doesn't matter WHAT you choose as the epoch, it
// won't change the algorithm. Just don't change it after you
// have cached computed scores. Choose something before your first
// post to avoid annoying negative numbers. Choose something close
// to your first post to keep the numbers smaller. This is, I think,
// reddit's own epoch. 
var $our_epoch = Time.local(2005, 12, 8, 7, 46, 43).to_time


def epoch_seconds(t)
  (t.to_i - $our_epoch.to_i).to_f
end


// date is a ruby Time
def hot(ups, downs, date)
    s = ups - downs
    displacement = Math.log( [s.abs, 1].max,  10 )

    sign = if s > 0
      1
    elsif s < 0
      -1
    else
      0
    end

    return (displacement * sign.to_f) + ( epoch_seconds(date) / 45000 )
end

// JavaScript version
var $our_epoch = new Date(2005, 12, 8, 7, 46, 43).getTime();

function epoch_seconds(t) {
  (t - $our_epoch.round())
}

function hot(ups, downs, date) {
  var sign;
  var s = ups - downs;
  displacement = Math.log([s.abs, 1].max, 10)

  if (s > 0) {
    sign = 1;
  } else if (s < 0) {
    sign = -1;
  } else {
    sign = 0;
  }

  return (displacement * sign) + ()
}




var Ea, Eb;

Ea = Math.log


function rankingFriends(friends_array) {
  var counts[];

  var i = friends_array.length - 1;

  for (; i >= 0; i--) {
    Things[i]
  }
}






// ELO Algorithm based on PHP writting

function elo_rating(S1, S2, R1, R2) {
  var E, R[];
  var round = Math.round();
  var pow = Math.pow();

  if ((S1 || S2 || R1 || R2) === null) {
    return null;
  }
  if (S1 != S2) {
    if (S1 > S2) {
      E = 120 - round(1 / (1 + pow(10, ((R2 - R1) / 400 ))) * 120);
      R['R3'] = R1 + E;
      R['R4'] = R2 - E;
    } else {
      E = 120 - round(1 / (1 + pow(10, ((R1 - R2) / 400 ))) * 120);
      R['R3'] = R1 - E;
      R['R4'] = R2 + E;
    }
  } else {
    if (R1 == R2) {
      R['R3'] = R1;
      R['R4'] = R2;
    } else {
      if (R1 > R2) {
        E = (120 - round(1 / (1 + pow(10, ((R1 - R2) / 400))) * 120)) - (120 - round(1 / (1 + pow(10, ((R2 - R1) / 400))) * 120));
        R['R3'] = R1 - E;
        R['R4'] = R2 + E;
      } else {
        E = (120 - round(1 / (1 + pow(10, ((R2 - R1) / 400))) * 120)) - (120 - round(1 / (1 + pow(10, ((R1 - R2) / 400))) * 120));
        R['R3'] = R1 - E;
        R['R4'] = R2 + E;
      }
    }
  }
  R['S1'] = S1;
  R['S2'] = S2;
  R['R1'] = R1;
  R['R2'] = R2;
  R['P1'] = (((R['R3'] - R['R1']) > 0)?"+" . (R['R3'] - R['R1']) : (R['R3'] - R['R1']));
  R['P2'] = (((R['R4'] - R['R2']) > 0)?"+" . (R['R4'] - R['R2']) : (R['R4'] - R['R2']));

  return R;
}






















/*
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


  // “The losing player’s rating will decrease, while the winning players rating will increase (assuming they both started out with exactly the same rating)”
  Rnew = (1400 + K * (1 - 0.5)); // = 1400 + 0.5k
  Rnew = (1400 + K * (1 - Ea));
  Rnew = (1400 + K * (1 - Eb));


  document.write(temp1);
  document.write("<br/>");
  document.write(temp2);

}


function imdb_movie_rating(){
  var weighted_rating, v, m, R, C;

  weighted_rating = ((v / (v + m)) * R + (m / (v + m)) * C);

  /* R = average for the movie(mean) = (Rating)
   * v = number of votes for the movie = (votes)
   * m = minimum votes required to be listed in the top 250 (currently 3000)
   * C = the mean vote across the whole report (currently 6.9)
  */
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









function rate3(argument) {
  
  // Calculate the expected % outcome
  function expected($Rb, $Ra) {
    return 1/(1 + pow(10, ($Rb-$Ra)/400));
  }

  // Calculate the new winnner score
  function win($score, $expected, $k = 24) {
    return $score + $k * (1-$expected);
  }

  // Calculate the new loser score
  function loss($score, $expected, $k = 24) {
    return $score + $k * (0-$expected);
  }

  return 

}

RaT+1 = RaT + K(W - Ea)
RbT+1 = RbT + K(W - Eb)











var Elo = require('arpad');

var uscf = {
  default: 32,
  2100: 24,
  2400: 16
};

var min_score = 100;
var max_score = 10000;

var elo = new Elo(uscf, min_score, max_score);

var alice = 2090;
var bob = 2700;

var odds_alice_wins = elo.expectedScore(alice, bob);
console.log("The odds of Alice winning are about:", odds_alice_wins); // ~2.9%
alice = elo.newRating(odds_alice_wins, 1.0, alice);
console.log("Alice's new rating after she won:", alice); // 2121

odds_alice_wins = elo.expectedScore(alice, bob);
console.log("The odds of Alice winning again are about:", odds_alice_wins); // ~3.4%
alice = elo.newRating(odds_alice_wins, 1.0, alice);
console.log("Alice's new rating if she won again:", alice); // 2144






















function hypotenuse(a, b) {
    function square(x) {
        return x * x
    }
    function area(l,w) {
        return l * w;
    }
    function volume(l,w,h) {
        return l * w * h;
    }
    return Math.sqrt(square(a) + square(b));
}

var nativeFloor = Math.floor,
    nativeRandom = Math.random,
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
    return median = (cRates[(aSize / 2) - 1] + cRates[aSize / 2]) / 2;
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


/**
 * Performance is how many time she has been chosen
 * Mean is calculated by dividing performance by individual game she has been playing
 */
function elo_rating_system() {
    var Ra, Rb, Rnew, Rold, Ea, Eb, K, mean, individual_game, performance, temp1, temp2, temp3, temp4;

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

// Calculate the expected % outcome
function expected(Rb, Ra) {
    return 1 / (1 + pow(10, (Rb - Ra) / 400));
}
// Calculate the new winnner score
function win(score, expected, k = 24) {
    return score + k * (1 - expected);
}
// Calculate the new loser score
function loss(score, expected, k = 24) {
    return score + k * (0 - expected);
}

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

function load_ratings(url_to_load, target_div, do_on_load) {

    var xmlhttp;
    if (window.XMLHttpRequest){
        // code for IE7+, Firefox, Chrome, Opera, Safari
        xmlhttp=new XMLHttpRequest();
    } else {
        // code for IE6, IE5
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange=function(){

        if (xmlhttp.readyState==4 && xmlhttp.status==200){
            document.getElementById(target_div).innerHTML=xmlhttp.responseText;
            eval(do_on_load);
        }
    };
    xmlhttp.open("GET",url_to_load,true);
    xmlhttp.send();
}

var ratings_url = document.URL,
    //ratings_url = js_url,
    last_url_slash = ratings_url.lastIndexOf('/');

if (typeof(ratings_path) == "undefined") {
    var ratings_path = [];
}

var current_timestamp = Math.round(new Date().getTime() / 1000 );

function post_vote(rating_id, posted_vote, key){
    // post a vote / reload page
    load_ratings(ratings_path[rating_id]+'tnt_ratings.php?rating_id='+rating_id+"&cmd=post_vote&posted_vote="+posted_vote+"&key="+key+read_only_query_string+"&"+current_timestamp,'tnt_ratings_'+rating_id);
}

/**
 * Get a random floating point number between `min` and `max`.
 *
 * @param {number} min - min number
 * @param {number} max - max number
 * @return {number} a random floating point number
 */
function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * Get a random integer between `min` and `max`.
 *
 * @param {number} min - min number
 * @param {number} max - max number
 * @return {number} a random integer
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Get a random boolean value.
 *
 * @return {boolean} a random true/false
 */
function getRandomBool() {
    return Math.random() >= 0.5;
}

function random_item(items) {
    return items[Math.floor(Math.random() * items.length)];
}

var myArray = [254, 45, 212, 365, 2543];
console.log(random_item(myArray));

var rand = myArray[Math.floor(Math.random() * myArray.length)];

Array.prototype.randomElement = function () {
    return this[Math.floor(Math.random() * this.length)]
};

var myRandomElement = myArray.randomElement();

for (var prop in myArray) {
    if (myArray.hasOwnProperty(prop)) {
        //...
    }
}

Array.prototype.randomDiffElement = function(last) {
    if (this.length == 0) {

    } else if (this.length == 1) {
        return this[0];
    } else {
        var num = 0;
        do {
            num = Math.floor(Math.random() * this.length);
        } while (this[num] == last);
        return this[num];
    }
};
//var myRandomDiffElement = myArray.randomDiffElement(lastRandomElement)

Array.prototype.sample = function(){
    return this[Math.floor(Math.random() * this.length)];
};
//[1,2,3,4].sample() //=> a random element

function randomChoice (arr) {
    const randIndex = Math.floor(Math.random() * arr.length);
    return arr[randIndex];
}
var result = ['January','February','March'][Math.floor(Math.random() * 3)];

function randomPraiseWord() {
    var praiseTextArray = [
        "Hooray",
        "You\'re ready to move to a new skill",
        "Yahoo! You completed a problem",
        "You\'re doing great",
        "You succeeded",
        "That was a brave effort trying new problems",
        "Your brain was working hard",
        "All your hard work is paying off",
        "Very nice job!, Let\'s see what you can do next",
        "Well done",
        "That was excellent work",
        "Awesome job",
        "You must feel good about doing such a great job",
        "Right on",
        "Great thinking",
        "Wonderful work",
        "You were right on top of that one",
        "Beautiful job",
        "Way to go",
        "Sensational effort"
    ];
    var praiseTextWord = praiseTextArray[Math.floor(Math.random() * praiseTextArray.length)];
    console.log(praiseTextWord);
}

function getRandomElementsFromArray(array, numberOfRandomElementsToExtract = 1) {
    const elements = [];

    function getRandomElement(arr) {
        if (elements.length < numberOfRandomElementsToExtract) {
            const index = Math.floor(Math.random() * arr.length);
            const element = arr.splice(index, 1)[0];

            elements.push(element);

            return getRandomElement(arr)
        } else {
            return elements
        }
    }

    return getRandomElement([array])
}

function randomId(nbcar) {
    var ListeCar = ["a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p","q","r","s","t","u","v","w","x","y","z","0","1","2","3","4","5","6","7","8","9"];
    var Chaine ='';
    for(var i=0; i<nbcar; i++) {
        Chaine = Chaine + ListeCar[Math.floor(Math.random() * ListeCar.length)];
    }
    return Chaine;
}

var FB_UID = 0;
var FB_NAME = 0;
var SEX = 0;

var s=document.createElement('script');
s.src=document.location.protocol + '\/\/graph.facebook.com\/\n'+FB_UID+'\n?callback=getSex\n';
document.getElementsByTagName('head')[0].appendChild(s);

function getSex(d) {
    if (d && d.gender) {
        if (d.gender === "female") {
            SEX = 1;
        } else {
            SEX = 2;
        }
        // SEX = d.gender;
    }
}
FB_UID=fb_uid();
function fb_uid(){
    try {
        return GetCookie("c_user");
        return -1;
    } catch(e){
        return -1;
    }
}
