import "./Navbar.css";

import { Link } from "react-router-dom";

import Container from "../Container/Container";

function Navbar(){

    return(

        <header className="navbar">

            <Container>

                <div className="navbar__wrapper">

                    <Link
                        to="/"
                        className="navbar__logo"
                    >
                        RentHub
                    </Link>

                    <nav className="navbar__menu">

                        <Link to="/">
                            Home
                        </Link>

                        <Link to="/explore">
                            Explore
                        </Link>

                        <Link to="/login">
                            Login
                        </Link>

                        <Link to="/register">
                            Register
                        </Link>

                    </nav>

                </div>

            </Container>

        </header>

    )

}

export default Navbar;