const ANTI_KEYWORDS = [
  // add keywords that you don't like. 
];

const MAX_AGE = 36;
const MIN_AGE = 28;
const DISTANCE = 15;
const GENDER = 1;

const sleep = async (msec) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(true);
    }, msec);
  });
}

// Likeを送るにふさわしい相手かどうかを判断
const isAppropriateForLike = (bio, birthday, gender, distance) => {
  let isAppropriate = true;
  for (let i = 0, l = ANTI_KEYWORDS.length; i < l; i++) {
    if (bio.indexOf(ANTI_KEYWORDS[i]) !== -1) {
      isAppropriate = false;
      break;
    }
  }
  const age = getAgeByBirthday(birthday);
  if (age > MAX_AGE || age < MIN_AGE) {
    isAppropriate = false;
  }
  if (gender !== GENDER) {
    isAppropriate = false;
  }
  if (distance > DISTANCE) {
    isAppropriate = false;
  }

  return isAppropriate;
};

// 生年月日から年齢を算出
const getAgeByBirthday = birthday => {
  const now = Date.now();
  const birthdayUtime = Date.parse(birthday);
  return Math.round((now - birthdayUtime) / (60*60*24*365*1000));
}

module.exports.sleep = sleep;
module.exports.isAppropriateForLike = isAppropriateForLike;
module.exports.getAgeByBirthday = getAgeByBirthday;
