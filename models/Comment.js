const nohm = require('nohm').Nohm;

module.exports = nohm.model('Comment', {
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
    params: {
      type: 'json', // caption | text | ...
    },
    fileId: {
      type: 'string',
    },
    type: {
      type: 'string', // text | photo | audio | document | video | voice | video_note | location | venue | contact
      defaultValue: 'text',
      validations: [
        'notEmpty'
      ]
    },
    createdAt: {
      type: 'string',
    },
  },
});
