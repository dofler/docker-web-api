const request = require('superagent')
const url = require('url')

module.exports = class NSFWService {
  constructor (host) {
    this._host = host
  }

  scoreImage (image, filename, callback) {
    request
    .post(url.resolve(this._host, '/score'))
    .set('Accept', 'application/json')
    .attach('image', 'test/fixtures/image.png')
    .end((error, res) => {
      if (error) {
        console.warn('Invalid image ' + filename, error)
        return callback(new Error('Not a valid image file'))
      }

      if (res.body.error) {
        console.warn('Invalid response from nsfw filter ' + filename)
        return callback(new Error('Not a valid image file'))
      }

      return callback(null, res.body)
    })
  }
}
