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
var $our_epoch = Time.local(2005, 12, 8, 7, 46, 43);

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