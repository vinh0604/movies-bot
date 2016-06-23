import {assert} from 'chai'
import moviesFormatter from '../../../functions/default/moviesFormatter'

describe('moviesFormatter', () => {
  it('returns movies title with index if there is no reviews info', () => {
    let movies = [{ title: 'Lord of the rings' }]
    assert.equal('1. *Lord of the rings* ', moviesFormatter(movies))
  })

  it('returns movies title with index with review score if the is review info', () => {
    let movies = [{ title: 'Lord of the rings', url: 'https://imdb.com/title/123456', rating: 9.3 }]
    assert.equal('1. *Lord of the rings* ([IMDb](https://imdb.com/title/123456): 9.3)', moviesFormatter(movies))
  })

  it('shows each movie on each line', () => {
    let movies = [
      { title: 'Lord of the rings', url: 'https://imdb.com/title/123456', rating: 9.3 },
      { title: 'The dark knight', url: 'https://imdb.com/title/456789', rating: 9.0 },
    ]
    assert.equal('1. *Lord of the rings* ([IMDb](https://imdb.com/title/123456): 9.3)\n2. *The dark knight* ([IMDb](https://imdb.com/title/456789): 9)', moviesFormatter(movies))
  })
})
