import NetworkAlert from "@/components/components/AccountAlert.tsx";
import Navbar from "@/components/components/Navbar.tsx";
import "./App.css";
import Alert from "./components/components/Alert.tsx";
import { MetaMaskProvider } from "./context/MetamaskContext";
import "./styles/global.css";
import MainComponent from "@/components/MainComponent.tsx";

function App() {
  return (
    <>
      <MetaMaskProvider>
        <div className="min-h-screen flex flex-col">
          <div className="sticky top-0 w-full gradient-bg-welcome">
            <Navbar />
            <Alert />
            <NetworkAlert />
          </div>
          <div className="flex-grow flex items-center justify-center">
            {<MainComponent />}
          </div>
        </div>
      </MetaMaskProvider>
    </>
  );
}

export default App;
