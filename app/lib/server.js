const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const fileUpload = require('express-fileupload')
const hasha = require('hasha')
const path = require('path')

module.exports = class Server {
  constructor (imagePath, nsfwService) {
    this._imagePath = imagePath
    this._nsfwService = nsfwService

    this._app = express()
    this._server = http.Server(this._app)
    this._io = socketIO(this._server)

    this._app.use(fileUpload())

    this.registerRoutes()
  }

  registerRoutes () {
    this._app.post('/api/image', (req, res) => {
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

      req.files.image.mv(path.resolve(this._imagePath, image.filename), (err) => {
        if (err) {
          console.warn('Error moving image %s', image.filename, err)
          return res.status(500).send({ error: 'An error occured' })
        }

        this._nsfwService.scoreImage(req.files.image.data, image.filename, (error, result) => {
          if (error) {
            return res.status(415).send({ error: 'Not a valid image file' })
          }

          image.score = result.score
          image.phash = result.phash

          this._io.emit('image', image)
          return res.status(200).end()
        })
      })
    })
  }

  listen (port, callback) {
    this._server.listen(port, callback)
  }

  getApp () {
    return this._app
  }
}
