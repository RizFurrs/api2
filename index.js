require('make-promises-safe')

const { join } = require('path')
const { networkInterfaces } = require('os')
const Fastify = require('fastify')
const fastifyErrorPageMiddleware = require('fastify-error-page')
const serve = require('fastify-static')
const ytdl = require('ytdl-core')
const contentDisposition = require('content-disposition')
var express = require('express'),
    cors = require('cors'),
    secure = require('ssl-express-www');
const PORT = process.env.PORT || 8080 || 5000 || 3000
var { color } = require('./lib/color.js')

var mainrouter = require('./routes/main'),
    apirouter = require('./routes/api')

const server = Fastify({
  logger: true,
  ignoreTrailingSlash: true,
  connectionTimeout: 1000 * 20, 
})

const closeGracefully = async () => {
  if (server) await server.close()
  process.exit(0)
}

const getNetworkAddress = () => {
  const interfaces = networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      const {address, family, internal} = interface
      if (family === 'IPv4' && !internal) {
        return address
      }
    }
  }
}

process.on('SIGINT', closeGracefully)

server.register(fastifyErrorPageMiddleware)

server.register(serve, {
  root: join(__dirname, 'public'),
  prefix: '/',
})


const optsByFormat = new Map([
  // maps container to ytdl-core `ytdl` options
  ['mp3', { format: 'mp3', quality: 'highestaudio' , filter: 'audioonly' }],
  ['mp4', { format: 'mp4', quality: 'highest' }],
])

const schema = {
  params: {
    type: 'object',
    properties: {
      format: { type: 'string', enum: [...optsByFormat.keys()] }
    }
  },
  querystring: {
    type: 'object',
    properties: {
      url: { type: 'string' },
    },
    required: ['url'],
  },
}

server.get('/download/:format', { schema }, async (request, reply) => {
  const { url } = request.query
  const { format } = request.params

  const videoInfo = await ytdl.getBasicInfo(decodeURIComponent(url))
  const title = videoInfo.player_response.videoDetails.title || 'audio'

  const filename = `${title}.${format}`
  reply.header('Content-Disposition', contentDisposition(filename, { type: 'attachment' }))

  reply.send(
    ytdl(url, optsByFormat.get(format))
  )
})



server.listen(PORT, '0.0.0.0', (err, address) => {
  if (err) {
    server.log.error(err)
    process.exit(1)
  }

  const { port } = server.server.address()
  const ip = getNetworkAddress()
  if (ip && port) {
    const networkAddress = `http://${ip}:${port}`
    server.log.info(`Server listening at ${networkAddress}`)
  }
})


var app = express()
app.enable('trust proxy');
app.set("json spaces",2)
app.use(cors())
app.use(secure)
app.use(express.static("assets"))

app.use('/', mainrouter)
app.use('/docs', apirouter)

app.listen(PORT, () => {
    console.log(color("Server running on port " + PORT,'green'))
})

module.exports = app