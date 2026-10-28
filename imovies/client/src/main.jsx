import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useDispatch } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import 'react-toastify/dist/ReactToastify.css';
import './styles.css';
import App from './App';
import { store } from './app/store';
import { logout } from './features/auth/authSlice';

function Root() {
  const dispatch = useDispatch();
  React.useEffect(() => {
    const onExpired = () => dispatch(logout());
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, [dispatch]);
  return <><App /><ToastContainer position="top-right" autoClose={3500} theme="dark" newestOnTop /></>;
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Provider store={store}><BrowserRouter><Root /></BrowserRouter></Provider></React.StrictMode>
);
