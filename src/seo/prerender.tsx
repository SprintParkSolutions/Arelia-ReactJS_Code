import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../context/AuthContext'
// The browser mounts the interactive app over this static initial view.
export function renderPage(pathname: string) {
  return renderToString(<AuthProvider><StaticRouter location={pathname}><App /></StaticRouter></AuthProvider>)
}
