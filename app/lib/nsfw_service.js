const request = require('request')
const url = require('url')

module.exports = class NSFWService {
  constructor (host) {
    this._host = host
  }

  scoreImage (image, filename, callback) {
    request.post(url.resolve(this._host, '/score'), {
      image: image
    }, (err, res, body) => {
      if (err) {
        console.warn('Invalid image ' + filename)
        return callback(new Error('Not a valid image file'))
      }

      var results = JSON.parse(body)

      if (results.error) {
        console.warn('Invalid response from nsfw filter ' + filename)
        return callback(new Error('Not a valid image file'))
      }

      return callback(null, results)
    })
  }
}
