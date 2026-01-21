import L from "leaflet"

export function createSpaceIcon(color: string) {
  return L.divIcon({
    className: "",
    html: `
      <svg width="32" height="32" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  })
}