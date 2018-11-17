const nohm = require('nohm').Nohm

module.exports = nohm.model('User', {
  idGenerator: 'increment',
  properties: {
    tgId: {
      type: 'integer',
      unique: true,
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    name: {
      type: 'string',
    },
    username: {
      type: 'string',
    },
    state: {
      type: 'string',
    },
    selectedPostId: {
      type: 'integer',
    },
    selectedChallengeId: {
      type: 'integer',
    },
    selectedLikeNumber: {
      type: 'integer',
    },
    draftPostId: {
      type: 'integer',
    },
    hasVIP: {
      type: 'integer',
      defaultValue: 0
    },
    chargeAmount: {
      type: 'integer',
      defaultValue: 5
    },
    createdAt: {
      type: 'string',
    },
    updatedAt: {
      type: 'string',
    }
  },
});
