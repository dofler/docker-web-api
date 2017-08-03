const express = require('express')
const fileUpload = require('express-fileupload')
const hasha = require('hasha')

var request = require('request')
var server = require('http').Server(app)
var io = require('socket.io')(server)


app.use(fileUpload())


app.post('/api/image', function (req, res){
  
  // If no file was uploaded to the API, then throw a HTTP 400 error and return
  // a JSON object detailing why we had errored out.
  if (!req.files) {
    console.warn('No image was uploaded to image endpoint')
    return res.status(400).send(JSON.stringify({error: 'No file was uploaded'}))
  }

  // The first step in parsing the image is to generate a hash of the file, which
  // we will be using as an identifier throughout the application.
  hasha.fromStream(req.files.image.data, {algorithm: 'md5'}).then(hash => {
    var extension = req.files.image.name.split('.').pop()

    // Attempt to find/create the image in the database.
    Image.findOrCreate(
      {where: {hash: hash}},
      defaults: {
        filename: [hash, extension].join('.'),
        url: req.body.url,
        count: 1
    }).spread((image, created) => {

      // If the image was created, then we will need to perform some additional
      // processing on the image.
      if (created){

        // First we need to write the file to disk.
        req.files.image.mv('/images/' + image.filename, function (err){

          // The next step is to hand the image off to the image processor for
          // the NSFW score and the perceptional hash of the image.
          request.post(process.env.IMGSVC_ADDRESS + '/score', {
            image: req.files.image.data
          }, function (err, resp, body){

            // If the image scoring failed (typically due to a bad image) then we should
            // return an error code indicating that and inform the parser that the image
            // was not a valid one.  We will still pusht he image into the websocket,
            // however unless the score filtering is turned off on the front-end, it will
            // be ignored.
            if (err) {
              io.emit('image', image)
              console.warn('Invalid image ' + image.filename)
              return res.status(415).send(JSON.stringify({error: 'Not a valid image file'}))
            }

            // As everything seems to be in order here, we will want to update the image database
            // entry with the score and perceptional hash that the image service returned for us.
            results = JSON.parse(body)
            image.updateAttributes({
              score: results.score,
              phash: results.phash
            }).then(result => {

              // We've computed everything down, and everything is good to go, lets go ahead and
              // push the image into the pipe and log the entry.
              io.emit('image', image)
              console.info('Created Image ' + image.filename + ' [' + image.score + '|' + image.phash + ']')
            })
          })
        })
      } else {

        // As this is an image that we have already seen in the past, there isn't any reason to 
        // run through all of the costly computational stuff that we would have to do for a new
        // image.  Instead we just want to make sure that this image hasn't been seen in the 
        // last 10 seconds or so.  If it has, then we will simply ignore the image request.  If
        // not, then we will update the timestamp and the counter and push the image into the
        // websocket
        if ((new Date().getTime() - image.timestamp) >= 1000) {
          image.updateAttributes({
            count: image.count++,
            timestamp: new Date().getTime()
          }).then(result => {

            // As we seem to have passed the timestamp checking and updated the image, lets
            // push the image into the websocket.
            io.emit('image', image)
            console.info('Updated Image ' + image.filename + ' [' + image.score + '|' + image.phash + ']')
          })
        }
      }
    })
  })
})