/* global describe, it */
const chai = require('chai')
const expect = chai.expect
const { app } = require('../../lib/server')
const supertest = require('supertest')
const request = supertest(app)

describe('API', () => {
  describe('POST /api/image', () => {
    // it('returns 400 on invalid requests', (done) => {
    //   request
    //     .post('/api/image')
    //     .set('Accept', 'application/json')
    //     .expect('Content-Type', /json/)
    //     .expect(400)
    //     .end((error, res) => {
    //       if (error) {
    //         throw error
    //       }

    //       done()
    //     })
    // })

    it('accepts image files', (done) => {
      request
        .post('/api/image')
        .attach('image', 'test/fixtures/image.png')
        .set('Accept', 'application/json')
        .field('url', 'http://example.com/image.png')
        .expect('Content-Type', /json/)
        .expect(200)
        .end((error, res) => {
          if (error) {
            throw error
          }

          done()
        })
    })
  })
})
