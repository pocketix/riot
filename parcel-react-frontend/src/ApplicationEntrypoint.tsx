import React, { useState } from "react"

const ApplicationEntrypoint: React.FC = () => {

    const [count, setCount] = useState<number>(1)

    const onClickHandler = () => setCount(currentCount => currentCount + 1)

    return (
        <>
            <h1>Hello world!</h1>
            <button onClick={onClickHandler}>Increment count!</button>
            <p>Current count is: {count}</p>
        </>
    )
}

export default ApplicationEntrypoint
