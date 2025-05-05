import React from "react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Matches from "./components/Matches.js";
import Teams from "./components/Teams.js";
import Summary from "./components/Summary.js";

function App() {
    return (
        <Router>
            <div className="container">
                <h1>Sports Management</h1>
                <nav>
                    <Link to="/matches">Matches</Link> | <Link to="/teams">Teams</Link> | <Link to="/summary">Summary</Link>
                </nav>
                <Routes>
                    <Route path="/matches" element={<Matches />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/summary" element={<Summary/>} />

                </Routes>
            </div>
        </Router>
    );
}

export default App;
