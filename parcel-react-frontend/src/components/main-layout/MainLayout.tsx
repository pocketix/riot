import React from "react"
import {NavigateFunction, Outlet, useNavigate} from "react-router-dom"
import styles from "./MainLayout.module.scss"

const MainLayout: React.FC = () => {

    return <div className={styles.outerContainer}>
        <div className={styles.sidePanel}>
            <CustomLink route="/" text="Homepage" iconIdentifier="home" />
            <CustomLink route="/device-types" text="Device types" iconIdentifier="home_iot_device" />
            <CustomLink route="/apollo-sandbox" text="Apollo Sandbox" iconIdentifier="labs" />
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
    iconIdentifier: string
}

export const CustomLink: React.FC<CustomLinkProps> = ({route, text, iconIdentifier}) => {

    const navigate: NavigateFunction = useNavigate()

    return <div className={styles.customLink} onClick={() => navigate(route)}>
        <span className="material-symbols-outlined">{iconIdentifier}</span>
        <span>{text}</span>
    </div>
}
