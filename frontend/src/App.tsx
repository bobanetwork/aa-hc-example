import NetworkAlert from "@/components/AccountAlert";
import Navbar from "@/components/Navbar";
import "./App.css";
import Alert from "./components/Alert";
import { MetaMaskProvider } from "./context/MetamaskContext";
import "./styles/global.css";
import TokenPriceFetcher from "./components/TokenPriceFetcher";

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
            {<TokenPriceFetcher />}
          </div>
        </div>
      </MetaMaskProvider>
    </>
  );
}

export default App;
