export default function moviesFormatter(movies) {
  return movies.map(function (movie, index) {
    return `${index + 1}. *${movie.title}* ${reviewsFormatter(movie)}`
  }).join("\n");
}

function reviewsFormatter(movie) {
  if (!movie.url) return ''
  return `([IMDb](${movie.url}): ${movie.rating})`
}
