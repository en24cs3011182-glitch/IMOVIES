import { Link } from 'react-router-dom';
export default function MovieCard({ movie }) {
  return <article className="movie-card h-100">
    <Link className="movie-poster" to={`/movies/${movie._id}`} aria-label={`View ${movie.title}`}>
      {movie.posterUrl ? <img src={movie.posterUrl} alt={`${movie.title} poster`} loading="lazy" /> : <div className="poster-fallback"><span>NOW SHOWING</span><strong>{movie.title}</strong><i>IMOVIES</i></div>}
      <span className="poster-rating">{movie.rating || 'UA'}</span>
    </Link>
    <div className="movie-card-body">
      <div className="d-flex flex-wrap gap-1 mb-2">{(movie.genres || []).slice(0, 2).map((genre) => <span className="genre-chip" key={genre}>{genre}</span>)}</div>
      <h3 className="h6 mb-1"><Link className="text-decoration-none text-light" to={`/movies/${movie._id}`}>{movie.title}</Link></h3>
      <div className="small text-secondary">{movie.durationMins ? `${movie.durationMins} min` : 'Feature film'}{movie.languages?.length ? ` · ${movie.languages.join(', ')}` : ''}</div>
    </div>
  </article>;
}
