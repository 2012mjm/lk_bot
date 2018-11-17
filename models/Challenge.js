const nohm = require('nohm').Nohm;

module.exports = nohm.model('Challenge', {
  idGenerator: 'increment',
  properties: {
    userId: {
      type: 'integer',
      index: true,
      validations: [
        'notEmpty'
      ]
    },
    name: {
      type: 'string'
    },
    lastPostNum: {
      type: 'integer',
      defaultValue: 0,
    },
    description: {
      type: 'string'
    },
    aboutType: {
      type: 'string', // text | photo | audio | document | video | voice | video_note | location | venue | contact
      defaultValue: null,
    },
    aboutParams: {
      type: 'json', // caption | text | ...
    },
    createdAt: {
      type: 'string',
    },
  },
});
