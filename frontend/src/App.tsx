//import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {Analytics} from "@vercel/analytics/react"
import {SpeedInsights} from "@vercel/speed-insights/react"

function App() {


    return (
        <>
            <Analytics/>
            <SpeedInsights/>
        </>
        // <Router>
        //     <Routes>
        //
        //     </Routes>
        // </Router>
    );
}

export default App;
