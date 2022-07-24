const shortid = require('shortid')
const Url = require('../Models/urlModel')
const validator = require('validator')
const  {promisify} = require("util");
const redis = require('redis')


const baseUrl = 'http://localhost:3000'

const redisClient = redis.createClient(
    12075,
    "redis-12075.c114.us-east-1-4.ec2.cloud.redislabs.com",
    { no_ready_check: true }
  );
  redisClient.auth("FOyLtlMpBGXz8Mv4w2NImZF0k2SBI2hD", function (err) {
    if (err) throw err;
  });
  
  redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
  });

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);

const shortenUrl = async function (req, res) {
    try {
        if (Object.keys(req.body).length == 0) {
            return res.status(400).send({ status: false, msg: "Body should not be Empty.. " })
        }
        const { longUrl } = req.body
        if(!longUrl)    return res.status(400).send({ status: false, msg: "Please provide longUrl" })

        if(typeof longUrl != "string")  return res.status(400).send({ status: false, msg: "Invalid longUrl format" })
        const urlCode = shortid.generate().toLowerCase()

        if (validator.isURL(longUrl)) {
            let cachedUrl = await GET_ASYNC(`${longUrl}`)
             cachedUrl = JSON.parse(cachedUrl)
            if(cachedUrl)    return res.status(200).send({ status: true, data: cachedUrl})

            let url = await Url.findOne({longUrl}).select({ _id: 0, __v: 0 })

            if (url) {
                await SET_ASYNC(`${longUrl}`, (url))
                res.status(200).send({ status: true, data: url })
            } else {
                // join the generated short code and the base url
                const shortUrl = baseUrl + '/' + urlCode

                let url = await Url.create({longUrl, shortUrl, urlCode})
                let data = {
                    longUrl : url.longUrl,
                    shortUrl : url.shortUrl,
                    urlCode : url.urlCode
                }

                res.status(201).send({ status: true, data: data })
            }
        }
        else {
            res.status(400).send({ status: false, message: "Invalid longUrl" })
        }
    }
    catch (err) {
        console.log(err)
        res.status(500).send({ status: false, message: err.message })
    }
}


const getUrlCode = async function (req, res) {
    try {
        // find a document match to the code in req.params.code
        if(!shortid.isValid(req.params.urlCode)  )   return res.status(400).send({ status: false, message: 'Wrong UrlCode' })
        let cachedUrl = await GET_ASYNC(`${req.params.urlCode}`)
        if(cachedUrl)    return res.status(302).redirect(cachedUrl)
        const url = await Url.findOne({
            urlCode: req.params.urlCode
        })
        if (url) {
            await SET_ASYNC(`${req.params.urlCode}`, url.longUrl)
            return res.status(302).redirect(url.longUrl)
        } else {
            return res.status(404).send({ status: false, message: 'No URL Found' })
        }

    }
    catch (err) {
        console.error(err)
        res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { shortenUrl, getUrlCode }
