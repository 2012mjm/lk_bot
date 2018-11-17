const nohm = require('nohm').Nohm;

module.exports = nohm.model('Like', {
  idGenerator: 'increment',
  properties: {
    userId: {
      type: 'integer',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    postId: {
      type: 'integer',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    number: {
      type: 'integer',
      validations: [
        'notEmpty'
      ]
    },
    createdAt: {
      type: 'string',
    },
  },
});
