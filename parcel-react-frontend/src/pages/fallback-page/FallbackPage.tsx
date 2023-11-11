import React from "react"
import styles from "./FallbackPage.module.scss"
import {CustomLink} from "../../components/main-layout/MainLayout"

const FallbackPage: React.FC = () => {

    return <div className={styles.fallbackPage}>
        <h1>There is nothing to be found on this URL...</h1>
        <CustomLink route="/" text="Return to Homepage" iconIdentifier="arrow_back"></CustomLink>
    </div>
}

export default FallbackPage
