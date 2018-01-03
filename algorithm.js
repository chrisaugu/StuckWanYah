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




