import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'

/** Shell for authenticated pages. */
export default function AppLayout() {
  return (
    <>
      <Navbar />
      <main className="container">
        <Outlet />
      </main>
    </>
  )
}
