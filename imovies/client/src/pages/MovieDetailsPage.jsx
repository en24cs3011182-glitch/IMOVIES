import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/http';
import { EmptyState, Loader } from '../components/Feedback';

const dateValue = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export default function MovieDetailsPage() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [day, setDay] = useState(dateValue(new Date()));
  const [loading, setLoading] = useState(true);
  const [showsLoading, setShowsLoading] = useState(false);
  const [days] = useState(() => Array.from({ length: 5 }, (_, i) => {
    const date = new Date(); date.setDate(date.getDate() + i); return date;
  }));

  useEffect(() => {
    let active = true;
    api.get(`/movies/${id}`).then(({ data }) => { if (active) setMovie(data.data); })
      .catch((error) => toast.error(error.response?.data?.message || 'Could not load movie'))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    let active = true;
    setShowsLoading(true);
    api.get('/shows', { params: { movie: id, date: day, limit: 50 } })
      .then(({ data }) => { if (active) setShows(data.data.items); })
      .catch(() => { if (active) setShows([]); toast.error('Could not load showtimes'); })
      .finally(() => { if (active) setShowsLoading(false); });
    return () => { active = false; };
  }, [id, day]);

  if (loading) return <div className="container py-5"><Loader label="Loading movie…" /></div>;
  if (!movie) return <div className="container py-5"><EmptyState title="Movie not found" detail="It may have left the screen." /></div>;
  const grouped = Object.values(shows.reduce((groups, show) => {
    const theatreId = show.theatre?._id || 'unknown';
    if (!groups[theatreId]) groups[theatreId] = { theatre: show.theatre, shows: [] };
    groups[theatreId].shows.push(show);
    return groups;
  }, {}));

  return <main className="container py-4 py-lg-5">
    <Link to="/" className="back-link">? All movies</Link>
    <section className="detail-hero row g-4 g-lg-5 align-items-center mt-2">
      <div className="col-5 col-md-4 col-lg-3"><div className="detail-poster">{movie.posterUrl ? <img src={movie.posterUrl} alt={`${movie.title} poster`} /> : <div className="poster-fallback"><span>IMOVIES PRESENTS</span><strong>{movie.title}</strong><i>NOW SHOWING</i></div>}</div></div>
      <div className="col-7 col-md-8 col-lg-9"><p className="eyebrow">FEATURED FILM</p><h1 className="display-5 fw-bold">{movie.title}</h1><div className="d-flex flex-wrap gap-2 my-3"><span className="badge text-bg-primary">{movie.rating}</span>{movie.genres?.map((genre) => <span className="genre-chip" key={genre}>{genre}</span>)}</div><p className="text-secondary">{movie.durationMins} min{movie.languages?.length ? ` · ${movie.languages.join(', ')}` : ''}</p><p className="detail-description">{movie.description || 'A story made for the big screen.'}</p>{movie.cast?.length > 0 && <p className="small"><span className="text-secondary">Starring </span>{movie.cast.join(', ')}</p>}{movie.trailerUrl && <a className="btn btn-outline-light btn-sm mt-2" href={movie.trailerUrl} target="_blank" rel="noreferrer">Watch trailer ?</a>}</div>
    </section>
    <section className="showtimes-section mt-5"><div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3"><div><p className="eyebrow mb-2">PICK YOUR SCREENING</p><h2 className="h3 mb-0">Showtimes</h2></div><div className="date-tabs" role="tablist" aria-label="Show date">{days.map((date) => { const value = dateValue(date); return <button key={value} className={`date-tab${day === value ? ' active' : ''}`} onClick={() => setDay(value)}><span>{date.toLocaleDateString(undefined, { weekday: 'short' })}</span><strong>{date.getDate()}</strong></button>; })}</div></div>
      {showsLoading ? <Loader label="Finding showtimes…" /> : grouped.length ? <div className="theatre-list mt-4">{grouped.map(({ theatre, shows: theatreShows }) => <article className="theatre-show-card" key={theatre?._id}><div><h3 className="h6 mb-1">{theatre?.name || 'Cinema'}</h3><span className="small text-secondary">{theatre?.city}{theatre?.address ? ` · ${theatre.address}` : ''}</span></div><div className="show-time-buttons">{theatreShows.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)).map((show) => <Link key={show._id} className="show-time-btn" to={`/shows/${show._id}`}>{new Date(show.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}<small>{show.language}</small></Link>)}</div></article>)}</div> : <EmptyState title="No showtimes for this date" detail="Try another date or check back soon." />}
    </section>
  </main>;
}
