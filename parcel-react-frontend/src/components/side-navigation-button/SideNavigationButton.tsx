import React from "react"
import styles from "./SideNavigationButton.module.scss"
import {Link} from "react-router-dom"

interface SideNavigationProps {
    route: string
    text: string
}

const SideNavigationButton: React.FC<SideNavigationProps> = ({route, text}) => {

    return <div className={styles.sideNavigationButton}>
        <Link to={route}>{text}</Link>
    </div>
}

export default SideNavigationButton
