import React from "react"
import {Link, Outlet} from "react-router-dom"
import styles from "./MainLayout.module.scss"

const MainLayout: React.FC = () => {

    return <div className={styles.outerContainer}>
        <div className={styles.sidePanel}>
            <CustomLink route="/" text="Homepage" />
            <CustomLink route="/dtd" text="DTD Page" />
            <CustomLink route="/apollo-sandbox" text="Apollo Sandbox Page" />
        </div>
        <div className={styles.outletContainer}>
            <Outlet />
        </div>
    </div>
}

export default MainLayout

interface CustomLinkProps {
    route: string
    text: string
}

const CustomLink: React.FC<CustomLinkProps> = ({route, text}) => {

    return <div className={styles.customLink}>
        <Link to={route}>{text}</Link>
    </div>
}
