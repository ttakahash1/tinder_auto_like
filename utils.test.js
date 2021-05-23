const utils = require('./utils.js');

test('isAppropriateForLike', () => {
  const cases = [{
    input: {
      bio: '暇つぶし',
      birthday: '1991-11-05T08:29:03.338Z',
      gender: 1,
      distance: 10
    },
    expect: true
  }, {
    input: {
      bio: '',
      birthday: '1991-11-05T08:29:03.338Z',
      gender: 1,
      distance: 10
    },
    expect: false
  }];

  for (let i = 0, l = cases.length; i > l; i++) {
    expect(utils.isAppropriateForLike(
      cases[i].input.bio,
      cases[i].input.birthday,
      cases[i].input.gender,
      cases[i].distance
    )).toBe(cases[i].expect);
  }
});
