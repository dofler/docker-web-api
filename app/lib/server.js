const express = require('express')
const fs = require('fs')
const chalk = require('chalk')
const http = require('http')
const socketIO = require('socket.io')
const fileUpload = require('express-fileupload')
const hasha = require('hasha')
const path = require('path')
const mmm = require('mmmagic')
const imghash = require('imghash')
const mime = require('mime-type/with-db')



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

      // If no file was received, then we will want log the issue and then return the
      // parser a 400 error and state why there was a problem.
      if (!req.files) {
        console.log(`Webservice({chalk.yellow('images')}) : no image file was detected`)
        return res.status(400).send({error: 'no file was uploaded'})
      }

      // Next we need to determine if the file what was uploaded to us was actually an image
      // as we have little interest in dealing with anything else.
      var magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE)
      magic.detect(req.files.image.data, (err, mimetype) => {

        // If libmagic bails on us, then we should log the result, inform the parser of
        // the bad news, and move on.
        if (err) {
          console.log(`Webservice({chalk.red('images')}) : libmagic barfed on uploaded file`)
          return res.status(400).send({error: 'file was unreadable'})
        }

        // If libmagic has determined that the file is not an image, then we need to stop
        // processing and 
        if (mimetype.substring(0,5) != 'image') {
          console.log(`Webservice({chalk.red('images')}) : uploaded file is not an image`)
          return res.status(400).send({error: 'file was not an image'})
        }

        // As we now know that there is a valid image file that was uploaded to the API,
        // we now want to parse the data and generate the md5sum for comparison within
        // the database.
        var hash = hasha(req.files.image.data, {algorithm: 'md5'})
        var extension = mime.extension(mimetype)
        var filename = `{hash}.{extension}`
        db.Image.findOrCreate({where: {hash: hash},
          defaults: {
            mimetype: mimetype,
            filename: filename,
            count: 1 
          }
        }).spread((image, created) => {

          // If we are dealing with a new file, then we will want to write the file to
          // disk, compute the perceptional hash, and get the NSFW score for the image
          // from the image service.
          if (created) {

            // Compute the perceptional hash of the image
            imghash.hash(req.files.image.data).then(phash => {

              // Call out to the image service to get the NSFW score
              this._nsfwService.scoreImage(req.files.image.data, (err, score) => {

                // If there was an issue getting the score, then we should log and inform
                // the parser
                if (err) {
                  console.log(`Webservice({chalk.red('images')}) : image service reported an error`)
                  return res.status(415).send({error: 'image service barfed on uploaded file'})
                }

                // Now we need to write the file to disk.
                fs.writeFile(`{this._imagePath}/{filename}`, req.files.image.data, (err) =>{

                  // If there was an issue writing the file, then we should log the issue
                  // and return a 500 error code to the perser.
                  if (err) {
                    console.log(`Webservice({chalk.red('images')} : could not write file to disk`)
                    return res.status(500).send({error: 'could not write file to disk'})
                  }

                  // As we have gotten this far, I think it's safe to assume that we can update the
                  // appropriate image attributes and emit the image to all connected clients.
                  image.updateAttributes({
                    score: score,
                    phash: phash
                  }).then(resp => {
                    console.log(`Webservice({chalk.green('images')}) : {chalk.blue(image.hash)} pushed to clients`)
                    this._io.emit('images', image)
                  })

                })
              })
            })

          // If we're dealing with an image that we have already seen before, then the only things
          // that we want to do is update the timestamp and the count and then emit the image to
          // the clients.
          } else {
            var lastUpdated = image.timestamp
            image.updateAttributes({
              timestamp: Date.now(),
              count: image.count + 1
            }).then(resp => {

              // As we want to make sure that the clients aren't getting swamped with the same image
              // over and over again, we have a 10 second timer for emiting the same image to the 
              // client.  In either case, we will log the event to the console.
              if ((image.timestamp - lastUpdated)/1000 >= 10) {
                console.log(`Webservice({chalk.green('images')}) : {chalk.blue(image.hash)} updated & pushed to clients`)
                this._io.emit('images', image)
              } else {
                console.log(`Webservice({chalk.green('images')}) : {chalk.green(image.hash)} updated`)
              }
            })
          }
        })
      })
    })


    this._app.post('/api/dns-address', (req, res) => {

    })

    this._app.post('/api/mobile-device', (req, res) => {

    })

    this._app.post('/api/user-agent', (req, res) => {

    })

    this._app.post('/api/vulnerability', (req, res) => {

    })

    this._app.post('/api/account', (req, res) => {

    })

    this._app.post('/api/protocol', (req, res) => {

    })

    this._app.get('/api/blacklist', (req, res) => {

    })

    this._app.put('/api/blacklist', (req, res) => {

    })

    this._app.delete('/api/blacklist', (req, res) => {

    })

    this._app.post('/login', (req, res) => {

    })

    this._io.on('connection', client => {
      // Log the Connection to the console
      console.log(`WebService({chalk.green('connect')}) : Client connected at {chalk.green(client.handshake.address.address)}`)

      // Next we need to inform the client we'd like to repaint the page from scratch (in the case of a disconnection)
      // as we no longer know the age of the data that's being stored on the client.
      client.emit('clearscreen', true)

      // Grab the image blacklist and emit them to the client.
      db.Blacklist.findAll().then(blacklist =>{
        for (item in blacklist) {
          client.emit('blacklist', item)
        }
      })

      // Grab the last 200 images parsed and emit them to the client.
      db.Image.findAll({
        order: 'count DESC',
        limit: 200,
        raw: true
      }).then(images => {
        for (image in images) {
          client.emit('images', image)
        }
      })

      // Grab all of the accounts discovered and emit them to the client.
      db.Account.findAll().then(accounts =>{
        for (account in accounts) {
          client.emit('accounts', account)
        }
      })

      // Grab the last 10 DNS addresses discovered and emit them to the client.
      db.DNSAddress.findAll({
        order: 'timestamp DESC',
        limit: 10,
        raw: true
      }).then(addresses => {
        for (address in addresses) {
          client.emit('dns-addresses', address)
        }
      })

      // Grab the top 10 mobile devices discovered and emit them to the client.
      db.MobileDevice.findAll({
        order: 'count DESC',
        limit: 10,
        raw: true
      }).then(devices => {
        for (device in devices) {
          client.emit('mobile-devices', device)
        }
      })

      // Grab the top 10 user-agent strings discovered and emit them to the client.
      db.UserAgent.findAll({
        order: 'count DESC',
        limit: 10,
        raw: true
      }).then(useragents => {
        for (useragent in useragents) {
          client.emit('user-agents', useragent)
        }
      })

      // Grab the top 10 vulnerable hosts and emit them to the client.
      db.VulnerableHost.findAll({
        order: 'score DESC',
        limit: 10,
        raw: true
      }).then(hosts => {
        for (host in hosts) {
          client.emit('vulnerable-hosts', host)
        }
      })

      // Grab the top 10 vulnerabilities and emit them to the client.
      db.Vulnerabilities.findAll({
        order: 'count DESC',
        limit: 10.
        raw: true
      }).then(vulns => {
        for (vuln in vulns) {
          client.emit('vulnerabilities', vuln)
        }
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
