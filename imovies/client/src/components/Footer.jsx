import { Link } from 'react-router-dom';
export default function Footer() {
  return <footer className="site-footer mt-auto"><div className="container py-4 d-flex flex-column flex-sm-row justify-content-between gap-2"><Link className="text-light text-decoration-none fw-bold" to="/">IMOVIES</Link><span className="small text-secondary">A better seat for every story.</span><span className="small text-secondary">© {new Date().getFullYear()} IMovies</span></div></footer>;
}
