const NSFWService = require('../../lib/nsfw_service')

module.exports = class FakeNSFWService extends NSFWService {
  scoreImage (image, filename, callback) {
    callback(null, {
      phash: 'abc',
      score: 100
    })
  }
}
