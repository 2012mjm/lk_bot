const nohm = require('nohm').Nohm;

module.exports = nohm.model('Post', {
  idGenerator: 'increment',
  properties: {
    userId: {
      type: 'integer',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    type: {
      type: 'string', // text | photo | audio | document | video | voice | video_note | location | venue | contact
      defaultValue: 'text',
      validations: [
        'notEmpty'
      ]
    },
    params: {
      type: 'json', // caption | text | ...
    },
    likeCount1: {
      type: 'integer',
      defaultValue: 0
    },
    likeCount2: {
      type: 'integer',
      defaultValue: 0
    },
    likeCount3: {
      type: 'integer',
      defaultValue: 0
    },
    likeCount4: {
      type: 'integer',
      defaultValue: 0
    },
    likeCount5: {
      type: 'integer',
      defaultValue: 0
    },
    likeCount6: {
      type: 'integer',
      defaultValue: 0
    },
    likeText1: {
      type: 'string',
      defaultValue: null
    },
    likeText2: {
      type: 'string',
      defaultValue: null
    },
    likeText3: {
      type: 'string',
      defaultValue: null
    },
    likeText4: {
      type: 'string',
      defaultValue: null
    },
    likeText5: {
      type: 'string',
      defaultValue: null
    },
    likeText6: {
      type: 'string',
      defaultValue: null
    },
    commentCount: {
      type: 'integer',
      defaultValue: 0
    },
    commentUserCount: {
      type: 'integer',
      defaultValue: 0
    },
    orderCount: {
      type: 'integer',
      defaultValue: 0
    },
    hasLike: {
      type: 'integer',
      defaultValue: 0
    },
    hasComment: {
      type: 'integer',
      defaultValue: 0
    },
    hasOrder: {
      type: 'integer',
      defaultValue: 0
    },
    publishUpdate: {
      type: 'json',
      defaultValue: null
    },
    publishSelfUpdate: {
      type: 'json',
      defaultValue: null
    },
    allowSeeUsers: {
      type: 'integer',
      defaultValue: 1
    },
    challengeId: {
      type: 'integer',
      index: true,
      defaultValue: 0
    },
    challengeOwnerId: {
      type: 'integer',
      index: true
    },
    challengeSelfNum: {
      type: 'integer'
    },
    status: {
      type: 'string',
      defaultValue: 'showing' // showing | draft
    },
    createdAt: {
      type: 'string',
    },
  },
});
