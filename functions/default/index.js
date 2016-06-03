import request from 'request'
import cheerio from 'cheerio'
import moviesFormatter from './moviesFormatter'
import TelegramBot from './TelegramBot'
import config from './config'
import AWS from 'aws-sdk'
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'ap-northeast-1' })

function getCachedMovies() {
  let params = {
    TableName: "movies_bot_cache",
    Key: {
      type: "movies"
    }
  }

  return new Promise(function (resolve, reject) {
    dynamodb.get(params, function (err, data) {
      if (err) {
        reject(err)
      } else {
        let cachedData = (data.Item || {}).data
        resolve(cachedData || {})
      }
    })
  })
}

function updateCachedMovies(titles, movies) {
  let data = {}
  titles.forEach((title, index) => {
    data[title] = movies[index]
  });

  let params = {
    TableName: "movies_bot_cache",
    Item: {
      type: "movies",
      data: data
    }
  }

  return new Promise(function(resolve, reject) {
    dynamodb.put(params, function (err, data) {
      if (err) {
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}

function getHtml(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(error, response, body) {
      if (error) return reject(error)
      if (response.statusCode != 200) return reject(body)
      return resolve(body)
    })
  })
}

async function getMovieTitleAndUrl(title, cachedMovieData) {
  let url
  if (cachedMovieData) {
    title = cachedMovieData.title
    url = cachedMovieData.url
  } else {
    let json = await getHtml(`http://www.imdb.com/xml/find?json=1&nr=1&tt=on&r=1&q=${encodeURIComponent(title)}`)
    json = JSON.parse(json)

    if (!json.title_exact && !json.title_popular && !json.title_approx) return { title }
    let movie = (json.title_exact || json.title_popular || json.title_approx)[0]
    title = movie.title.replace(/&#x27;/g, "'").replace(/&#x26;/g, "&")
    url = `http://www.imdb.com/title/${movie.id}`
  }

  return { title, url }
}

async function getMovieInfo(title, cachedMovieData) {
  title = title.replace(/`/g, "'")
  try {
    let url, rating, fetchTime
    ({ title, url } = await getMovieTitleAndUrl(title, cachedMovieData))

    if (!url) return { title }

    if (cachedMovieData && cachedMovieData.fetchTime && (Date.now() - cachedMovieData.fetchTime <= 86400000)) {
      fetchTime = cachedMovieData.fetchTime
      rating = cachedMovieData.rating
    } else {
      let html = await getHtml(url)
      let $ = cheerio.load(html)
      fetchTime = Date.now()
      rating = $('[itemprop="ratingValue"]').text() || null
    }

    return { title, url, rating, fetchTime }
  } catch (error) {
    return { title }
  }
}

function getMoviesInfo(titles, cachedMovies) {
  let promises = titles.map((title) => { return getMovieInfo(title, cachedMovies[title]) })
  return Promise.all(promises)
}

async function getMovies() {
  let html = await getHtml('http://www.shaw.sg/sw_movie.aspx')
  let $ = cheerio.load(html)

  let titles = $('.panelMovieListRow tr:nth-child(1) > td:nth-child(2) > a').map(function () {
    let title = $(this).text().replace('Disney`s ', '').replace('Marvel`s ', '')
    let bracketIdx = title.indexOf('[')
    if (bracketIdx > 0) return title.substring(0, bracketIdx - 1)
    return title
  }).toArray()
  titles = Array.from(new Set(titles))

  let cachedMovies = await getCachedMovies()
  let movies = await getMoviesInfo(titles, cachedMovies)
  updateCachedMovies(titles, movies)
  return movies
}

function getChatIds(records) {
  return records.map((record) => {
    try {
      return JSON.parse(record.Sns.Message).chat_id
    } catch (err) {
      return null
    }
  }).filter((chat_id) => { return chat_id })
}

export default async function (event, context) {
  try {
    // context.succeed(moviesFormatter(movies))
    let chat_ids = getChatIds(event.Records)
    if (chat_ids.length === 0) return context.succeed({ ok: true })

    let movies = await getMovies()
    let telegramBot = new TelegramBot(config.TELEGRAM_API_KEY)
    let promises = chat_ids.map((chat_id) => {
      return telegramBot.sendMessage({ chat_id: chat_id, text: moviesFormatter(movies) })
    })
    await Promise.all(promises)
    context.succeed({ ok: true })
  } catch (error) {
    context.fail(error)
  }
}
