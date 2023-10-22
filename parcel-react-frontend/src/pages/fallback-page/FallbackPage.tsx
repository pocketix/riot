import React from "react"
import {Link} from "react-router-dom"

const FallbackPage: React.FC = () => {

    return <div>
        <h2>There is nothing here!</h2>
        <p>
            <Link to="/">Return to homepage</Link>
        </p>
    </div>
}

export default FallbackPage
