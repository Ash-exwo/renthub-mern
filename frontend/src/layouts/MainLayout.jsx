import { Outlet } from 'react-router'

function MainLayout() {
  return (
    <div className="main-layout">
      <header>
        Navbar will come here
      </header>

      <main>
        <Outlet />
      </main>

      <footer>
        Footer will come here
      </footer>
    </div>
  )
}

export default MainLayout