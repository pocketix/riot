import React from "react"
import {Outlet} from "react-router-dom"
import styles from "./SideNavigation.module.scss"
import SideNavigationButton from "../side-navigation-button/SideNavigationButton";

const SideNavigation: React.FC = () => {

    return <div className={styles.outerContainer}>
        <div className={styles.navigationContainer}>
            <SideNavigationButton route="/" text="Homepage" />
            <SideNavigationButton route="/apollo-sandbox" text="Apollo Sandbox Page" />
        </div>
        <div className={styles.outletContainer}>
            <Outlet />
        </div>
    </div>
}

export default SideNavigation
