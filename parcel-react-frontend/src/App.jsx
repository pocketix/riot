import {useState} from "react"

export const App = () => {

    const [count, setCount] = useState(1)

    const onClickHandler = () => setCount(currentCount => currentCount + 1)

    return <>
        <h1>Hello world!</h1>
        <button onClick={onClickHandler}>Increment count!</button>
        <p>Current count is: {count}</p>
    </>
}
