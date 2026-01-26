import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import AppRoot from "@/App"
import "@/lib/leaflet"
import "@/index.css"
import "leaflet/dist/leaflet.css"
import "leaflet-control-geocoder/dist/Control.Geocoder.css"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Toaster } from "sonner"

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById("root")!).render(
<React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <BrowserRouter>
            <AppRoot />
            <Toaster richColors position="top-right" />
        </BrowserRouter>
    </QueryClientProvider>
</React.StrictMode>
)