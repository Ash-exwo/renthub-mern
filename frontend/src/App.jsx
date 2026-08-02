function App() {
  return (
    <main className="app">
      <section className="welcome-card">
        <span className="welcome-card__label">
          Community Rental Marketplace
        </span>

        <h1 className="welcome-card__title">
          RentHub
        </h1>

        <p className="welcome-card__description">
          Rent what you need. Earn from what you own.
        </p>

        <div className="welcome-card__actions">
          <button
            type="button"
            className="button button--primary"
          >
            Explore Rentals
          </button>

          <button
            type="button"
            className="button button--secondary"
          >
            List an Item
          </button>
        </div>
      </section>
    </main>
  )
}

export default App