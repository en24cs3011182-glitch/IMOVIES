export default function MovieFilters({ filters, onChange, onSubmit, onReset }) {
  const update = (field) => (event) => onChange({ ...filters, [field]: event.target.value });
  return <form className="filter-panel row g-2 align-items-end" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
    <div className="col-12 col-lg-4"><label htmlFor="movie-search" className="form-label">Search movies</label><input id="movie-search" className="form-control" placeholder="Search a title or story" value={filters.q || ''} onChange={update('q')} /></div>
    <div className="col-6 col-lg-2"><label htmlFor="genre-filter" className="form-label">Genre</label><input id="genre-filter" className="form-control" placeholder="e.g. Drama" value={filters.genre || ''} onChange={update('genre')} /></div>
    <div className="col-6 col-lg-2"><label htmlFor="language-filter" className="form-label">Language</label><input id="language-filter" className="form-control" placeholder="Any language" value={filters.language || ''} onChange={update('language')} /></div>
    <div className="col-6 col-lg-2"><label htmlFor="city-filter" className="form-label">City</label><input id="city-filter" className="form-control" placeholder="Your city" value={filters.city || ''} onChange={update('city')} /></div>
    <div className="col-6 col-lg-2"><label htmlFor="date-filter" className="form-label">Show date</label><input id="date-filter" type="date" className="form-control" value={filters.date || ''} onChange={update('date')} /></div>
    <div className="col-12 d-flex gap-2 justify-content-end mt-2"><button className="btn btn-primary px-4" type="submit">Find movies</button><button className="btn btn-outline-secondary" type="button" onClick={onReset}>Reset</button></div>
  </form>;
}
