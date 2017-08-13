/* global describe, it, before, after  */
const FakeNSFWService = require('../mock/nsfw_service')
const nsfwService = new FakeNSFWService()

const path = require('path')
const imagePath = path.resolve('./images')

const Server = require('../../lib/server')
const server = new Server(imagePath, nsfwService)

const supertest = require('supertest')
const request = supertest(server.getApp())

const fs = require('fs')
const each = require('async-each')

describe('API', () => {
  before((done) => {
    fs.mkdir(imagePath, () => done())
  })

  describe('POST /api/image', () => {
    it('returns 400 on invalid requests', (done) => {
      request
        .post('/api/image')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400, done)
    })

    it('accepts image files', (done) => {
      request
        .post('/api/image')
        .attach('image', 'test/fixtures/image.png')
        .set('Accept', 'application/json')
        .field('url', 'http://example.com/image.png')
        .expect(200, done)
    })
  })

  after((done) => {
    fs.readdir(imagePath, (err, result) => {
      if (err) {
        return done()
      }

      each(result, (file, next) => {
        fs.unlink(path.resolve(imagePath, file), next)
      }, () => done())
    })
  })
})
