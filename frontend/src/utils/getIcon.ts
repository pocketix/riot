import * as TbIcons from "react-icons/tb";

export function getIcon(iconName: string) {
  if (iconName === "") return null;
  if (!iconName.startsWith("Tb")) {
    console.warn(
      `Invalid icon name: "${iconName}". Only "Tb" icons are supported.`
    );
    return null;
  }

  const IconComponent = (TbIcons as Record<string, React.FC>)[iconName];

  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found.`);
    return null;
  }

  return IconComponent;
}
