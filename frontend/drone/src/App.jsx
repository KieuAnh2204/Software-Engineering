import { Route, Switch, Link } from "wouter";
import DroneDashboard from "./DroneDashboard";
import DronePinScreen from "./DronePinScreen";
import DroneTracking from "./DroneTracking";

export default function App() {
  return (
    <div className="app-shell">
      <nav className="nav">
        <div className="flex items-center gap-2">
          <span role="img" aria-label="drone">
            🚁
          </span>
          <strong>Drone Interface</strong>
        </div>
        <div className="flex gap-3 text-sm text-slate-300">
          <Link href="/">Dashboard</Link>
        </div>
      </nav>

      <div className="content">
        <Switch>
          <Route path="/" component={DroneDashboard} />
          <Route path="/track/:orderId" component={DroneTracking} />
          <Route path="/verify/:orderId" component={DronePinScreen} />
        </Switch>
      </div>
    </div>
  );
}
