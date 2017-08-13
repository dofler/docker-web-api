const imagePath = process.env.IMAGE_PATH || './images'
const port = process.env.PORT || 8080

const NSFWService = require('./lib/nsfw_service')
const nsfwService = new NSFWService(process.env.IMGSVC_ADDRESS)

const Server = require('./lib/server')
const server = new Server(imagePath, nsfwService)

server.listen(port, () => {
  console.log('Listening on port %s', port)
})
