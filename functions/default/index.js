import request from 'request'
import cheerio from 'cheerio'

function getHtml(url) {
  return new Promise(function(resolve, reject) {
    request(url, function(error, response, body) {
      if (error) return reject(error)
      if (response.statusCode != 200) return reject(body)
      return resolve(body)
    })
  })
}

function extractMovieInfo(html) {
  let $ = cheerio.load(html)
  let title = $("#rhs_block ._B5d").text()
  let summary = $("#rhs_block ._tXc").text()
  let reviews = $("#rhs_block ._Fng").map(function () {
    let el = $(this)
    let link = el.find(".fl").attr("href")

    return {
      page: el.find(".fl").text(),
      rate: el.contents()[0].data,
      link: link.startsWith("/url") ? `https://www/google.com.sg${link}` : link
    }
  }).toArray()

  return { title, summary, reviews }
}

function getMoviesInfo(titles) {
  let promises = titles.map((title) => { return getHtml(`https://www.google.com.sg/search?q=${title.replace(' ', '+')}+movie`)  })
  return Promise.all(promises).then(function (htmls) {
    return htmls.map(extractMovieInfo)
  })
}

async function getMovies() {
  let html = await getHtml('http://www.shaw.sg/sw_movie.aspx')
  let $ = cheerio.load(html)

  let titles = $('.panelMovieListRow tr:nth-child(1) > td:nth-child(2) > a').map(function () {
    let title = $(this).text()
    let bracketIdx = title.indexOf('[')
    if (bracketIdx > 0) return title.substring(0, bracketIdx - 1)
    return title
  }).toArray()
  titles = Array.from(new Set(titles))

  let movies = await getMoviesInfo(titles)
  return movies
}

export default async function (event, context) {
  try {
    let res = await getMovies()
    context.succeed(res)
  } catch (error) {
    context.fail(error)
  }
}
