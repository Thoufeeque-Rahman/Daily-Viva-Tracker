import { Switch, Route } from "wouter";
import Sandbox from "./pages/Sandbox";
import Evaluation from "./pages/Evaluation";

export default function AppV2() {
  return (
    <Switch>
      <Route path="/v2/evaluation" component={Evaluation} />
      <Route path="/v2" component={Sandbox} />
    </Switch>
  );
}
