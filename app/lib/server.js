const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const fileUpload = require('express-fileupload')
const hasha = require('hasha')
const request = require('request')

app.use(fileUpload())

app.post('/api/image', (req, res) => {
  if (!req.files) {
    console.warn('No image was uploaded to image endpoint')
    return res.status(400).send({ error: 'No file was uploaded' })
  }

  var hash = hasha(req.files.image.data, { algorithm: 'md5' })
  var extension = req.files.image.name.split('.').pop()

  var image = {
    hash: hash,
    filename: [hash, extension].join('.'),
    url: req.body.url,
    count: 1
  }

  req.files.image.mv('/images/' + image.filename, (err) => {
    if (err) {
      console.warn('Error moving image %', err)
      return res.status(500).send({ error: 'An error occured' })
    }

    request.post(process.env.IMGSVC_ADDRESS + '/score', {
      image: req.files.image.data
    }, (err, resp, body) => {
      if (err) {
        console.warn('Invalid image ' + image.filename)
        return res.status(415).send({ error: 'Not a valid image file' })
      }

      var results = JSON.parse(body)

      if (results.error) {
        console.warn('Invalid response from nsfw filter ' + image.filename)
        return res.status(415).send({ error: 'Not a valid image file' })
      }

      image.score = results.score
      image.phash = results.phash

      io.emit('image', image)
      console.info('Created Image ' + image.filename + ' [' + image.score + '|' + image.phash + ']')
      return res.status(200).send({ image: image })
    })
  })
})

module.exports = {
  app: app,
  server: server
}
