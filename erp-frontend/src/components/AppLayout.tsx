import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar from "./Sidebar";

export default function AppLayout() {
  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#121212", color: "white" }}>
      <TopBar />
      <div style={{ display: "flex", width: "100%" }}>
        <Sidebar />
        <main style={{ flex: 1, minWidth: 0, padding: 24 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}