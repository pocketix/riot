import React, {useEffect, useState} from "react"

const fetchDataFromTheGoBackend = async (): Promise<any> => {

    try {
        const response: Response = await fetch("http://localhost:8080/fetch-data")
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`)
        }
        return await response.json()
    } catch (error) {
        console.error("There was a problem with the data fetching operation: ", error.message);
        throw error;
    }
}

const ApplicationEntrypoint: React.FC = () => {

    const [count, setCount] = useState<number>(1)

    const onClickHandler = () => setCount(currentCount => currentCount + 1)

    useEffect(() => {
        fetchDataFromTheGoBackend().then(data => console.log("Data from backend: ", data))
    }, []);

    return (
        <>
            <h1>Hello world!</h1>
            <button onClick={onClickHandler}>Increment count!</button>
            <p>Current count is: {count}</p>
        </>
    )
}

export default ApplicationEntrypoint
