'use strict'

const url = require('url')
const zlib = require('zlib')

const AWS = require('aws-sdk')

const debug = require('debug')('request-lambda')

const lambdaCache = {}

function getLambdaController (region) {
  if (!(region in lambdaCache)) {
    lambdaCache[region] = new AWS.Lambda({ region })
  }
  return lambdaCache[region]
}

function Lambda (lambdaParams) {
  const {
    // --- lambda configuration --- //
    FunctionName,
    Qualifier = '$LATEST',
    LogType = 'None'
  } = lambdaParams

  const region = FunctionName.split(':')[3]
  const lambda = getLambdaController(region)

  return async function request (requestParams, callback) {
    const {
      // --- request configuration --- //
      method = 'GET',
      uri = '/',
      headers = {},
      body = null,

      // --- request options --- //
      // followRedirect = false,
      gzip = false,
      json = false,
      resolveWithFullResponse = false,
      simple = true
    } = {
      ...lambdaParams,
      ...requestParams
    }

    const parts = url.parse(uri, true)

    const payload = {
      FunctionName,
      InvocationType: 'RequestResponse',
      LogType,
      Payload: JSON.stringify({
        method,
        // --- serverless-http uses `httpMethod` property --- //
        httpMethod: method,
        headers: Object.assign(
          {},
          headers,
          (gzip)
            ? { 'Accept-Encoding': 'gzip' }
            : {}
        ),
        body: body && (
          (json)
            ? JSON.stringify(body)
            : body.toString()
        ),
        path: parts.pathname,
        queryStringParameters: parts.query
      }),
      Qualifier
    }

    debug({ payload })

    const promise = new Promise((resolve, reject) => {
      lambda.invoke(payload, (err, data) => {
        if (err) {
          return reject(err)
        }

        const payload = data.Payload ? JSON.parse(data.Payload) : null

        const statusCode = (data.FunctionError)
          ? 500
          : (data.StatusCode === 200 && payload && payload.statusCode)
            ? payload.statusCode
            : data.StatusCode
        debug({ statusCode })

        if (!simple && statusCode >= 400) {
          throw new Error(payload)
        }

        const headers = (payload && payload.headers) || {}
        debug({ headers })

        const body = (payload && payload.body) &&
          (
            (payload.isBase64Encoded)
              ? Buffer.from(payload.body, 'base64')
              : payload.body
          )

        if (gzip && body && payload.isBase64Encoded && /^gzip/i.test(headers['content-encoding'])) {
          debug('gunzipping')
          zlib.gunzip(body, (err, inflatedBody) => {
            if (err) {
              debug('gunzipping failed')
              // --- should we error on gzip fail? --- //
              // return reject(err)
              return resolve({
                statusCode,
                headers,
                body
              })
            }

            // --- this content is no longer gzipped, so remove the header --- //
            delete headers['content-encoding']
            resolve({
              statusCode,
              headers,
              body: inflatedBody
            })
          })
        } else {
          resolve({
            statusCode,
            headers,
            body
          })
        }
      })
    })
      .then((response) => {
        if (json) {
          try {
            debug('parsing json')
            response.body = JSON.parse(response.body)
          } catch (_) {
            debug('json parsing failed')
            // --- ignore JSON parsing error --- //
          }
        }
        return response
      })
      .then((response) =>
        (resolveWithFullResponse)
          ? response
          : response.body
      )

    if (callback) {
      promise
        .then((result) => callback(null, result))
        .catch(callback)
    }

    return promise
  }
}

module.exports = async (params) => Lambda(params)(params)
module.exports.Lambda = Lambda
