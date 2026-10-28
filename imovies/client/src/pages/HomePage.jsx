import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMovies } from '../features/movies/moviesSlice';
import MovieFilters from '../components/MovieFilters';
import MovieCard from '../components/MovieCard';
import { EmptyState, Loader, Pagination } from '../components/Feedback';

const blank = { q: '', genre: '', language: '', city: '', date: '' };
export default function HomePage() {
  const dispatch = useDispatch();
  const { items, pagination, loading, error } = useSelector((state) => state.movies);
  const [draft, setDraft] = useState(blank);
  const [filters, setFilters] = useState(blank);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = Object.fromEntries(Object.entries({ ...filters, page, limit: 12 }).filter(([, value]) => value !== ''));
    dispatch(fetchMovies(params));
  }, [dispatch, filters, page]);

  const search = () => { setFilters(draft); setPage(1); };
  const reset = () => { setDraft(blank); setFilters(blank); setPage(1); };

  return <>
    <section className="hero-section">
      <div className="container hero-content">
        <p className="eyebrow">YOUR NEXT MOVIE NIGHT STARTS HERE</p>
        <h1>Good stories.<br /><span>Great seats.</span></h1>
        <p className="hero-copy">Find the film you love, choose your seats, and settle in.</p>
        <a className="btn btn-primary btn-lg" href="#now-showing">Explore movies <span aria-hidden="true">?</span></a>
        <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" /><div className="hero-ticket">IM<br />AX</div>
      </div>
    </section>
    <section className="container py-5" id="now-showing">
      <div className="section-heading d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
        <div><p className="eyebrow mb-2">ON THE BIG SCREEN</p><h2 className="mb-0">Now showing</h2></div>
        <span className="text-secondary">{pagination.total} films to discover</span>
      </div>
      <MovieFilters filters={draft} onChange={setDraft} onSubmit={search} onReset={reset} />
      {loading ? <Loader label="Finding your next favorite…" /> : error ? <div className="alert alert-danger mt-4">{error}</div> : items.length ? <>
        <div className="row g-3 g-lg-4 mt-3">{items.map((movie) => <div className="col-6 col-md-4 col-xl-3" key={movie._id}><MovieCard movie={movie} /></div>)}</div>
        <Pagination page={pagination.page} pages={pagination.pages} onChange={setPage} />
      </> : <EmptyState title="No movies found" detail="Try a different title, filter, city, or date." />}
    </section>
  </>;
}
